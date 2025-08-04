
import dbConnect from '@/lib/dbConnect';
import Report from '@/models/Report';
import Job from '@/models/Job';

export async function GET(req) {
  await dbConnect();
  try {
    const jobs = await Job.find({});
    const reports = await Report.find({});
    return new Response(JSON.stringify({ jobs, reports }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
