import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/', // make sure to specify path
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
