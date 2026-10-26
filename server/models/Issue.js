import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an issue title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed description'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Hostel and Accommodation',
        'Water Supply',
        'Electricity',
        'Internet and Wi-Fi',
        'Classroom Facilities',
        'Library',
        'Sanitation and Cleanliness',
        'Campus Infrastructure',
        'Safety and Accessibility',
        'Other',
      ],
    },
    university: {
      type: String,
      required: [true, 'Please specify the university or campus'],
      default: 'University of Colombo',
      trim: true,
    },
    faculty: {
      type: String,
      trim: true,
      default: 'Faculty of Computing',
    },
    location: {
      type: String,
      required: [true, 'Please specify the general campus location'],
      trim: true,
    },
    specificLocation: {
      type: String,
      trim: true,
      default: '',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Reported', 'Under Review', 'In Progress', 'Resolved', 'Closed', 'Rejected'],
      default: 'Reported',
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    supportCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    statusHistory: [
      {
        previousStatus: String,
        newStatus: {
          type: String,
          required: true,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        changedByName: String,
        note: {
          type: String,
          trim: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    officialResponses: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        responderName: String,
        responderRole: String,
        message: {
          type: String,
          required: true,
          trim: true,
        },
        isOfficial: {
          type: Boolean,
          default: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for fast searching and filtering
issueSchema.index({ category: 1, status: 1 });
issueSchema.index({ priority: 1 });
issueSchema.index({ createdAt: -1 });
issueSchema.index({ title: 'text', description: 'text', location: 'text' });

export default mongoose.model('Issue', issueSchema);
