import { SignJWT, jwtVerify } from 'jose';
import { UserRole } from '../../../types';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
};

export async function createToken(userId: string, email: string, role: UserRole): Promise<string> {
  const JWT_SECRET = getJwtSecret();
  return new SignJWT({ userId, email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const JWT_SECRET = getJwtSecret();
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}