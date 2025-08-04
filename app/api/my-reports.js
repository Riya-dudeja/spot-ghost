import dbConnect from '../../lib/dbConnect';
import Report from '../../models/Report';
import Job from '../../models/Job';

export default async function MyReportsAPI(req, res) {
  await dbConnect();
  try {
    // Fetch all jobs analyzed by the user (for now, fetch all jobs)
    const jobs = await Job.find({});
    // Fetch all reports submitted by the user (for now, fetch all reports)
    const reports = await Report.find({});
    res.status(200).json({ jobs, reports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
