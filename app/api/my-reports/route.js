
import dbConnect from '@/lib/dbConnect';
import Report from '@/models/Report';
import Job from '@/models/Job';
import { requireAuth } from '@/lib/auth';
import { enforceRateLimit, RateLimitPresets } from '@/lib/rateLimiter';
import { parseJsonOrError, myReportsDeleteBody } from '@/lib/validation';

export async function GET(req) {
  await dbConnect();
  try {
    const user = await requireAuth();
    // Rate limit per user for fetching reports
    const rl = await enforceRateLimit(req, { ...RateLimitPresets.myReports, userId: user.userId });
    if (!rl.allowed) return rl.response;
    
    // Remove duplicate jobs by title+company+description - filter by userId
    const jobsRaw = await Job.find({ userId: user.userId });
    const jobs = Array.from(
      new Map(jobsRaw.map(j => [`${j.title}|${j.company}|${j.description}`, j])).values()
    );
    // Remove duplicate reports by jobTitle+company+description - filter by userId
    const reportsRaw = await Report.find({ userId: user.userId });
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
    const user = await requireAuth();
    // Rate limit per user for deletions
    const rl = await enforceRateLimit(req, { ...RateLimitPresets.myReports, userId: user.userId });
    if (!rl.allowed) return rl.response;

    // Strict validation of delete payload
    const parsed = await parseJsonOrError(req, myReportsDeleteBody);
    if (!parsed.ok) return parsed.response;
    const { type, id } = parsed.data;
    
    if (type === 'job') {
      const job = await Job.findOne({ _id: id, userId: user.userId });
      if (!job) throw new Error('Job not found or unauthorized');
      await Job.findByIdAndDelete(id);
    } else if (type === 'report') {
      const report = await Report.findOne({ _id: id, userId: user.userId });
      if (!report) throw new Error('Report not found or unauthorized');
      await Report.findByIdAndDelete(id);
    } else {
      throw new Error('Invalid type');
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
