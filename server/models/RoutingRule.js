import mongoose from 'mongoose';

const routingRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    subcategory: {
      type: String,
      default: 'ALL',
      trim: true,
    },
    facultyScope: {
      type: String,
      default: 'ANY',
      trim: true,
    },
    hostelScope: {
      type: String,
      default: 'ANY',
      trim: true,
    },
    locationScope: {
      type: String,
      default: 'ANY',
      trim: true,
    },
    responsibleUnit: {
      type: String,
      required: true,
      trim: true,
    },
    permittedRoles: [{
      type: String,
      trim: true,
    }],
    firstNotificationRole: {
      type: String,
      default: '',
      trim: true,
    },
    priorityRule: {
      type: String,
      enum: ['DEFAULT', 'HIGH_URGENCY', 'CRITICAL_SAFETY', 'MAINTENANCE_SCHEDULE'],
      default: 'DEFAULT',
    },
    escalationHours: {
      type: Number,
      default: 48, // hours before overdue
    },
    priority: {
      type: Number,
      default: 10, // Higher numbers take precedence
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Compound index for matching efficiency
routingRuleSchema.index({ category: 1, subcategory: 1, isActive: 1, priority: -1 });

export default mongoose.model('RoutingRule', routingRuleSchema);
