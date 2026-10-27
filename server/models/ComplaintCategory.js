import mongoose from 'mongoose';

const subcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    defaultPriority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'Low', 'Medium', 'High', 'Critical'],
      default: 'MEDIUM',
    },
    defaultServiceUnit: {
      type: String,
      default: '',
    },
    requiredLocationFields: [{
      type: String,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const complaintCategorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    locationType: {
      type: String,
      enum: ['FACULTY', 'HOSTEL', 'LIBRARY', 'CANTEEN', 'MAINTENANCE', 'GENERAL'],
      default: 'GENERAL',
    },
    subcategories: [subcategorySchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('ComplaintCategory', complaintCategorySchema);
