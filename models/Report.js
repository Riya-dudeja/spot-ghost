import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobTitle: { type: String, required: true },
  company: { type: String, required: true },
  jobLink: { type: String },
  description: { type: String, required: true },
  contactEmail: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Report || mongoose.model('Report', ReportSchema);
