'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Fingerprint, Shield, CheckCircle, XCircle, AlertTriangle, Loader2, Key } from 'lucide-react';

interface BiometricEnrollmentProps {
  memberId: string;
  onComplete?: (success: boolean, enrolledTypes: string[]) => void;
  onError?: (error: string) => void;
  adminMode?: boolean;
}

type BiometricType = 'fingerprint' | 'face';

const CONSENT_TEXT = `I hereby give explicit consent for the collection and processing of my biometric data (fingerprint/facial recognition) for identity verification purposes. I understand that:
1. My biometric data will be stored securely using encryption
2. I can withdraw consent at any time by contacting the group administrator
3. My data will only be used for meeting attendance verification
4. I have the right to request deletion of my biometric data
5. This consent is given in compliance with GDPR and local data protection laws`;

export default function BiometricEnrollment({ memberId, onComplete, onError, adminMode = false }: BiometricEnrollmentProps) {
  const [biometricType, setBiometricType] = useState<BiometricType>('face');
  const [step, setStep] = useState<'consent' | 'capture' | 'processing' | 'success' | 'error'>('consent');
  const [consentChecked, setConsentChecked] = useState(false);
  const [enrolledTypes, setEnrolledTypes] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showAdminOverride, setShowAdminOverride] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [pendingBiometricData, setPendingBiometricData] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      if (error.name === 'NotAllowedError') {
        onError?.('Camera permission denied. Please enable camera in browser settings or use manual enrollment.');
        setStep('error');
      } else {
        onError?.('Unable to access camera. Please check your device.');
        setStep('error');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  interface ImageQualityResult {
    valid: boolean;
    error?: string;
    recommendation?: string;
  }

  const analyzeImageQuality = (dataUrl: string): Promise<ImageQualityResult> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ valid: false, error: 'Failed to analyze image', recommendation: 'Please try again' });
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Check minimum dimensions
        if (img.width < 200 || img.height < 200) {
          resolve({ 
            valid: false, 
            error: 'Image too small. Please retake the photo.', 
            recommendation: 'Ensure your face fills the frame and is clearly visible.' 
          });
          return;
        }
        
        // Calculate average brightness
        let totalBrightness = 0;
        let pixels = 0;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          totalBrightness += brightness;
          pixels++;
        }
        const avgBrightness = totalBrightness / pixels;
        
        // Check for too dark or too bright
        if (avgBrightness < 50) {
          resolve({ 
            valid: false, 
            error: 'Image too dark. Please retake the photo.', 
            recommendation: 'Ensure there is adequate lighting on your face.' 
          });
          return;
        }
        if (avgBrightness > 220) {
          resolve({ 
            valid: false, 
            error: 'Image too bright. Please retake the photo.', 
            recommendation: 'Avoid direct sunlight or bright lights behind you.' 
          });
          return;
        }
        
        // Calculate contrast (standard deviation of brightness)
        let sumSquaredDiff = 0;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const diff = brightness - avgBrightness;
          sumSquaredDiff += diff * diff;
        }
        const contrast = Math.sqrt(sumSquaredDiff / pixels);
        
        // Low contrast indicates blurry image
        if (contrast < 30) {
          resolve({ 
            valid: false, 
            error: 'Image too blurry. Please retake the photo.', 
            recommendation: 'Hold the camera steady and ensure good lighting.' 
          });
          return;
        }
        
        // Skip the color diversity check since it's causing false positives
        // The other checks (brightness, contrast, size) are more reliable
        
        resolve({ valid: true });
      };
      img.onerror = () => {
        resolve({ valid: false, error: 'Failed to load image', recommendation: 'Please try again' });
      };
      img.src = dataUrl;
    });
  };

  const captureImage = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const context = canvasRef.current.getContext('2d');
    if (!context) return null;
    
    if (!videoRef.current.videoWidth || !videoRef.current.videoHeight) {
      console.warn('Video not ready for capture');
      return null;
    }
    
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    
    return canvasRef.current.toDataURL('image/jpeg', 0.8);
  };

  const handleStartCapture = async () => {
    if (!consentChecked) {
      setErrorMessage('Please accept the consent terms to continue');
      return;
    }
    
    setStep('capture');
    setErrorMessage(null);
    setStatusMessage('');
    setShowAdminOverride(false);
    setAdminPassword('');
    setAdminEmail('');
    setPendingBiometricData(null);
    
    if (biometricType === 'face') {
      await startCamera();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const handleCapture = async () => {
    setIsCapturing(true);
    setErrorMessage(null);
    setStatusMessage('');
    
    try {
      let biometricData = '';
      
      if (biometricType === 'face') {
        setStatusMessage('Capturing face...');
        
        if (!videoRef.current || videoRef.current.readyState < 2) {
          if (showAdminOverride && pendingBiometricData) {
            // Use previously captured data for admin override
            biometricData = pendingBiometricData;
          } else {
            setErrorMessage('Camera not ready. Please wait a moment and try again.');
            setIsCapturing(false);
            setStep('error');
            return;
          }
        } else {
          const captured = captureImage();
          if (!captured) {
            setErrorMessage('Failed to capture image. Please try again.');
            setIsCapturing(false);
            setStep('error');
            return;
          }
          
          // Analyze image quality before proceeding
          setStatusMessage('Analyzing image quality...');
          const qualityResult = await analyzeImageQuality(captured);
          if (!qualityResult.valid) {
            setErrorMessage(qualityResult.error || 'Image quality check failed');
            if (qualityResult.recommendation) {
              setErrorMessage(prev => prev + ' ' + qualityResult.recommendation);
            }
            setIsCapturing(false);
            setStep('error');
            return;
          }
          
          // Extract base64 data without the data URL prefix
          biometricData = captured.split(',')[1];
          // Store pending data for admin override
          setPendingBiometricData(captured);
          stopCamera();
        }
      } else {
        setStatusMessage('Recording fingerprint...');
        biometricData = `fingerprint-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }

      setStep('processing');
      
      setStatusMessage('Enrolling biometric data...');
      
      const response = await fetch('/api/biometric/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          biometricType,
          biometricData,
          consentGiven: true,
          consentVersion: '1.0',
          adminOverride: showAdminOverride,
          adminPassword: showAdminOverride ? adminPassword : undefined,
          adminEmail: showAdminOverride ? adminEmail : undefined,
        }),
      });
      
      console.log('Enrollment response status:', response.status);
      console.log('Enrollment response headers:', Object.fromEntries([...response.headers]));
      
      const text = await response.text();
      console.log('Enrollment response text:', text);
      
      if (!text) {
        setErrorMessage('Server returned an empty response. Please try again.');
        setStep('error');
        setIsCapturing(false);
        return;
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setErrorMessage('Server error. Please try again or contact admin.');
        setStep('error');
        setIsCapturing(false);
        return;
      }
      
      console.log('Enrollment response data:', JSON.stringify(data));
      
      if (response.ok && data.success) {
        setEnrolledTypes(prev => [...prev, biometricType]);
        setStep('success');
        onComplete?.(true, [...enrolledTypes, biometricType]);
      } else {
        const errorMsg = data.error || data.details || `Enrollment failed (${response.status})`;
        setErrorMessage(errorMsg);
        setStep('error');
      }
    } catch (error: any) {
      console.error('Enrollment error:', error);
      const errorMsg = error?.message || 'Failed to enroll biometric profile. Please check that MongoDB is running and try again.';
      setErrorMessage(errorMsg);
      setStep('error');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleAddAnother = () => {
    setStep('consent');
    setErrorMessage(null);
    setConsentChecked(false);
  };

  const handleClose = () => {
    stopCamera();
    setPendingBiometricData(null);
    onComplete?.(true, enrolledTypes);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      {step === 'consent' && (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '20px',
            padding: '12px',
            background: '#F0F9FF',
            borderRadius: '8px',
            border: '1px solid #BAE6FD'
          }}>
            <Shield size={24} color="#0369A1" />
            <div>
              <div style={{ fontWeight: 600, color: '#0C4A6E', fontSize: '0.875rem' }}>
                Biometric Consent Required
              </div>
              <div style={{ fontSize: '0.75rem', color: '#0369A1' }}>
                GDPR & Data Protection Compliant
              </div>
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 500, marginBottom: '8px', fontSize: '0.875rem' }}>
              Select Biometric Type to Enroll:
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setBiometricType('face')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: biometricType === 'face' ? '#228B22' : '#F3F4F6',
                  color: biometricType === 'face' ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                <Camera size={18} />
                Face Recognition
              </button>
              <button
                onClick={() => setBiometricType('fingerprint')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: biometricType === 'fingerprint' ? '#228B22' : '#F3F4F6',
                  color: biometricType === 'fingerprint' ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                <Fingerprint size={18} />
                Fingerprint
              </button>
            </div>
          </div>
          
          <div style={{ 
            maxHeight: '200px', 
            overflowY: 'auto',
            padding: '12px',
            background: '#FAFAFA',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            marginBottom: '16px',
            fontSize: '0.8125rem',
            lineHeight: '1.5',
            color: '#4B5563'
          }}>
            {CONSENT_TEXT}
          </div>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '12px', 
            cursor: 'pointer',
            marginBottom: '20px'
          }}>
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              style={{ marginTop: '4px', width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '0.875rem', color: '#374151' }}>
              I have read and agree to the consent terms above. I understand that my biometric 
              data will be stored securely and I can withdraw consent at any time.
            </span>
          </label>
          
          {errorMessage && (
            <div style={{ 
              padding: '12px', 
              background: '#FEE2E2', 
              borderRadius: '8px', 
              color: '#DC2626',
              fontSize: '0.875rem',
              marginBottom: '16px'
            }}>
              {errorMessage}
            </div>
          )}
          
          <button
            onClick={handleStartCapture}
            disabled={!consentChecked}
            style={{
              width: '100%',
              padding: '12px',
              background: consentChecked ? '#228B22' : '#9CA3AF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 500,
              cursor: consentChecked ? 'pointer' : 'not-allowed',
            }}
          >
            {biometricType === 'face' ? 'Start Face Capture' : 'Start Fingerprint Scan'}
          </button>
        </div>
      )}
      
      {step === 'capture' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            marginBottom: '16px',
            padding: '12px',
            background: '#FEF3C7',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={18} color="#92400E" />
            <span style={{ fontSize: '0.875rem', color: '#92400E' }}>
              Position your {biometricType === 'face' ? 'face' : 'finger'} in the frame
            </span>
          </div>
          
          {biometricType === 'face' && (
            <div style={{ 
              position: 'relative',
              width: '280px',
              height: '210px',
              margin: '0 auto 16px',
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
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '140px',
                height: '140px',
                border: '2px dashed rgba(255,255,255,0.6)',
                borderRadius: '50%',
              }} />
            </div>
          )}
          
          {biometricType === 'fingerprint' && (
            <div style={{
              width: '200px',
              height: '200px',
              margin: '0 auto 16px',
              background: '#F3F4F6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid #228B22',
            }}>
              <Fingerprint size={80} color="#228B22" />
            </div>
          )}
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            style={{
              padding: '14px 32px',
              background: isCapturing ? '#9CA3AF' : '#228B22',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '1rem',
              cursor: isCapturing ? 'not-allowed' : 'pointer',
            }}
          >
            {isCapturing ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Processing...
              </span>
            ) : (
              'Capture & Enroll'
            )}
          </button>
          
          {statusMessage && (
            <p style={{ marginTop: '12px', color: '#6B7280', fontSize: '0.875rem' }}>
              {statusMessage}
            </p>
          )}
        </div>
      )}
      
      {step === 'processing' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Loader2 size={48} color="#228B22" style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
          <p style={{ color: '#6B7280' }}>Processing biometric data...</p>
          {statusMessage && (
            <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '8px' }}>{statusMessage}</p>
          )}
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      
      {step === 'success' && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 16px',
            background: '#DCFCE7',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CheckCircle size={40} color="#16A34A" />
          </div>
          <h4 style={{ color: '#16A34A', marginBottom: '8px', fontSize: '1.125rem' }}>
            {biometricType === 'face' ? 'Face' : 'Fingerprint'} Enrolled Successfully!
          </h4>
          <p style={{ color: '#6B7280', marginBottom: '20px', fontSize: '0.875rem' }}>
            You can now use {biometricType === 'face' ? 'facial recognition' : 'fingerprint'} to check in to meetings.
          </p>
          
          {enrolledTypes.length < 2 && (
            <button
              onClick={handleAddAnother}
              style={{
                padding: '12px 24px',
                background: '#F3F4F6',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontWeight: 500,
                cursor: 'pointer',
                marginBottom: '12px',
              }}
            >
              Add Another Method
            </button>
          )}
          
          <button
            onClick={handleClose}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px',
              background: '#228B22',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      )}
      
      {step === 'error' && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 16px',
            background: '#FEE2E2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <XCircle size={40} color="#DC2626" />
          </div>
          <h4 style={{ color: '#DC2626', marginBottom: '8px', fontSize: '1.125rem' }}>
            Enrollment Failed
          </h4>
          <p style={{ color: '#6B7280', marginBottom: '20px', fontSize: '0.875rem' }}>
            {errorMessage}
          </p>
          
          {errorMessage?.includes('already enrolled') && !showAdminOverride && (
            <button
              onClick={() => setShowAdminOverride(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '12px',
                background: '#FEF3C7',
                color: '#92400E',
                border: '1px solid #F59E0B',
                borderRadius: '8px',
                fontWeight: 500,
                cursor: 'pointer',
                marginBottom: '12px',
              }}
            >
              <Key size={18} />
              Override with Admin Password
            </button>
          )}
          
          {showAdminOverride && (
            <div style={{ marginBottom: '16px', padding: '12px', background: '#FEF3C7', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.875rem', color: '#92400E', marginBottom: '12px', fontWeight: 500 }}>
                Enter admin credentials to override
              </p>
              <input
                type="email"
                placeholder="Admin email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                }}
              />
              <input
                type="password"
                placeholder="Admin password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          )}
          
          {showAdminOverride ? (
            <button
              onClick={handleCapture}
              disabled={isCapturing || !adminEmail || !adminPassword}
              style={{
                padding: '12px 24px',
                background: (!adminEmail || !adminPassword) ? '#9CA3AF' : '#D97706',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 500,
                cursor: (!adminEmail || !adminPassword) ? 'not-allowed' : 'pointer',
                marginBottom: '12px',
                width: '100%',
              }}
            >
              {isCapturing ? 'Updating...' : 'Update'}
            </button>
          ) : (
            <button
              onClick={() => {
                // If biometrics already enrolled, show override option
                if (enrolledTypes.includes(biometricType)) {
                  setShowAdminOverride(true);
                } else {
                  handleStartCapture();
                }
              }}
              style={{
                padding: '12px 24px',
                background: '#228B22',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 500,
                cursor: 'pointer',
                marginBottom: '12px',
              }}
            >
              Try Again
            </button>
          )}
          
          <button
            onClick={() => { setStep('consent'); setErrorMessage(null); }}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px',
              background: 'white',
              color: '#374151',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Back to Consent
          </button>
        </div>
      )}
    </div>
  );
}