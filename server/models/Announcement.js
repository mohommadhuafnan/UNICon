import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an announcement title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide announcement details'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Academic',
        'Examinations',
        'Departmental',
        'Administrative',
        'Workshop & Events',
        'Student Society',
        'General Notices',
      ],
      default: 'General Notices',
    },
    publisher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    publisherName: {
      type: String,
      required: true,
    },
    publisherRole: {
      type: String,
      default: 'Authorized Staff',
    },
    sourceDepartment: {
      type: String,
      default: 'Dean\'s Office / Administration',
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ['Normal', 'High', 'Urgent'],
      default: 'Normal',
    },
    targetAudience: {
      type: String,
      default: 'All Students & Staff',
      trim: true,
    },
    sourceUrl: {
      type: String,
      trim: true,
      default: '',
    },
    attachmentUrl: {
      type: String,
      trim: true,
      default: '',
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

announcementSchema.index({ category: 1, isPublished: 1, publishedAt: -1 });
announcementSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Announcement', announcementSchema);
