import mongoose from 'mongoose';

const opportunitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an opportunity title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide detailed opportunity information'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Hackathon',
        'Coding Competition',
        'Designathon',
        'Datathon',
        'Internship',
        'Scholarship',
        'Workshop',
        'Research',
        'Certification',
        'Other',
      ],
      default: 'Hackathon',
    },
    organizer: {
      type: String,
      required: [true, 'Please specify the organizing entity or company'],
      trim: true,
    },
    eligibility: {
      type: String,
      default: 'All university undergraduates',
      trim: true,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    locationType: {
      type: String,
      enum: ['On-Campus', 'Remote', 'Hybrid', 'Physical'],
      default: 'Remote',
    },
    deadline: {
      type: Date,
      required: [true, 'Please specify the application deadline'],
    },
    eventDate: {
      type: Date,
      default: null,
    },
    registrationUrl: {
      type: String,
      required: [true, 'Please provide the registration link'],
      trim: true,
    },
    sourceUrl: {
      type: String,
      trim: true,
      default: '',
    },
    verificationStatus: {
      type: String,
      enum: ['Verified', 'Pending', 'Community'],
      default: 'Verified',
    },
    status: {
      type: String,
      enum: ['Active', 'Closed', 'Expired'],
      default: 'Active',
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

opportunitySchema.index({ category: 1, status: 1, deadline: 1 });
opportunitySchema.index({ title: 'text', description: 'text', organizer: 'text' });

export default mongoose.model('Opportunity', opportunitySchema);
