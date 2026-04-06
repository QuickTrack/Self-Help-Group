# Biometric Authentication System

## Overview

The biometric system provides secure identity verification for member check-in at meetings using facial recognition or fingerprint templates. All biometric data is stored in encrypted, hashed format with explicit GDPR-compliant consent.

## Architecture

### Database Schema

#### Member Model Updates
```typescript
interface Member {
  // Existing fields...
  biometricConsentGiven: boolean;      // Explicit consent status
  biometricConsentDate: Date;          // When consent was given
  biometricConsentVersion: string;     // Consent form version
  biometricEnrolled: boolean;          // Has enrolled at least one biometric
}
```

#### BiometricProfile Model
```typescript
interface BiometricProfile {
  _id: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;   // Reference to Member
  biometricType: 'fingerprint' | 'face' | 'iris';
  biometricTemplate: string;           // SHA-256 hashed template
  hashAlgorithm: 'sha256' | 'sha512' | 'bcrypt';
  enrolledAt: Date;
  lastUsed: Date;
  isActive: boolean;
  consentGiven: boolean;
  consentDate: Date;
}
```

### API Endpoints

#### 1. Enroll Biometric
`POST /api/biometric/enroll`

**Request Body:**
```json
{
  "memberId": "string",
  "biometricType": "face" | "fingerprint",
  "biometricData": "base64-encoded-data",
  "consentGiven": true,
  "consentVersion": "1.0"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Biometric profile enrolled successfully",
  "profile": {
    "id": "string",
    "biometricType": "face",
    "enrolledAt": "2024-01-01T00:00:00Z"
  }
}
```

**Security Features:**
- Explicit consent required before enrollment
- Template stored as SHA-256 hash (one-way encryption)
- Audit trail with enrollment timestamp
- Consent version tracking for compliance

#### 2. Verify Biometric
`POST /api/biometric/verify`

**Request Body:**
```json
{
  "meetingId": "string",
  "memberId": "string",
  "biometricType": "face" | "fingerprint",
  "biometricData": "base64-encoded-data",
  "deviceId": "string"
}
```

**Response:**
```json
{
  "verified": true,
  "bonusAmount": 1000,
  "memberId": "string",
  "name": "John Doe",
  "attendance": {
    "_id": "string",
    "timestamp": "2024-01-01T10:00:00Z"
  }
}
```

**Security Features:**
- Real-time biometric matching against stored hash
- Meeting validation before check-in
- Device ID tracking for audit
- Automatic bonus allocation on success

## GDPR Compliance

### Consent Requirements
1. **Explicit Consent**: Users must actively check a consent box
2. **Informed Consent**: Full explanation of data usage provided
3. **Withdrawal Rights**: Members can request deletion at any time
4. **Data Minimization**: Only template hashes stored, not raw biometric data
5. **Purpose Limitation**: Data used only for meeting attendance

### Consent Text
```
I hereby give explicit consent for the collection and processing of my 
biometric data (fingerprint/facial recognition) for identity verification 
purposes. I understand that:
1. My biometric data will be stored securely using encryption
2. I can withdraw consent at any time by contacting the group administrator
3. My data will only be used for meeting attendance verification
4. I have the right to request deletion of my biometric data
5. This consent is given in compliance with GDPR and local data protection laws
```

## UI Components

### BiometricEnrollment Component
- Consent form display with GDPR-compliant text
- Biometric type selection (face/fingerprint)
- Real-time camera preview for face capture
- Simulated fingerprint capture interface
- Success/error states with retry options

### BiometricCheckIn Component
- Real-time camera feed for face capture
- Face/fingerprint mode toggle
- Manual search fallback for non-enrolled members
- Attendance list with verification status
- Bonus payment tracking

## Security Considerations

1. **Data at Rest**: Template hashes stored in MongoDB
2. **One-way Hashing**: SHA-256 prevents reverse engineering
3. **Audit Logging**: All verification attempts logged
4. **Rate Limiting**: Prevent brute-force attacks
5. **Device Tracking**: Device IDs for fraud prevention

## Testing Checklist

- [ ] Enrollment with valid consent
- [ ] Enrollment rejection without consent
- [ ] Duplicate enrollment prevention
- [ ] Verification with correct biometric
- [ ] Verification rejection with wrong biometric
- [ ] Already checked-in detection
- [ ] Manual check-in fallback
- [ ] Audit log generation
- [ ] Consent withdrawal handling

## Performance Notes

- Template matching uses constant-time comparison
- Camera initialization < 500ms
- Verification response < 200ms
- Auto-refresh attendance every 5 seconds