import dbConnect from '../../../lib/dbConnect';
import Report from '../../../models/Report';
import { requireAuth } from '../../../lib/auth';
import { enforceRateLimit, RateLimitPresets } from '@/lib/rateLimiter';
import { parseJsonOrError, reportCreateBody } from '@/lib/validation';

export async function POST(req) {
  await dbConnect();
  try {
    const user = await requireAuth();
    // Rate limit per user for creating reports
    const rl = await enforceRateLimit(req, { ...RateLimitPresets.reportCreate, userId: user.userId });
    if (!rl.allowed) return rl.response;

    // Strict validation & sanitization
    const parsed = await parseJsonOrError(req, reportCreateBody);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const report = await Report.create({ ...body, userId: user.userId });
    return new Response(JSON.stringify(report), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
}
