import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

export async function verifyAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    
    if (!token || !token.value) {
      return null;
    }
    
    const decoded = jwt.verify(token.value, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await verifyAuth();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}
