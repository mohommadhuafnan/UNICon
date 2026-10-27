import mongoose from 'mongoose';

const serviceUnitSchema = new mongoose.Schema(
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
    description: {
      type: String,
      default: '',
    },
    defaultStaffRole: {
      type: String,
      default: 'MAINTENANCE_OFFICER',
    },
    contactEmail: {
      type: String,
      default: '',
    },
    contactPhone: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('ServiceUnit', serviceUnitSchema);
