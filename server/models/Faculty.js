import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    campus: {
      type: String,
      default: 'Main Campus, Oluvil',
    },
    departments: [{
      type: String,
      trim: true,
    }],
    buildings: [{
      type: String,
      trim: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Faculty', facultySchema);
