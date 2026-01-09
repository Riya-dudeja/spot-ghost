import { verifyAuth } from '@/lib/auth';
import { enforceRateLimit, RateLimitPresets } from '@/lib/rateLimiter';

export async function GET() {
  try {
    const user = await verifyAuth();
    
    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Light per-user rate limit for verify endpoint
    const rl = await enforceRateLimit({ headers: new Map() }, { ...RateLimitPresets.profile, userId: user.userId });
    if (!rl.allowed) return rl.response;

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
