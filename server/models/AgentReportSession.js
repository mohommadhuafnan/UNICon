import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    filename: { type: String, required: true },
    path: { type: String, required: true },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
  },
  { _id: true }
);

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    text: { type: String, default: '' },
    images: [imageSchema],
    followUp: {
      question: String,
      suggestedAnswers: [String],
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// Server-side state of one AI reporting conversation. The model never sees or decides
// anything outside this document; the final report is validated again before submission.
const agentReportSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['active', 'submitted'], default: 'active', index: true },
    // Guards against concurrent turns / double submission (atomic compare-and-set)
    busy: { type: Boolean, default: false },
    isAnonymous: { type: Boolean, default: false },
    messages: [messageSchema],
    draft: { type: mongoose.Schema.Types.Mixed, default: {} },
    askedQuestions: [String],
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
    ticketNumber: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('AgentReportSession', agentReportSessionSchema);
