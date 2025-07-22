import mongoose from 'mongoose';
const Job = mongoose.models.Job || mongoose.model('Job', new mongoose.Schema({
  title: String,
  company: String,
  description: String,
  sourceURL: String,
  createdAt: Date
}));

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
}

export default async function handler(req, res) {
  await connectDB();
  const jobs = await Job.find().sort('-createdAt').lean();
  res.status(200).json({ jobs });
}
