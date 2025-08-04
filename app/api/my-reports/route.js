
import dbConnect from '@/lib/dbConnect';
import Report from '@/models/Report';
import Job from '@/models/Job';

export async function GET(req) {
  await dbConnect();
  try {
    // Remove duplicate jobs by title+company+description
    const jobsRaw = await Job.find({});
    const jobs = Array.from(
      new Map(jobsRaw.map(j => [`${j.title}|${j.company}|${j.description}`, j])).values()
    );
    // Remove duplicate reports by jobTitle+company+description
    const reportsRaw = await Report.find({});
    const reports = Array.from(
      new Map(reportsRaw.map(r => [`${r.jobTitle}|${r.company}|${r.description}`, r])).values()
    );
    return new Response(JSON.stringify({ jobs, reports }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function DELETE(req) {
  await dbConnect();
  try {
    const { type, id } = await req.json();
    if (type === 'job') {
      await Job.findByIdAndDelete(id);
    } else if (type === 'report') {
      await Report.findByIdAndDelete(id);
    } else {
      throw new Error('Invalid type');
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
