'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Camera,
  Fingerprint,
  Search,
  CheckCircle,
  XCircle,
  X,
  RefreshCw,
  Users,
  Clock,
  AlertCircle,
  User,
  Loader2,
  HandHeart,
  Video,
  ChevronDown,
  Keyboard,
  Banknote
} from 'lucide-react';
import { useStore } from '../stores/useStore';

interface Member {
  _id: string;
  memberId: string;
  fullName: string;
  photoUrl?: string;
  idNumber?: string;
  phoneNumber?: string;
  status: string;
}

interface AttendanceRecord {
  _id?: string;
  memberId: string;
  totalContribution?: number;
  name: string;
  photoUrl?: string | null;
  status: string;
  bonusAllocated: boolean;
  bonusAmount: number;
  bonusPaid?: boolean;
  contributionAmount: number;
  contributionPaid?: boolean;
  timestamp?: string;
  checkInMethod?: string;
}

interface BiometricCheckInProps {
  meetingId: string;
  onClose?: () => void;
}

type ScanMode = 'idle' | 'scanning' | 'processing' | 'success' | 'failed';

const cardStyles = {
  container: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    padding: '24px',
  },
  sectionTitle: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '12px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '0.875rem',
    outline: 'none',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default function BiometricCheckIn({ meetingId, onClose }: BiometricCheckInProps) {
  const storeMembers = useStore((state) => state.members);
  const [scanMode, setScanMode] = useState<ScanMode>('idle');
  const [biometricType, setBiometricType] = useState<'face' | 'fingerprint'>('face');
  const [deviceId] = useState(() => `device-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  const getContributionAmount = (record: AttendanceRecord) => {
    if (!financialSettings) return 0;
    const totalContrib = memberContributions[record.memberId] || 0;
    const meetingBudget = financialSettings.meetingBudget || 0;
    return Math.max(0, totalContrib - meetingBudget);
  };
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [financialSettings, setFinancialSettings] = useState<{
    bonusPerAttendance: number;
    shareValue: number;
    interestRate: number;
    monthlyContribution: number;
    meetingBudget: number;
  } | null>(null);
  const [paymentType, setPaymentType] = useState<'bonus' | 'contribution'>('bonus');
  const [memberContributions, setMemberContributions] = useState<Record<string, number>>({});
  const [lastVerifiedMember, setLastVerifiedMember] = useState<{
    name: string;
    photoUrl?: string;
    bonusAmount: number;
  } | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogs, setAuditLogs] = useState<Array<{
    timestamp: string;
    deviceId: string;
    outcome: string;
    memberId?: string;
  }>>([]);
  const [showBonusPaidModal, setShowBonusPaidModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [attendanceSearch, setAttendanceSearch] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isCameraReady = useRef(false);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const res = await fetch('/api/members?limit=500');
        if (!res.ok) {
          console.error('Failed to fetch members:', res.status);
          return;
        }
        const data = await res.json();
        if (data.members?.length > 0) {
          const { addMember, members: existingMembers } = useStore.getState();
          if (existingMembers.length === 0) {
            data.members.forEach((member: any) => addMember(member));
          }
        }
      } catch (error) {
        console.error('Failed to load members:', error);
      }
    };
    loadMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    const activeMembers = storeMembers.filter((m: any) => m.status === 'active');
    const q = searchQuery.toLowerCase();
    if (!q) return activeMembers;
    return activeMembers.filter((m: any) => 
      m.fullName?.toLowerCase().includes(q) ||
      m.memberId?.toLowerCase().includes(q) ||
      m.phoneNumber?.includes(q) ||
      (m.idNumber && m.idNumber.includes(q))
    );
  }, [storeMembers, searchQuery]);

  const alreadyCheckedIn = useMemo(() => {
    return new Set(attendanceList.map(a => a.memberId));
  }, [attendanceList]);

  const fetchAttendance = useCallback(async () => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}/attendance`);
      if (response.ok) {
        const data = await response.json();
        setAttendanceList(data.attendance || []);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoadingAttendance(false);
    }
  }, [meetingId]);

  useEffect(() => {
    fetchAttendance();
    
    pollingRef.current = setInterval(fetchAttendance, 5000);
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchAttendance]);

  useEffect(() => {
    const loadFinancialSettings = async () => {
      try {
        const res = await fetch('/api/financial-settings');
        const data = await res.json();
        if (data.settings) {
          setFinancialSettings(data.settings);
        }
      } catch (error) {
        console.error('Failed to load financial settings:', error);
      }
    };
    loadFinancialSettings();
    const interval = setInterval(loadFinancialSettings, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadMemberContributions = async () => {
      try {
        const res = await fetch('/api/contributions?limit=1000');
        const data = await res.json();
        if (data.contributions) {
          const contribMap: Record<string, number> = {};
          data.contributions.forEach((c: any) => {
            const memberId = typeof c.member === 'string' ? c.member : c.member?._id;
            if (memberId) {
              contribMap[memberId] = (contribMap[memberId] || 0) + c.amount;
            }
          });
          setMemberContributions(contribMap);
        }
      } catch (error) {
        console.error('Failed to load contributions:', error);
      }
    };
    loadMemberContributions();
  }, []);

  const initializeCamera = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 240 }
      });
      
      if (!videoRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return false;
      }
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error('No video ref'));
          return;
        }
        
        const onCanPlay = () => {
          videoRef.current?.removeEventListener('canplay', onCanPlay);
          videoRef.current?.removeEventListener('error', onError);
          resolve();
        };
        
        const onError = () => {
          videoRef.current?.removeEventListener('canplay', onCanPlay);
          videoRef.current?.removeEventListener('error', onError);
          reject(new Error('Video load error'));
        };
        
        videoRef.current.addEventListener('canplay', onCanPlay);
        videoRef.current.addEventListener('error', onError);
        
        if (videoRef.current.readyState >= 2) {
          resolve();
        }
      });
      
      await videoRef.current.play();
      isCameraReady.current = true;
      console.log('Camera initialized and ready');
      return true;
    } catch (error: any) {
      console.error('Camera error:', error);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      let errorMsg = 'Camera access failed. ';
      if (error.name === 'NotAllowedError' || error.code === 1) {
        errorMsg += 'Camera permission denied. Click "Start Scan" to prompt for permission again, or enable camera in browser settings.';
      } else if (error.name === 'NotFoundError' || error.code === 2) {
        errorMsg += 'No camera found on this device.';
      } else if (error.name === 'NotReadableError' || error.code === 3) {
        errorMsg += 'Camera is in use by another application.';
      } else {
        errorMsg += 'Please check permissions and try again.';
      }
      setErrorMessage(errorMsg);
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      isCameraReady.current = false;
    }
  }, []);

  const captureImage = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      console.log('No video or canvas ref');
      return null;
    }
    
    const video = videoRef.current;
    if (video.readyState !== 4) {
      console.log('Video not ready:', video.readyState);
      return null;
    }
    
    const context = canvasRef.current.getContext('2d');
    if (!context) {
      console.log('No canvas context');
      return null;
    }
    
    canvasRef.current.width = video.videoWidth || 320;
    canvasRef.current.height = video.videoHeight || 240;
    context.drawImage(video, 0, 0);
    
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.7);
    return dataUrl.split(',')[1];
  }, []);

  const handleStartScan = async () => {
    if (errorMessage) {
      setErrorMessage(null);
    }
    setScanMode('scanning');
    
    if (biometricType === 'face') {
      const success = await initializeCamera();
      if (!success) {
        setErrorMessage('Camera access required. Click "Start Scan" to grant permission.');
      } else {
        setTimeout(() => handleProcessScan(), 1500);
      }
    }
  };

  const handleProcessScan = async () => {
    setScanMode('processing');
    setErrorMessage(null);

    try {
      let biometricData = '';
      
      if (biometricType === 'face') {
        if (!isCameraReady.current) {
          throw new Error('Camera not ready. Please try again.');
        }
        
        biometricData = captureImage() || '';
        if (!biometricData) {
          throw new Error('Failed to capture image. Please ensure camera is working.');
        }
      } else {
        biometricData = `fingerprint-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }

      const response = await fetch(`/api/meetings/${meetingId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: 'manual-trigger',
          biometricType,
          biometricData,
          deviceId,
        }),
      });

      const data = await response.json();
      console.log('Verify response:', data);

      setAuditLogs(prev => [{
        timestamp: new Date().toISOString(),
        deviceId,
        outcome: data.verified ? 'SUCCESS' : 'FAILED',
        memberId: data.memberId,
      }, ...prev].slice(0, 20));

      if (data.verified) {
        setLastVerifiedMember({
          name: data.name || 'Member',
          photoUrl: data.photoUrl,
          bonusAmount: data.bonusAmount || 0,
        });
        setScanMode('success');
        fetchAttendance();
      } else {
        setErrorMessage(data.error || 'Verification failed. Please try again.');
        setScanMode('failed');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setErrorMessage(error.message || 'Verification service unavailable. Contact admin.');
      setScanMode('failed');
    }

    if (biometricType === 'face') {
      stopCamera();
    }
  };

  const handleManualSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const response = await fetch(`/api/members?search=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data.members || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleManualCheckIn = async (member: Member) => {
    if (alreadyCheckedIn.has(member._id)) {
      setErrorMessage('This member has already checked in');
      return;
    }
    
    setScanMode('processing');
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/meetings/${meetingId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member._id,
          biometricType: null,
          biometricData: null,
          deviceId,
        }),
      });

      const data = await response.json();
      console.log('Check-in response:', response.status, data);

      if (!response.ok) {
        if (data.alreadyCheckedIn) {
          setErrorMessage('Member has already checked in');
          setAttendanceList(prev => [...prev, {
            memberId: member._id,
            name: member.fullName,
            photoUrl: member.photoUrl,
            status: 'manual',
            bonusAllocated: true,
            bonusAmount: data.attendance?.bonusAmount || 0,
            contributionAmount: 0,
            timestamp: data.attendance?.verifiedAt,
            checkInMethod: 'manual',
          }]);
        } else {
          setErrorMessage(data.error || 'Check-in failed');
          setScanMode('failed');
        }
        return;
      }

      setAuditLogs(prev => [{
        timestamp: new Date().toISOString(),
        deviceId,
        outcome: 'MANUAL_CHECKIN',
        memberId: member._id,
      }, ...prev].slice(0, 20));

      if (data.verified || data.attendance?.status === 'verified' || data.attendance?.status === 'manual') {
        setLastVerifiedMember({
          name: data.attendance?.name || member.fullName,
          photoUrl: data.attendance?.photoUrl || member.photoUrl,
          bonusAmount: data.attendance?.bonusAmount || 0,
        });
        setScanMode('success');
        setSearchQuery('');
        setSearchResults([]);
        setManualMode(false);
        fetchAttendance();
      } else {
        setErrorMessage('Check-in failed. Please try again.');
        setScanMode('failed');
      }
    } catch (error) {
      setErrorMessage('Check-in service unavailable. Please try again.');
      setScanMode('failed');
    }
  };

  const handleRetry = () => {
    setScanMode('idle');
    setErrorMessage(null);
    setLastVerifiedMember(null);
    stopCamera();
  };

  const handleCancel = () => {
    stopCamera();
    if (onClose) onClose();
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', minHeight: '500px' }}>
      <div style={cardStyles.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A1A1A' }}>
            Check-In
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setBiometricType('face')}
              style={{
                ...cardStyles.button,
                padding: '8px 12px',
                background: biometricType === 'face' ? '#228B22' : '#F3F4F6',
                color: biometricType === 'face' ? 'white' : '#374151',
                border: 'none',
              }}
            >
              <Video size={16} />
              Face
            </button>
            <button
              onClick={() => setBiometricType('fingerprint')}
              style={{
                ...cardStyles.button,
                padding: '8px 12px',
                background: biometricType === 'fingerprint' ? '#228B22' : '#F3F4F6',
                color: biometricType === 'fingerprint' ? 'white' : '#374151',
                border: 'none',
              }}
            >
              <Fingerprint size={16} />
              Fingerprint
            </button>
          </div>
        </div>

        {scanMode === 'idle' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto 20px',
              background: '#F3F4F6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {biometricType === 'face' ? (
                <Camera size={48} color="#6B7280" />
              ) : (
                <Fingerprint size={48} color="#6B7280" />
              )}
            </div>
            <p style={{ color: '#6B7280', marginBottom: '20px' }}>
              {biometricType === 'face' 
                ? 'Position your face in the camera' 
                : 'Place your finger on the scanner'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleStartScan}
                style={{
                  ...cardStyles.button,
                  background: '#228B22',
                  color: 'white',
                  border: 'none',
                  padding: '12px 32px',
                }}
              >
                <Camera size={18} />
                Start Scan
              </button>
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]); setManualMode(true); }}
                style={{
                  ...cardStyles.button,
                  background: 'white',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  padding: '12px 24px',
                }}
              >
                <Keyboard size={18} />
                Manual
              </button>
            </div>
          </div>
        )}

        {scanMode === 'scanning' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            {biometricType === 'face' ? (
              <div style={{ 
                position: 'relative',
                width: '240px',
                height: '180px',
                margin: '0 auto 20px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '2px solid #228B22',
                background: '#000'
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '120px',
                  height: '120px',
                  border: '3px solid #22C55E',
                  borderRadius: '50%',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              </div>
            ) : (
              <div style={{
                width: '160px',
                height: '160px',
                margin: '0 auto 20px',
                background: '#F3F4F6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid #228B22',
                position: 'relative',
              }}>
                <Fingerprint size={64} color="#228B22" />
                <div style={{
                  position: 'absolute',
                  inset: '-8px',
                  border: '3px solid #22C55E',
                  borderRadius: '50%',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              </div>
            )}
            <p style={{ color: '#374151', marginBottom: '20px', fontWeight: 500 }}>
              {biometricType === 'face' ? 'Scanning your face...' : 'Scanning fingerprint...'}
            </p>
            {!isCameraReady.current && biometricType === 'face' && !errorMessage && (
              <p style={{ color: '#6B7280', marginBottom: '16px', fontSize: '0.875rem' }}>
                Click &quot;Start Camera&quot; to enable camera
              </p>
            )}
            {errorMessage && (
              <p style={{ color: '#DC2626', marginBottom: '16px', fontSize: '0.875rem' }}>
                {errorMessage}
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexDirection: 'column' }}>
              <button
                onClick={handleProcessScan}
                disabled={!isCameraReady.current}
                style={{
                  ...cardStyles.button,
                  background: isCameraReady.current ? '#228B22' : '#9CA3AF',
                  color: 'white',
                  border: 'none',
                  padding: '14px 32px',
                  fontSize: '1rem',
                  cursor: isCameraReady.current ? 'pointer' : 'not-allowed',
                }}
              >
                <Fingerprint size={18} />
                {biometricType === 'face' ? 'Capture Face' : 'Scan Fingerprint'}
              </button>
              {!isCameraReady.current && biometricType === 'face' && (
                <button
                  onClick={handleStartScan}
                  style={{
                    ...cardStyles.button,
                    background: 'white',
                    color: '#374151',
                    border: '1px solid #D1D5DB',
                    padding: '10px 24px',
                  }}
                >
                  <Camera size={18} />
                  Start Camera
                </button>
              )}
            </div>
          </div>
        )}

        {scanMode === 'failed' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 20px',
              background: '#FEE2E2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <XCircle size={40} color="#DC2626" />
            </div>
            <p style={{ color: '#DC2626', marginBottom: '20px', fontWeight: 500 }}>
              {errorMessage || 'Check-in failed'}
            </p>
            <button
              onClick={handleRetry}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: '#228B22',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                margin: '0 auto',
              }}
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          </div>
        )}

        {scanMode === 'idle' && manualMode && (
          <div style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#1A1A1A' }}>
                Manual Check-In
              </h4>
              <button 
                onClick={() => { setSearchQuery(''); setSearchResults([]); setManualMode(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} color="#6B7280" />
              </button>
            </div>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Search size={18} color="#9CA3AF" />
                </div>
                <input
                  type="text"
                  placeholder="Search member by name, ID, or phone..."
                  value={searchQuery}
                  onChange={async (e) => {
                    const query = e.target.value;
                    setSearchQuery(query);
                    if (query.length >= 1) {
                      setSearching(true);
                      try {
                        const res = await fetch(`/api/members?search=${encodeURIComponent(query)}&status=active&limit=20`);
                        const data = await res.json();
                        setSearchResults(data.members || []);
                      } catch (err) {
                        console.error('Search error:', err);
                        setSearchResults([]);
                      } finally {
                        setSearching(false);
                      }
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  style={{ 
                    ...cardStyles.input, 
                    paddingLeft: '40px',
                    paddingRight: '36px',
                  }}
                />
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <ChevronDown size={18} color="#9CA3AF" />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
              {searching ? (
                <p style={{ textAlign: 'center', color: '#6B7280', padding: '20px' }}>
                  Searching...
                </p>
              ) : searchResults.length > 0 ? (
                searchResults.map((member) => {
                  const isCheckedIn = alreadyCheckedIn.has(member._id);
                  return (
                    <div
                      key={member._id}
                      onClick={() => !isCheckedIn && handleManualCheckIn(member)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: isCheckedIn ? '#F3F4F6' : '#F9FAFB',
                        borderRadius: '8px',
                        cursor: isCheckedIn ? 'default' : 'pointer',
                        border: '1px solid #E5E7EB',
                        transition: 'all 0.2s',
                        opacity: isCheckedIn ? 0.6 : 1,
                      }}
                      onMouseOver={(e) => !isCheckedIn && (e.currentTarget.style.borderColor = '#228B22')}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: '#E5E7EB',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}>
                        {member.photoUrl ? (
                          <img src={member.photoUrl} alt={member.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <User size={20} color="#6B7280" />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: '0.9375rem', color: '#1A1A1A' }}>
                          {member.fullName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          {member.memberId} • {member.phoneNumber || 'No phone'}
                        </div>
                      </div>
                      {isCheckedIn ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          background: '#DCFCE7',
                          borderRadius: '20px',
                          color: '#16A34A',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}>
                          <CheckCircle size={12} />
                          Checked In
                        </div>
                      ) : (
                        <button
                          style={{
                            padding: '6px 12px',
                            background: '#228B22',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                          }}
                        >
                          Check In
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p style={{ textAlign: 'center', color: '#6B7280', padding: '20px' }}>
                  Type to search members...
                </p>
              )}
            </div>
          </div>
        )}

        {scanMode === 'success' && lastVerifiedMember && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 20px',
              background: '#DCFCE7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CheckCircle size={40} color="#16A34A" />
            </div>
            <p style={{ color: '#16A34A', marginBottom: '8px', fontWeight: 600, fontSize: '1.125rem' }}>
              Check-In Successful!
            </p>
            <p style={{ color: '#6B7280', marginBottom: '20px' }}>
              {lastVerifiedMember.name}
            </p>
            {lastVerifiedMember.bonusAmount > 0 && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: '#F0FDF4',
                borderRadius: '20px',
                color: '#16A34A',
                fontWeight: 600,
                marginBottom: '20px',
              }}>
                <HandHeart size={18} />
                +KES {lastVerifiedMember.bonusAmount.toLocaleString()} Bonus
              </div>
            )}
            <button
              onClick={() => {
                setScanMode('idle');
                setLastVerifiedMember(null);
                setErrorMessage(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: '#228B22',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                margin: '0 auto',
              }}
            >
              Check In Another Member
            </button>
          </div>
        )}
      </div>

      <div style={cardStyles.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A1A1A' }}>
            Attendance List
          </h3>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            padding: '4px 12px',
            background: '#DCFCE7',
            borderRadius: '20px',
            fontSize: '0.75rem',
            color: '#166534',
            fontWeight: 500,
          }}>
            <Users size={14} />
            {attendanceList.filter(a => a.status === 'verified' || a.status === 'manual').length} / {attendanceList.length}
          </div>
        </div>

        {/* Payment Type Toggle */}
        {financialSettings && (
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '16px',
            padding: '8px',
            background: paymentType === 'contribution' ? '#FEF3C7' : '#F0FDF4',
            borderRadius: '8px',
            border: '1px solid',
            borderColor: paymentType === 'contribution' ? '#FDE047' : '#BBF7D0',
          }}>
            <button
              onClick={() => setPaymentType('bonus')}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                background: paymentType === 'bonus' ? '#16A34A' : 'transparent',
                color: paymentType === 'bonus' ? 'white' : '#166534',
              }}
            >
              Bonus
            </button>
            <button
              onClick={() => setPaymentType('contribution')}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                background: paymentType === 'contribution' ? '#EAB308' : 'transparent',
                color: paymentType === 'contribution' ? 'white' : '#A16207',
              }}
            >
              Contribution
            </button>
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search by name..."
              value={attendanceSearch}
              onChange={(e) => setAttendanceSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {financialSettings && (
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: '16px',
            padding: '12px',
            background: paymentType === 'contribution' ? '#FEF3C7' : '#F0F9FF',
            borderRadius: '8px',
            border: '1px solid',
            borderColor: paymentType === 'contribution' ? '#FDE047' : '#BAE6FD',
          }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: paymentType === 'contribution' ? '#A16207' : '#0369A1', marginBottom: '4px' }}>Total Members</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: paymentType === 'contribution' ? '#713F12' : '#0C4A6E' }}>{attendanceList.length}</div>
            </div>
            {paymentType === 'bonus' ? (
              <>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#0369A1', marginBottom: '4px' }}>Bonus/Attendance</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0C4A6E' }}>KES {financialSettings.bonusPerAttendance.toLocaleString()}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#0369A1', marginBottom: '4px' }}>Total Bonus</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0C4A6E' }}>KES {(attendanceList.filter(a => a.bonusAllocated).length * financialSettings.bonusPerAttendance).toLocaleString()}</div>
                </div>
              </>
            ) : (
              <>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#A16207', marginBottom: '4px' }}>Meeting Budget</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#713F12' }}>KES {financialSettings.meetingBudget.toLocaleString()}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#A16207', marginBottom: '4px' }}>Total Contributions</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#713F12' }}>KES {attendanceList.reduce((sum, a) => sum + getContributionAmount(a), 0).toLocaleString()}</div>
                </div>
              </>
            )}
          </div>
        )}

        {loadingAttendance ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 size={32} color="#228B22" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : attendanceList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
            <Users size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <p>No attendees yet</p>
            <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Members will appear here after check-in</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
            {attendanceList
              .filter(a => !attendanceSearch || a.name.toLowerCase().includes(attendanceSearch.toLowerCase()))
              .map((record, idx) => (
              <div
                key={record.memberId || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: record.bonusAllocated ? '#F0FDF4' : '#F9FAFB',
                  borderRadius: '8px',
                  border: record.bonusAllocated ? '1px solid #BBF7D0' : '1px solid #E5E7EB',
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: record.photoUrl ? '#E5E7EB' : '#E0E7FF',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {record.photoUrl ? (
                    <img src={record.photoUrl} alt={record.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={20} color="#4F46E5" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.9375rem', color: '#1A1A1A' }}>
                    {record.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#6B7280' }}>
                    <Clock size={12} />
                    {formatTime(record.timestamp)}
                    {record.checkInMethod && (
                      <span style={{ 
                        padding: '2px 6px', 
                        background: record.checkInMethod === 'biometric' ? '#DBEAFE' : '#F3F4F6',
                        borderRadius: '4px',
                        fontSize: '0.625rem',
                      }}>
                        {record.checkInMethod === 'biometric' ? 'Bio' : 'Manual'}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {record.bonusPaid ? (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      padding: '4px 10px',
                      background: '#1E40AF',
                      borderRadius: '20px',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                    }}>
                      <CheckCircle size={12} />
                      Paid
                    </div>
                  ) : (paymentType === 'contribution') ? (
                    <>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '4px 10px',
                        background: '#EAB308',
                        borderRadius: '20px',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}>
                        <Banknote size={12} />
                        +{getContributionAmount(record).toLocaleString()}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedAttendance(record);
                          setShowBonusPaidModal(true);
                        }}
                        disabled={!record._id}
                        style={{
                          padding: '4px 8px',
                          background: '#FEF3C7',
                          border: '1px solid #FDE047',
                          borderRadius: '4px',
                          fontSize: '0.6875rem',
                          color: '#92400E',
                          cursor: record._id ? 'pointer' : 'not-allowed',
                          fontWeight: 500,
                        }}
                      >
                        Mark Paid
                      </button>
                    </>
                  ) : record.bonusAllocated ? (
                    <>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '4px 10px',
                        background: '#22C55E',
                        borderRadius: '20px',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}>
                        <HandHeart size={12} />
                        +{record.bonusAmount.toLocaleString()}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedAttendance(record);
                          setShowBonusPaidModal(true);
                        }}
                        disabled={!record._id}
                        style={{
                          padding: '4px 8px',
                          background: '#FEF3C7',
                          border: '1px solid #FDE047',
                          borderRadius: '4px',
                          fontSize: '0.6875rem',
                          color: '#92400E',
                          cursor: record._id ? 'pointer' : 'not-allowed',
                          fontWeight: 500,
                        }}
                      >
                        Mark Paid
                      </button>
                    </>
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      padding: '4px 10px',
                      background: '#FEF3C7',
                      borderRadius: '20px',
                      color: '#92400E',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                    }}>
                      Pending
                    </div>
                  )}
                  {record.status === 'verified' ? (
                    <CheckCircle size={18} color="#22C55E" />
                  ) : record.status === 'failed' ? (
                    <XCircle size={18} color="#DC2626" />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '16px' }}>
          <button
            onClick={() => setShowAuditLog(!showAuditLog)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: '#6B7280',
              fontSize: '0.75rem',
              cursor: 'pointer',
              padding: '8px 0',
            }}
          >
            <AlertCircle size={14} />
            {showAuditLog ? 'Hide' : 'Show'} Audit Log ({auditLogs.length})
          </button>
          
          {showAuditLog && (
            <div style={{ 
              marginTop: '8px', 
              padding: '12px', 
              background: '#F9FAFB', 
              borderRadius: '8px',
              maxHeight: '150px',
              overflowY: 'auto',
              fontSize: '0.75rem',
            }}>
              {auditLogs.length === 0 ? (
                <p style={{ color: '#9CA3AF', textAlign: 'center' }}>No logs yet</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <th style={{ textAlign: 'left', padding: '4px', color: '#6B7280' }}>Time</th>
                      <th style={{ textAlign: 'left', padding: '4px', color: '#6B7280' }}>Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '4px', color: '#374151' }}>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td style={{ 
                          padding: '4px', 
                          color: log.outcome === 'SUCCESS' ? '#16A34A' : log.outcome === 'MANUAL_CHECKIN' ? '#3B82F6' : '#DC2626',
                          fontWeight: 500,
                        }}>
                          {log.outcome}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
        </div>

        {showBonusPaidModal && selectedAttendance && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: '#FEF3C7',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <AlertCircle size={20} color="#92400E" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A1A1A' }}>Confirm Payment</h3>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>This action cannot be undone</p>
                </div>
              </div>

              <div style={{ marginBottom: '20px', padding: '16px', background: '#F9FAFB', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Member:</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1A1A1A' }}>{selectedAttendance.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Payment Type:</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: paymentType === 'contribution' ? '#A16207' : '#166534' }}>
                    {paymentType === 'contribution' ? 'Contribution' : 'Bonus'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Amount:</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: paymentType === 'contribution' ? '#A16207' : '#16A34A' }}>
                    KES {paymentType === 'contribution' 
                      ? getContributionAmount(selectedAttendance).toLocaleString() 
                      : selectedAttendance.bonusAmount.toLocaleString()}
                  </span>
                </div>
                {paymentType === 'contribution' && (
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '8px', padding: '8px', background: '#FEF3C7', borderRadius: '4px' }}>
                    Formula: Member's Total Contributions - Meeting Budget = {getContributionAmount(selectedAttendance).toLocaleString()}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #E5E7EB' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Deducted from:</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1A1A1A' }}>Group Savings</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowBonusPaidModal(false);
                    setSelectedAttendance(null);
                  }}
                  disabled={processingPayment}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'white',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#374151',
                    cursor: processingPayment ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setProcessingPayment(true);
                    try {
                      const response = await fetch('/api/attendance/pay-bonus', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          attendanceId: selectedAttendance._id,
                          memberId: selectedAttendance.memberId,
                          bonusAmount: selectedAttendance.bonusAmount,
                        }),
                      });
                      
                      const data = await response.json();
                      
                      if (!response.ok) {
                        alert(data.error || 'Payment failed');
                        return;
                      }

                      // Reset member contribution if payment type is contribution
                      if (paymentType === 'contribution') {
                        try {
                          // Deduct from member's savings
                          await fetch('/api/savings', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              memberId: selectedAttendance.memberId,
                              adjustment: -getContributionAmount(selectedAttendance),
                              reason: 'Meeting contribution payment',
                            }),
                          });
                          
                          // Save to kitty
                          const memberInfo = storeMembers.find((m: any) => m._id === selectedAttendance.memberId);
                          await fetch('/api/kitty', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              meetingId: meetingId,
                              memberId: selectedAttendance.memberId,
                              memberName: selectedAttendance.name,
                              memberIdStr: memberInfo?.memberId || '',
                              totalContribution: memberContributions[selectedAttendance.memberId] || 0,
                              amountPaid: getContributionAmount(selectedAttendance),
                            }),
                          });
                          
                          // Update local contribution tracking to 0
                          const memberKey = selectedAttendance.memberId;
                          setMemberContributions(prev => {
                            const updated = { ...prev };
                            updated[memberKey] = 0;
                            return updated;
                          });
                        } catch (e) {
                          console.error('Failed to reset contribution:', e);
                        }
                      }
                      
                      setAttendanceList(prev => prev.map(a => 
                        a._id === selectedAttendance._id 
                          ? { ...a, bonusPaid: true, contributionPaid: true }
                          : a
                      ));
                      setShowBonusPaidModal(false);
                      setSelectedAttendance(null);
                      fetchAttendance();
                      const paymentAmount = paymentType === 'contribution' 
                        ? getContributionAmount(selectedAttendance) 
                        : selectedAttendance.bonusAmount;
                      const paymentLabel = paymentType === 'contribution' ? 'Contribution' : 'Bonus';
                      alert(`${paymentLabel} of KES ${paymentAmount.toLocaleString()} marked as paid. Group savings deducted.`);
                    } catch (error) {
                      console.error('Payment error:', error);
                      alert('Failed to process payment');
                    } finally {
                      setProcessingPayment(false);
                    }
                  }}
                  disabled={processingPayment}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#DC2626',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'white',
                    cursor: processingPayment ? 'not-allowed' : 'pointer',
                    opacity: processingPayment ? 0.7 : 1,
                  }}
                >
                  {processingPayment ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}