import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/server/utils/auth';

const publicApiPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/groups',
  '/api/settings',
  '/api/meetings',
];

const publicGetPaths = [
  '/api/members',
  '/api/contributions',
  '/api/loans',
  '/api/savings',
  '/api/welfare',
  '/api/event-types',
  '/api/life-event-types',
  '/api/meetings',
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  if (publicApiPaths.some(p => path.startsWith(p))) {
    return NextResponse.next();
  }
  
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    if (path.startsWith('/api/') && publicGetPaths.some(p => path.startsWith(p))) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId as string);
  requestHeaders.set('x-user-email', payload.email as string);
  requestHeaders.set('x-user-role', payload.role as string);
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/api/:path*'],
};