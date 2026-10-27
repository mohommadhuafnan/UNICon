import mongoose from 'mongoose';

const aiExecutionLogSchema = new mongoose.Schema(
  {
    traceId: {
      type: String,
      required: true,
      index: true,
    },
    toolName: {
      type: String,
      required: true,
      index: true,
    },
    inputArgs: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    outputResult: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    executionTimeMs: {
      type: Number,
      default: 0,
    },
    isSuccess: {
      type: Boolean,
      default: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('AIExecutionLog', aiExecutionLogSchema);
