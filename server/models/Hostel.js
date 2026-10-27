import mongoose from 'mongoose';

const hostelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Mixed'],
      default: 'Male',
    },
    campus: {
      type: String,
      default: 'Main Campus, Oluvil',
    },
    blocks: [{
      type: String,
      trim: true,
    }],
    totalRooms: {
      type: Number,
      default: 100,
    },
    warden: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    subWardens: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Hostel', hostelSchema);
