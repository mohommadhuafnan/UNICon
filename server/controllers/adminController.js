import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import ComplaintCategory from '../models/ComplaintCategory.js';
import RoutingRule from '../models/RoutingRule.js';
import KnowledgeDocument from '../models/KnowledgeDocument.js';
import SystemSetting from '../models/SystemSetting.js';
import AuditLog from '../models/AuditLog.js';
import AIExecutionLog from '../models/AIExecutionLog.js';
import { ingestKnowledgeDocument } from '../services/ragService.js';
import { detectRoutingRuleConflicts } from '../services/routingEngine.js';
import { logAuditEvent } from '../services/auditService.js';

// @desc    Get complete real administrative overview metrics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
export const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalStudents,
      pendingVerifications,
      totalStaff,
      totalComplaints,
      newSubmitted,
      awaitingAdminReview,
      assignedCount,
      inProgressCount,
      resolvedCount,
      rejectedCount,
      overdueCount,
      byCategory,
      byFaculty,
      byLocation,
      aiLogsCount,
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ['STUDENT', 'student'] } }),
      User.countDocuments({ verificationStatus: 'pending' }),
      User.countDocuments({ role: { $nin: ['STUDENT', 'student'] } }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: { $in: ['SUBMITTED', 'Reported'] } }),
      Complaint.countDocuments({ status: { $in: ['AWAITING_ADMIN_REVIEW', 'Under Review'] } }),
      Complaint.countDocuments({ status: { $in: ['ASSIGNED', 'ACKNOWLEDGED'] } }),
      Complaint.countDocuments({ status: { $in: ['IN_PROGRESS', 'In Progress'] } }),
      Complaint.countDocuments({ status: { $in: ['RESOLVED', 'Resolved', 'CLOSED', 'Closed'] } }),
      Complaint.countDocuments({ status: { $in: ['REJECTED', 'Rejected'] } }),
      Complaint.countDocuments({
        status: { $nin: ['RESOLVED', 'Resolved', 'CLOSED', 'Closed', 'REJECTED'] },
        createdAt: { $lte: new Date(Date.now() - 48 * 3600000) },
      }),
      Complaint.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Complaint.aggregate([
        { $group: { _id: '$faculty', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Complaint.aggregate([
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      AIExecutionLog.countDocuments(),
    ]);

    const resolutionRate =
      totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalUsers: totalStudents + totalStaff,
        studentsCount: totalStudents,
        staffCount: totalStaff,
        pendingStudentVerifications: pendingVerifications,
        totalComplaints,
        newlySubmitted: newSubmitted,
        awaitingAdminReview,
        assignedComplaints: assignedCount,
        inProgressComplaints: inProgressCount,
        resolvedIssues: resolvedCount,
        rejectedComplaints: rejectedCount,
        overdueComplaints: overdueCount,
        resolutionRate,
        aiLogsCount,
        complaintsByCategory: byCategory.map((c) => ({ category: c._id || 'Unspecified', count: c.count })),
        complaintsByFaculty: byFaculty.map((f) => ({ faculty: f._id || 'General', count: f.count })),
        complaintsByLocation: byLocation.map((l) => ({ location: l._id || 'Campus', count: l.count })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student summary for personal dashboard
// @route   GET /api/admin/student-summary
// @access  Private (Student)
export const getStudentSummary = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const [myReported, myResolved, recentIssues] = await Promise.all([
      Complaint.countDocuments({ reporter: studentId }),
      Complaint.countDocuments({
        reporter: studentId,
        status: { $in: ['RESOLVED', 'Resolved', 'CLOSED', 'Closed'] },
      }),
      Complaint.find({ reporter: studentId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          myReportedIssues: myReported,
          myResolvedIssues: myResolved,
          savedOpportunities: 3,
          savedEvents: 2,
        },
        recentIssues,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================= USER MANAGEMENT =================

// @desc    Get all users with search, role, and verification filter
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, verificationStatus, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role && role !== 'All') {
      query.role = role;
    }

    if (verificationStatus && verificationStatus !== 'All') {
      query.verificationStatus = verificationStatus;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { registrationNumber: searchRegex },
        { studentId: searchRegex },
        { faculty: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify or reject a pending student registration
// @route   PATCH /api/admin/users/:id/verification
// @access  Private (Admin only)
export const verifyStudentAccount = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be verified or rejected.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.verificationStatus = status;
    user.verificationNote = note || `Account ${status} by administrator.`;
    user.verifiedAt = new Date();
    user.verifiedBy = req.user.id;
    await user.save();

    await logAuditEvent({
      action: status === 'verified' ? 'STUDENT_VERIFIED' : 'STUDENT_REJECTED',
      user: req.user,
      targetEntity: 'User',
      targetId: user._id,
      details: { targetEmail: user.email, status, note },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `User ${user.name} is now ${status}.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create / provision a staff account with assigned roles and scopes
// @route   POST /api/admin/users/provision-staff
// @access  Private (Admin only)
export const provisionStaffAccount = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      assignedFaculties,
      assignedHostels,
      assignedServiceUnits,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and staff role are required.',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      university: 'South Eastern University of Sri Lanka',
      department: department || 'University Administration',
      assignedFaculties: Array.isArray(assignedFaculties) ? assignedFaculties : [],
      assignedHostels: Array.isArray(assignedHostels) ? assignedHostels : [],
      assignedServiceUnits: Array.isArray(assignedServiceUnits) ? assignedServiceUnits : [],
      verificationStatus: 'verified',
    });

    await logAuditEvent({
      action: 'STAFF_ACCOUNT_PROVISIONED',
      user: req.user,
      targetEntity: 'User',
      targetId: newUser._id,
      details: { name, email, role, assignedFaculties, assignedHostels, assignedServiceUnits },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Staff account provisioned successfully for ${name} (${role}).`,
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role or toggle account status
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Admin only)
export const updateUserRole = async (req, res, next) => {
  try {
    const { role, accountStatus, assignedFaculties, assignedHostels, assignedServiceUnits } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (role) user.role = role;
    if (accountStatus) user.accountStatus = accountStatus;
    if (assignedFaculties) user.assignedFaculties = assignedFaculties;
    if (assignedHostels) user.assignedHostels = assignedHostels;
    if (assignedServiceUnits) user.assignedServiceUnits = assignedServiceUnits;

    await user.save();

    await logAuditEvent({
      action: 'USER_ROLE_MODIFIED',
      user: req.user,
      targetEntity: 'User',
      targetId: user._id,
      details: { updatedRole: role, accountStatus },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `User permissions updated successfully.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ================= CATEGORY MANAGEMENT =================

export const getCategories = async (req, res, next) => {
  try {
    const categories = await ComplaintCategory.find().sort({ displayOrder: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { key, displayName, description, locationType, subcategories } = req.body;
    const category = await ComplaintCategory.create({
      key: key.toUpperCase().trim(),
      displayName,
      description,
      locationType,
      subcategories: subcategories || [],
    });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await ComplaintCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// ================= ROUTING RULES MANAGEMENT =================

export const getRoutingRules = async (req, res, next) => {
  try {
    const rules = await RoutingRule.find().sort({ priority: -1, createdAt: -1 });
    res.json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
};

export const createRoutingRule = async (req, res, next) => {
  try {
    const ruleData = { ...req.body, createdBy: req.user.id };
    const conflictCheck = await detectRoutingRuleConflicts(ruleData);

    const rule = await RoutingRule.create(ruleData);

    await logAuditEvent({
      action: 'ROUTING_RULE_CREATED',
      user: req.user,
      targetEntity: 'RoutingRule',
      targetId: rule._id,
      details: { name: rule.name, responsibleUnit: rule.responsibleUnit },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: rule,
      conflictWarning: conflictCheck.hasConflict ? conflictCheck.message : null,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRoutingRule = async (req, res, next) => {
  try {
    const rule = await RoutingRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

export const deleteRoutingRule = async (req, res, next) => {
  try {
    await RoutingRule.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Routing rule removed.' });
  } catch (error) {
    next(error);
  }
};

// ================= KNOWLEDGE BASE MANAGEMENT =================

export const getKnowledgeDocuments = async (req, res, next) => {
  try {
    const docs = await KnowledgeDocument.find().sort({ createdAt: -1 });
    res.json({ success: true, data: docs });
  } catch (error) {
    next(error);
  }
};

export const ingestDocument = async (req, res, next) => {
  try {
    const { title, sourceUrl, sourceReference, documentType, departmentScope, rawText } = req.body;
    if (!title || !rawText) {
      return res.status(400).json({ success: false, message: 'Title and raw text content are required.' });
    }

    const doc = await ingestKnowledgeDocument({
      title,
      sourceUrl,
      sourceReference,
      documentType,
      departmentScope,
      rawText,
      uploadedBy: req.user.id,
    });

    await logAuditEvent({
      action: 'KNOWLEDGE_DOC_INGESTED',
      user: req.user,
      targetEntity: 'KnowledgeDocument',
      targetId: doc._id,
      details: { title: doc.title, chunkCount: doc.chunkCount },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Document "${doc.title}" indexed into ${doc.chunkCount} vector chunks.`,
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

// ================= AI CONFIG & AUDIT LOGS =================

export const getSystemSettings = async (req, res, next) => {
  try {
    const settings = await SystemSetting.find().sort({ category: 1 });
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

export const updateSystemSetting = async (req, res, next) => {
  try {
    const { key, value } = req.body;
    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      { value, updatedBy: req.user.id },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, limit = 50 } = req.query;
    const filter = action ? { action } : {};
    const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit, 10));
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

export const getAILogs = async (req, res, next) => {
  try {
    const logs = await AIExecutionLog.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};
