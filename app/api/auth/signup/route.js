import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  await dbConnect();

  const { name, email, password } = await req.json();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return Response.json({ error: 'User already exists' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await User.create({ name, email, passwordHash });

  return Response.json({ success: true, userId: newUser._id });
}
