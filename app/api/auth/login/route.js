import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { parseJsonOrError, loginBody } from '@/lib/validation';
import { enforceRateLimit, RateLimitPresets } from '@/lib/rateLimiter';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  // Rate limit per IP to mitigate brute-force attacks
  const rl = await enforceRateLimit(req, RateLimitPresets.authLogin);
  if (!rl.allowed) return rl.response;

  await dbConnect();
  // Strict input validation & sanitization
  const parsed = await parseJsonOrError(req, loginBody);
  if (!parsed.ok) return parsed.response;
  const { email, password } = parsed.data;

  const user = await User.findOne({ email });
  if (!user) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (!JWT_SECRET) {
    return Response.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const token = jwt.sign(
    { userId: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

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
