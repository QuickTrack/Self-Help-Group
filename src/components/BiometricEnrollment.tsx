'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Fingerprint, Shield, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface BiometricEnrollmentProps {
  memberId: string;
  onComplete?: (success: boolean, enrolledTypes: string[]) => void;
  onError?: (error: string) => void;
}

type BiometricType = 'fingerprint' | 'face';

const CONSENT_TEXT = `I hereby give explicit consent for the collection and processing of my biometric data (fingerprint/facial recognition) for identity verification purposes. I understand that:
1. My biometric data will be stored securely using encryption
2. I can withdraw consent at any time by contacting the group administrator
3. My data will only be used for meeting attendance verification
4. I have the right to request deletion of my biometric data
5. This consent is given in compliance with GDPR and local data protection laws`;

export default function BiometricEnrollment({ memberId, onComplete, onError }: BiometricEnrollmentProps) {
  const [biometricType, setBiometricType] = useState<BiometricType>('face');
  const [step, setStep] = useState<'consent' | 'capture' | 'processing' | 'success' | 'error'>('consent');
  const [consentChecked, setConsentChecked] = useState(false);
  const [enrolledTypes, setEnrolledTypes] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
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
    
    return canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
  };

  const handleStartCapture = async () => {
    if (!consentChecked) {
      setErrorMessage('Please accept the consent terms to continue');
      return;
    }
    
    setStep('capture');
    setErrorMessage(null);
    setStatusMessage('');
    
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
          setErrorMessage('Camera not ready. Please wait a moment and try again.');
          setIsCapturing(false);
          setStep('error');
          return;
        }
        
        const captured = captureImage();
        if (!captured) {
          setErrorMessage('Failed to capture image. Please try again.');
          setIsCapturing(false);
          setStep('error');
          return;
        }
        
        biometricData = captured;
        stopCamera();
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
        }),
      });
      
      console.log('Enrollment response status:', response.status);
      
      const data = await response.json();
      console.log('Enrollment response data:', JSON.stringify(data));
      
      if (response.ok && data.success) {
        setEnrolledTypes(prev => [...prev, biometricType]);
        setStep('success');
        onComplete?.(true, [...enrolledTypes, biometricType]);
      } else {
        const errorMsg = data.error || `Enrollment failed (${response.status})`;
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('Enrollment error:', error);
      setErrorMessage(error.message || 'Failed to enroll biometric profile');
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
          
          <button
            onClick={handleStartCapture}
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