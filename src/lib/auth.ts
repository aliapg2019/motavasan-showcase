import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');

export interface JWTPayload {
  userId: string;
  email: string;
  plan: string;
  role: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// Get session from cookie (for server-side API routes)
export async function getSession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

// Get session from request - supports both cookie and Authorization header
export async function getSessionFromRequest(request: NextRequest): Promise<JWTPayload | null> {
  // Try Authorization header first (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    if (payload) return payload;
  }

  // Try cookie
  const token = request.cookies.get('auth-token')?.value;
  if (token) {
    const payload = await verifyToken(token);
    if (payload) return payload;
  }

  return null;
}
