import mongoose from 'mongoose';

const knowledgeDocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    sourceUrl: {
      type: String,
      default: '',
      trim: true,
    },
    sourceReference: {
      type: String,
      default: '',
      trim: true,
    },
    documentType: {
      type: String,
      enum: [
        'HANDBOOK',
        'WELFARE_POLICY',
        'HOSTEL_RULES',
        'LIBRARY_RULES',
        'CANTEEN_POLICY',
        'MAINTENANCE_PROCEDURE',
        'COMPLAINT_PROCEDURE',
        'FAQ',
        'OFFICIAL_NOTICE',
        'OTHER',
      ],
      default: 'COMPLAINT_PROCEDURE',
    },
    departmentScope: {
      type: String,
      default: 'UNIVERSITY_WIDE',
    },
    version: {
      type: String,
      default: '1.0',
    },
    publicationDate: {
      type: Date,
      default: Date.now,
    },
    approvalStatus: {
      type: String,
      enum: ['APPROVED', 'PENDING', 'DEACTIVATED'],
      default: 'APPROVED',
    },
    contentHash: {
      type: String,
      default: '',
    },
    rawText: {
      type: String,
      default: '',
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    errorLog: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);
