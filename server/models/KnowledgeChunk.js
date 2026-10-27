import mongoose from 'mongoose';

const knowledgeChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeDocument',
      required: true,
      index: true,
    },
    documentTitle: {
      type: String,
      required: true,
      trim: true,
    },
    documentType: {
      type: String,
      default: 'COMPLAINT_PROCEDURE',
    },
    departmentScope: {
      type: String,
      default: 'UNIVERSITY_WIDE',
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sourceUrl: {
      type: String,
      default: '',
    },
    embedding: {
      type: [Number],
      default: undefined,
    },
    tokenCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Text index for text search fallback when vector indexing is indexing or unavailable
knowledgeChunkSchema.index({ content: 'text', documentTitle: 'text' });

export default mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
