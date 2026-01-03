import dbConnect from '../../../lib/dbConnect';
import Report from '../../../models/Report';
import { requireAuth } from '../../../lib/auth';

export async function POST(req) {
  await dbConnect();
  const body = await req.json();
  try {
    const user = await requireAuth();
    const report = await Report.create({ ...body, userId: user.userId });
    return new Response(JSON.stringify(report), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
}
