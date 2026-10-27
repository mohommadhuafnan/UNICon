import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['AI', 'ROUTING', 'REGISTRATION', 'NOTIFICATION', 'GENERAL'],
      default: 'GENERAL',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.model('SystemSetting', systemSettingSchema);
