import mongoose from 'mongoose';

const issueSupportSchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: prevents duplicate support per user per issue
issueSupportSchema.index({ issue: 1, user: 1 }, { unique: true });

export default mongoose.model('IssueSupport', issueSupportSchema);
