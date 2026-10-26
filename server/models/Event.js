import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an event title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide event details'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Sports',
        'Inter-Faculty',
        'Cultural Festival',
        'Society Activity',
        'Technical Exhibition',
        'Workshop',
        'Seminar',
        'Career Fair',
        'Other',
      ],
      default: 'Workshop',
    },
    organizer: {
      type: String,
      required: [true, 'Please provide the organizer or society name'],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Please specify the event venue or physical / online hall'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Please specify the start date and time'],
    },
    endDate: {
      type: Date,
      default: null,
    },
    registrationDeadline: {
      type: Date,
      default: null,
    },
    registrationUrl: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
      default: 'Upcoming',
    },
    attendeeCount: {
      type: Number,
      default: 0,
    },
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ category: 1, status: 1, startDate: 1 });
eventSchema.index({ title: 'text', description: 'text', organizer: 'text', venue: 'text' });

export default mongoose.model('Event', eventSchema);
