import dbConnect from '../../../lib/dbConnect';
import Report from '../../../models/Report';

export async function POST(req) {
  await dbConnect();
  const body = await req.json();
  try {
    const report = await Report.create(body);
    return new Response(JSON.stringify(report), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
}
