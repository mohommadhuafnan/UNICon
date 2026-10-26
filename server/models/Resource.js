import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a resource title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a brief description'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Please specify the subject or course code'],
      trim: true,
    },
    faculty: {
      type: String,
      default: 'Faculty of Computing',
      trim: true,
    },
    department: {
      type: String,
      default: 'Computer Science',
      trim: true,
    },
    semester: {
      type: String,
      enum: [
        'Year 1 Sem 1',
        'Year 1 Sem 2',
        'Year 2 Sem 1',
        'Year 2 Sem 2',
        'Year 3 Sem 1',
        'Year 3 Sem 2',
        'Year 4 Sem 1',
        'Year 4 Sem 2',
        'Postgraduate / General',
      ],
      default: 'Year 1 Sem 1',
    },
    resourceType: {
      type: String,
      enum: [
        'Lecture Notes',
        'Revision Guide',
        'Tutorial',
        'Practice Questions / Past Papers',
        'Code & Documentation',
        'Video Lecture',
        'Reference Book',
      ],
      default: 'Lecture Notes',
    },
    sourceUrl: {
      type: String,
      required: [true, 'Please provide the access URL or link to material'],
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    contributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contributorName: {
      type: String,
      required: true,
    },
    moderationStatus: {
      type: String,
      enum: ['Approved', 'Pending', 'Flagged'],
      default: 'Approved',
    },
    reportCount: {
      type: Number,
      default: 0,
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

resourceSchema.index({ faculty: 1, semester: 1, resourceType: 1 });
resourceSchema.index({ title: 'text', subject: 'text', description: 'text' });

export default mongoose.model('Resource', resourceSchema);
