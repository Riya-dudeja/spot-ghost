import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  jobTitle: { type: String, required: true },
  company: { type: String, required: true },
  jobLink: { type: String },
  description: { type: String, required: true },
  contactEmail: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Report || mongoose.model('Report', ReportSchema);
