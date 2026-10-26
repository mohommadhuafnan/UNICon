import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a suggestion title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please explain your suggestion in detail'],
      trim: true,
      maxlength: [2500, 'Description cannot exceed 2500 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Academic Facilities',
        'Library Services',
        'Hostel Facilities',
        'Transportation',
        'Internet Connectivity',
        'Student Welfare',
        'Campus Accessibility',
        'General Improvements',
      ],
      default: 'General Improvements',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    campusLocation: {
      type: String,
      trim: true,
      default: 'Main Campus',
    },
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Accepted', 'Implemented', 'Declined'],
      default: 'Submitted',
    },
    supportCount: {
      type: Number,
      default: 0,
    },
    supportedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    administrativeResponse: {
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      responderName: String,
      responseText: String,
      respondedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.index({ category: 1, status: 1 });
feedbackSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Feedback', feedbackSchema);
