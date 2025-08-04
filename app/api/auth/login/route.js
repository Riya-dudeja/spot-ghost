import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  await dbConnect();
  const { email, password } = await req.json();

  // Debug: log incoming email
  console.log('LOGIN_ATTEMPT', { email });

  const user = await User.findOne({ email });
  if (!user) {
    console.log('LOGIN_FAIL: user not found');
    return Response.json({ error: 'Invalid credentials: user not found' }, { status: 401 });
  }

  // Debug: log password hash
  console.log('LOGIN_USER_FOUND', { email, passwordHash: user.passwordHash });

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    console.log('LOGIN_FAIL: password mismatch');
    return Response.json({ error: 'Invalid credentials: password mismatch' }, { status: 401 });
  }

  // Debug: log JWT secret presence
  if (!JWT_SECRET) {
    console.log('LOGIN_FAIL: JWT_SECRET missing');
    return Response.json({ error: 'Server misconfiguration: JWT_SECRET missing' }, { status: 500 });
  }

  const token = jwt.sign(
    { userId: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Debug: log token
  console.log('LOGIN_SUCCESS', { email, token });

  const cookieStore = await cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    sameSite: 'lax',
  });

  return Response.json({ success: true });
}
