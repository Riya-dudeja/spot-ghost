import { verifyAuth } from '@/lib/auth';

export async function GET() {
  try {
    const user = await verifyAuth();
    
    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return Response.json({ 
      success: true, 
      user: { 
        userId: user.userId, 
        email: user.email 
      } 
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return Response.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
