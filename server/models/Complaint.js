import mongoose from 'mongoose';

export const COMPLAINT_STATUSES = [
  'SUBMITTED',
  'AI_ANALYSIS_PENDING',
  'AWAITING_CLARIFICATION',
  'AWAITING_ADMIN_REVIEW',
  'ASSIGNED',
  'ACKNOWLEDGED',
  'IN_PROGRESS',
  'ON_HOLD',
  'RESOLVED',
  'CLOSED',
  'REJECTED',
  // Legacy aliases
  'Reported',
  'Under Review',
  'In Progress',
  'Resolved',
  'Closed',
  'Rejected',
];

const complaintSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a complaint title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed description'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please select a complaint category'],
      trim: true,
    },
    subcategory: {
      type: String,
      default: 'GENERAL',
      trim: true,
    },
    // Dynamic location details
    locationDetails: {
      locationType: {
        type: String,
        enum: ['FACULTY', 'HOSTEL', 'LIBRARY', 'CANTEEN', 'MAINTENANCE', 'GENERAL'],
        default: 'GENERAL',
      },
      facultyName: { type: String, default: '' },
      hostelName: { type: String, default: '' },
      building: { type: String, default: '' },
      roomOrArea: { type: String, default: '' },
    },
    location: {
      type: String,
      required: [true, 'Please specify the campus location'],
      trim: true,
    },
    specificLocation: {
      type: String,
      trim: true,
      default: '',
    },
    university: {
      type: String,
      default: 'South Eastern University of Sri Lanka',
      trim: true,
    },
    faculty: {
      type: String,
      default: 'Faculty of Technology',
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent', 'Critical', 'LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: COMPLAINT_STATUSES,
      default: 'SUBMITTED',
      index: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentRegistrationNumber: {
      type: String,
      trim: true,
      default: '',
    },
    studentName: {
      type: String,
      trim: true,
      default: '',
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    attachments: [
      {
        url: String,
        filename: String,
        fileType: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    supportCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // AI Classification and Reasoning
    aiAnalysis: {
      summary: { type: String, default: '' },
      suggestedCategory: { type: String, default: '' },
      suggestedSubcategory: { type: String, default: '' },
      suggestedPriority: { type: String, default: '' },
      suggestedResponsibleUnit: { type: String, default: '' },
      confidence: { type: Number, default: 0 },
      missingInformation: [{ type: String }],
      requiresHumanReview: { type: Boolean, default: false },
      reason: { type: String, default: '' },
      analyzedAt: { type: Date },
    },
    // Verified routing decision
    routingDecision: {
      ruleApplied: { type: String, default: 'DEFAULT' },
      assignedUnit: { type: String, default: 'Awaiting Assignment' },
      assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      assignedStaffName: { type: String, default: '' },
      targetRole: { type: String, default: '' },
      reason: { type: String, default: '' },
      assignedAt: { type: Date },
      isVerifiedAssignment: { type: Boolean, default: false },
    },
    // Clarification requests between staff and student
    clarificationRequests: [
      {
        requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        requestedByName: String,
        question: { type: String, required: true },
        studentAnswer: { type: String, default: '' },
        requestedAt: { type: Date, default: Date.now },
        answeredAt: { type: Date },
      },
    ],
    // Internal confidential staff notes
    internalNotes: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        authorName: String,
        authorRole: String,
        note: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Public official notes shown to student
    officialResponses: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        responderName: String,
        responderRole: String,
        message: { type: String, required: true },
        isOfficial: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Audit timeline of status changes
    statusHistory: [
      {
        previousStatus: String,
        newStatus: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedByName: String,
        note: { type: String, trim: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    // Resolution details
    resolutionDetails: {
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      resolvedByName: String,
      details: { type: String, default: '' },
      completionEvidenceUrl: { type: String, default: '' },
      resolvedAt: { type: Date },
    },
    // Audit log entries
    auditHistory: [
      {
        action: String,
        performedBy: String,
        details: mongoose.Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Auto-generate unique ticket number if not provided
complaintSchema.pre('validate', function (next) {
  if (!this.ticketNumber) {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    this.ticketNumber = `SEUSL-${year}-${random}`;
  }
  next();
});

// Indexes
complaintSchema.index({ category: 1, status: 1 });

complaintSchema.index({ 'routingDecision.assignedUnit': 1, status: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ title: 'text', description: 'text', location: 'text' });

export default mongoose.model('Complaint', complaintSchema);
