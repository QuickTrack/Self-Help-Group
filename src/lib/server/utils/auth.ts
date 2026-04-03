import { SignJWT, jwtVerify } from 'jose';
import { UserRole } from '../../../types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'githirioni-shg-secret-key-2024'
);

export async function createToken(userId: string, email: string, role: UserRole): Promise<string> {
  return new SignJWT({ userId, email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
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