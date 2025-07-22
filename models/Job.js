import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  company: String,
  location: String,
  description: String,
  salary: String,
  requirements: String,
  email: String,
  website: String,
  score: Number,
  flags: [String],
  riskLevel: {
    type: String,
    enum: ['Very Low', 'Low', 'Medium', 'High', 'Very High', 'Critical'],
    default: 'Medium'
  },
  method: {
    type: String,
    enum: ['url', 'manual', 'linkonly', 'extension', 'linkedin'],
    required: true
  },
  sourceUrl: String, // Original URL if extracted from job site
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

if (mongoose.models.Job) {
  delete mongoose.models.Job;
}

export default mongoose.model('Job', JobSchema);
