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
    enum: ['url', 'manual', 'linkonly'],
    required: true
  },
  sourceUrl: String, // Original URL if extracted from job site
  aiAnalyzed: {
    type: Boolean,
    default: false
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  scamType: {
    type: String,
    default: 'none'
  },
  reasoning: String, // AI reasoning for the analysis
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

// Avoid OverwriteModelError in hot reload
// Clear the model cache to ensure schema updates are applied
if (mongoose.models.Job) {
  delete mongoose.models.Job;
}

export default mongoose.model('Job', JobSchema);
