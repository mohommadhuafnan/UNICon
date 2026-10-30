import { anonymizeComplaint } from '../utils/anonymity.js';
import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { logAuditEvent } from '../services/auditService.js';
import { normalizeRole } from '../middleware/auth.js';

/**
 * Build scoped MongoDB query for staff member based on role and assigned organizational boundaries
 */
export const buildStaffScopedQuery = (user) => {
  const role = normalizeRole(user.role);

  // Super and University Admin see all
  if (role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN') {
    return {};
  }

  // Faculty Officer: only complaints within their assigned faculties or targeted to FACULTY_OFFICER
  if (role === 'FACULTY_OFFICER') {
    const facultyList = user.assignedFaculties && user.assignedFaculties.length > 0
      ? user.assignedFaculties
      : [user.faculty || 'Faculty of Technology'];

    return {
      $or: [
        { 'routingDecision.targetRole': 'FACULTY_OFFICER' },
        { 'routingDecision.assignedStaff': user._id },
        { category: 'FACULTY_RELATED' },
        { faculty: { $in: facultyList } },
        { 'locationDetails.facultyName': { $in: facultyList } },
      ],
    };
  }

  // Hostel Warden & Sub-Warden: complaints for hostel accommodation or targeted to HOSTEL_WARDEN
  if (role === 'HOSTEL_WARDEN' || role === 'HOSTEL_SUB_WARDEN') {
    return {
      $or: [
        { 'routingDecision.targetRole': 'HOSTEL_WARDEN' },
        { 'routingDecision.assignedStaff': user._id },
        { category: 'HOSTEL_ACCOMMODATION' },
        { category: 'Hostel and Accommodation' },
        { 'routingDecision.assignedUnit': /hostel/i },
      ],
    };
  }

  // Maintenance Officer: maintenance department queue and general repairs
  if (role === 'MAINTENANCE_OFFICER') {
    return {
      $or: [
        { 'routingDecision.assignedUnit': /maintenance/i },
        { category: 'CAMPUS_MAINTENANCE' },
        { 'routingDecision.assignedStaff': user._id },
      ],
    };
  }

  // Library Officer: library services queue or targeted to LIBRARY_OFFICER
  if (role === 'LIBRARY_OFFICER') {
    return {
      $or: [
        { 'routingDecision.targetRole': 'LIBRARY_OFFICER' },
        { 'routingDecision.assignedStaff': user._id },
        { category: 'LIBRARY' },
        { 'routingDecision.assignedUnit': /library/i },
      ],
    };
  }

  // Canteen Manager: cafeteria services queue or targeted to CANTEEN_MANAGER
  if (role === 'CANTEEN_MANAGER') {
    return {
      $or: [
        { 'routingDecision.targetRole': 'CANTEEN_MANAGER' },
        { 'routingDecision.assignedStaff': user._id },
        { category: 'CANTEEN_FOOD' },
        { 'routingDecision.assignedUnit': /cafeteria|canteen/i },
      ],
    };
  }

  // Health Centre Officer
  if (role === 'HEALTH_CENTRE_OFFICER') {
    return {
      $or: [
        { subcategory: 'HEALTH_CENTRE_FACILITIES' },
        { 'routingDecision.assignedUnit': /health/i },
      ],
    };
  }

  // Security Officer
  if (role === 'SECURITY_OFFICER') {
    return {
      $or: [
        { subcategory: 'SECURITY_INFRASTRUCTURE' },
        { subcategory: 'SECURITY_CONCERNS' },
        { 'routingDecision.assignedUnit': /security/i },
      ],
    };
  }

  // Student Welfare Officer
  if (role === 'STUDENT_WELFARE_OFFICER') {
    return {
      $or: [
        { category: 'OTHER_SERVICES' },
        { 'routingDecision.assignedUnit': /welfare|sssw/i },
      ],
    };
  }

  return {};
};

// @desc    Get complaints for current authenticated staff member's scoped queue
// @route   GET /api/staff/complaints
// @access  Private (Staff, Admin)
export const getStaffComplaints = async (req, res, next) => {
  try {
    const scopeQuery = buildStaffScopedQuery(req.user);
    const { status, priority, search, page = 1, limit = 15 } = req.query;

    const query = { ...scopeQuery };

    if (status && status !== 'All') {
      query.status = status;
    }

    if (priority && priority !== 'All') {
      query.priority = new RegExp(`^${priority}$`, 'i');
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { ticketNumber: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { studentRegistrationNumber: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const [complaints, total] = await Promise.all([
      Complaint.find(query)
        .populate('reporter', 'name email role faculty studentId registrationNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Complaint.countDocuments(query),
    ]);

    // Scoped statistics
    const [assignedCount, acknowledgedCount, inProgressCount, resolvedCount, overdueCount] =
      await Promise.all([
        Complaint.countDocuments({ ...scopeQuery, status: 'ASSIGNED' }),
        Complaint.countDocuments({ ...scopeQuery, status: 'ACKNOWLEDGED' }),
        Complaint.countDocuments({ ...scopeQuery, status: 'IN_PROGRESS' }),
        Complaint.countDocuments({ ...scopeQuery, status: { $in: ['RESOLVED', 'Resolved', 'CLOSED', 'Closed'] } }),
        Complaint.countDocuments({
          ...scopeQuery,
          status: { $nin: ['RESOLVED', 'Resolved', 'CLOSED', 'Closed', 'REJECTED'] },
          createdAt: { $lte: new Date(Date.now() - 48 * 3600000) },
        }),
      ]);

    res.json({
      success: true,
      count: complaints.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      stats: {
        totalQueue: total,
        assigned: assignedCount,
        acknowledged: acknowledgedCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        overdue: overdueCount,
      },
      data: complaints.map((c) => anonymizeComplaint(c, req.user)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Acknowledge a complaint
// @route   POST /api/staff/complaints/:id/acknowledge
// @access  Private (Staff, Admin)
export const acknowledgeComplaint = async (req, res, next) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const complaint = await Complaint.findOne(isObjectId ? { _id: req.params.id } : { ticketNumber: req.params.id.toUpperCase() });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const prevStatus = complaint.status;
    complaint.status = 'ACKNOWLEDGED';

    complaint.statusHistory.push({
      previousStatus: prevStatus,
      newStatus: 'ACKNOWLEDGED',
      changedBy: req.user.id,
      changedByName: `${req.user.name} (${req.user.role})`,
      note: 'Complaint acknowledged by authorized service officer. Queued for operational inspection.',
      timestamp: new Date(),
    });

    await complaint.save();

    await Notification.create({
      recipient: complaint.reporter,
      type: 'issue_status',
      title: `Complaint Acknowledged: ${complaint.ticketNumber}`,
      message: `${req.user.name} (${req.user.role}) has acknowledged your complaint and scheduled action.`,
      link: `/campuscare/${complaint._id}`,
    });

    await logAuditEvent({
      action: 'COMPLAINT_ACKNOWLEDGED',
      user: req.user,
      targetEntity: 'Complaint',
      targetId: complaint._id,
      details: { ticketNumber: complaint.ticketNumber },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Complaint ${complaint.ticketNumber} acknowledged successfully.`,
      data: anonymizeComplaint(complaint, req.user),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request student clarification
// @route   POST /api/staff/complaints/:id/clarification
// @access  Private (Staff, Admin)
export const requestClarification = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question || question.trim() === '') {
      return res.status(400).json({ success: false, message: 'Question cannot be empty.' });
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const complaint = await Complaint.findOne(isObjectId ? { _id: req.params.id } : { ticketNumber: req.params.id.toUpperCase() });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    complaint.clarificationRequests.push({
      requestedBy: req.user.id,
      requestedByName: req.user.name,
      question: question.trim(),
      requestedAt: new Date(),
    });

    const prevStatus = complaint.status;
    complaint.status = 'AWAITING_CLARIFICATION';

    complaint.statusHistory.push({
      previousStatus: prevStatus,
      newStatus: 'AWAITING_CLARIFICATION',
      changedBy: req.user.id,
      changedByName: `${req.user.name} (${req.user.role})`,
      note: `Clarification requested: "${question.trim()}"`,
      timestamp: new Date(),
    });

    await complaint.save();

    await Notification.create({
      recipient: complaint.reporter,
      type: 'clarification_needed',
      title: `Clarification Requested for ${complaint.ticketNumber}`,
      message: `${req.user.name} asks: "${question.trim()}"`,
      link: `/campuscare/${complaint._id}`,
    });

    res.json({
      success: true,
      message: 'Clarification request sent to student.',
      data: anonymizeComplaint(complaint, req.user),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reassign complaint to another verified service unit or staff member
// @route   POST /api/staff/complaints/:id/reassign
// @access  Private (Staff, Admin)
export const reassignComplaint = async (req, res, next) => {
  try {
    const { newUnit, newStaffId, reason } = req.body;
    if (!newUnit) {
      return res.status(400).json({ success: false, message: 'Please specify the new responsible unit.' });
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const complaint = await Complaint.findOne(isObjectId ? { _id: req.params.id } : { ticketNumber: req.params.id.toUpperCase() });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    let targetStaffName = '';
    let targetStaffObjId = null;

    if (newStaffId) {
      const staffUser = await User.findById(newStaffId).select('name role');
      if (staffUser) {
        targetStaffName = `${staffUser.name} (${staffUser.role})`;
        targetStaffObjId = staffUser._id;
      }
    }

    const prevUnit = complaint.routingDecision?.assignedUnit || 'Unassigned';

    complaint.routingDecision = {
      ruleApplied: 'MANUAL_REASSIGNMENT',
      assignedUnit: newUnit,
      assignedStaff: targetStaffObjId,
      assignedStaffName: targetStaffName,
      assignedAt: new Date(),
      isVerifiedAssignment: true,
    };

    complaint.status = 'ASSIGNED';

    complaint.statusHistory.push({
      previousStatus: complaint.status,
      newStatus: 'ASSIGNED',
      changedBy: req.user.id,
      changedByName: `${req.user.name} (${req.user.role})`,
      note: `Reassigned from "${prevUnit}" to "${newUnit}". Reason: ${reason || 'Reassigned within authorized scope.'}`,
      timestamp: new Date(),
    });

    await complaint.save();

    await logAuditEvent({
      action: 'COMPLAINT_REASSIGNED',
      user: req.user,
      targetEntity: 'Complaint',
      targetId: complaint._id,
      details: { prevUnit, newUnit, reason },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Complaint reassigned to ${newUnit}.`,
      data: anonymizeComplaint(complaint, req.user),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Escalate overdue complaint
// @route   POST /api/staff/complaints/:id/escalate
// @access  Private (Staff, Admin)
export const escalateComplaint = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const complaint = await Complaint.findOne(isObjectId ? { _id: req.params.id } : { ticketNumber: req.params.id.toUpperCase() });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    complaint.priority = 'Critical';
    complaint.status = 'AWAITING_ADMIN_REVIEW';

    complaint.statusHistory.push({
      previousStatus: complaint.status,
      newStatus: 'AWAITING_ADMIN_REVIEW',
      changedBy: req.user.id,
      changedByName: `${req.user.name} (${req.user.role})`,
      note: `ESCALATED TO ADMIN: ${reason || 'Complaint exceeded standard resolution SLA window.'}`,
      timestamp: new Date(),
    });

    await complaint.save();

    await logAuditEvent({
      action: 'COMPLAINT_ESCALATED',
      user: req.user,
      targetEntity: 'Complaint',
      targetId: complaint._id,
      details: { ticketNumber: complaint.ticketNumber, reason },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Complaint ${complaint.ticketNumber} escalated to University Administrator Review.`,
      data: anonymizeComplaint(complaint, req.user),
    });
  } catch (error) {
    next(error);
  }
};
