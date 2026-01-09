import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { parseJsonOrError, signupBody } from '@/lib/validation';
import { enforceRateLimit, RateLimitPresets } from '@/lib/rateLimiter';

export async function POST(req) {
  // Rate limit per IP to reduce automated signups
  const rl = await enforceRateLimit(req, RateLimitPresets.authSignup);
  if (!rl.allowed) return rl.response;

  await dbConnect();
  // Strict input validation & sanitization
  const parsed = await parseJsonOrError(req, signupBody);
  if (!parsed.ok) return parsed.response;
  const { name, email, password } = parsed.data;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return Response.json({ error: 'User already exists' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await User.create({ name, email, passwordHash });

  return Response.json({ success: true, userId: newUser._id });
}
