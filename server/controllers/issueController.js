import Complaint from '../models/Complaint.js';
import IssueSupport from '../models/IssueSupport.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { classifyComplaintWithAI } from '../services/openRouterService.js';
import { classifyComplaintWithGemini, getUnitForRole, getCategoryKeyForRole } from '../services/geminiAgentService.js';
import { routeComplaint } from '../services/routingEngine.js';
import { logAuditEvent } from '../services/auditService.js';

// Allowed status transitions
const PERMITTED_STATUS_TRANSITIONS = {
  SUBMITTED: ['AI_ANALYSIS_PENDING', 'ASSIGNED', 'AWAITING_ADMIN_REVIEW', 'REJECTED'],
  AI_ANALYSIS_PENDING: ['ASSIGNED', 'AWAITING_ADMIN_REVIEW', 'AWAITING_CLARIFICATION'],
  AWAITING_CLARIFICATION: ['ASSIGNED', 'IN_PROGRESS', 'AWAITING_ADMIN_REVIEW', 'REJECTED'],
  AWAITING_ADMIN_REVIEW: ['ASSIGNED', 'REJECTED', 'ON_HOLD'],
  ASSIGNED: ['ACKNOWLEDGED', 'IN_PROGRESS', 'ON_HOLD', 'AWAITING_CLARIFICATION', 'REJECTED'],
  ACKNOWLEDGED: ['IN_PROGRESS', 'ON_HOLD', 'AWAITING_CLARIFICATION'],
  IN_PROGRESS: ['ON_HOLD', 'RESOLVED', 'AWAITING_CLARIFICATION'],
  ON_HOLD: ['IN_PROGRESS', 'AWAITING_CLARIFICATION', 'REJECTED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'], // can be reopened if permitted
  CLOSED: ['IN_PROGRESS'],
  REJECTED: ['AWAITING_ADMIN_REVIEW'],
  // Legacy aliases support
  Reported: ['Under Review', 'In Progress', 'Rejected'],
  'Under Review': ['In Progress', 'Resolved', 'Rejected'],
  'In Progress': ['Resolved', 'Closed'],
  Resolved: ['Closed', 'In Progress'],
  Closed: [],
  Rejected: ['Under Review'],
};

// @desc    Get all complaints/issues with search, filtering, and role-based scoping
// @route   GET /api/issues
// @access  Public / Optional Auth / Authenticated
export const getIssues = async (req, res, next) => {
  try {
    const {
      search,
      category,
      status,
      priority,
      faculty,
      sort = 'newest',
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Filter by Category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by Status
    if (status && status !== 'All') {
      query.status = status;
    }

    // Filter by Priority
    if (priority && priority !== 'All') {
      query.priority = new RegExp(`^${priority}$`, 'i');
    }

    // Filter by Faculty
    if (faculty && faculty !== 'All') {
      query.faculty = faculty;
    }

    // Search query
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { ticketNumber: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { specificLocation: searchRegex },
      ];
    }

    // Students only see their own complaints when requesting their dashboard queue
    if (req.user && req.user.role === 'STUDENT' && req.query.myOnly === 'true') {
      query.reporter = req.user.id;
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sort === 'most_supported') {
      sortOptions = { supportCount: -1, createdAt: -1 };
    } else if (sort === 'priority') {
      sortOptions = { priority: 1, createdAt: -1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [issues, total] = await Promise.all([
      Complaint.find(query)
        .populate('reporter', 'name role avatar studentId registrationNumber')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Complaint.countDocuments(query),
    ]);

    // Check which issues the current user has supported
    let userSupportedSet = new Set();
    if (req.user) {
      const issueIds = issues.map((i) => i._id);
      const supports = await IssueSupport.find({
        issue: { $in: issueIds },
        user: req.user.id,
      }).lean();
      userSupportedSet = new Set(supports.map((s) => s.issue.toString()));
    }

    // Enrich issues with hasSupported and mask anonymous reporter for public/other students
    const isStaffOrAdmin = req.user && req.user.role !== 'STUDENT';

    const enrichedIssues = issues.map((issue) => {
      let reporterInfo = issue.reporter;
      if (issue.isAnonymous && !isStaffOrAdmin) {
        reporterInfo = { name: 'Anonymous Student', role: 'STUDENT' };
      }

      // Hide confidential internal notes from students
      const visibleIssue = { ...issue };
      if (!isStaffOrAdmin) {
        delete visibleIssue.internalNotes;
      }

      return {
        ...visibleIssue,
        reporter: reporterInfo,
        hasSupported: userSupportedSet.has(issue._id.toString()),
      };
    });

    // Summary counts
    const [totalSubmitted, totalAssigned, totalInProgress, totalResolved, totalAwaitingReview] =
      await Promise.all([
        Complaint.countDocuments({ status: { $in: ['SUBMITTED', 'Reported'] } }),
        Complaint.countDocuments({ status: { $in: ['ASSIGNED', 'ACKNOWLEDGED'] } }),
        Complaint.countDocuments({ status: { $in: ['IN_PROGRESS', 'In Progress'] } }),
        Complaint.countDocuments({ status: { $in: ['RESOLVED', 'Resolved'] } }),
        Complaint.countDocuments({ status: { $in: ['AWAITING_ADMIN_REVIEW', 'Under Review'] } }),
      ]);

    res.json({
      success: true,
      count: enrichedIssues.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      stats: {
        totalIssues: await Complaint.countDocuments(),
        submitted: totalSubmitted,
        assigned: totalAssigned,
        inProgress: totalInProgress,
        resolved: totalResolved,
        awaitingReview: totalAwaitingReview,
      },
      data: enrichedIssues,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single complaint/issue by ID or Ticket Number
// @route   GET /api/issues/:id
// @access  Public / Optional Auth / Authenticated
export const getIssueById = async (req, res, next) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId ? { _id: req.params.id } : { ticketNumber: req.params.id.toUpperCase() };

    const issue = await Complaint.findOne(query)
      .populate('reporter', 'name email role faculty department registrationNumber studentId avatar')
      .populate('statusHistory.changedBy', 'name role')
      .populate('officialResponses.user', 'name role avatar')
      .populate('internalNotes.author', 'name role avatar');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: `Complaint not found for identifier "${req.params.id}".`,
      });
    }

    let hasSupported = false;
    if (req.user) {
      const support = await IssueSupport.findOne({
        issue: issue._id,
        user: req.user.id,
      });
      hasSupported = !!support;
    }

    const issueObj = issue.toObject();
    const isStaffOrAdmin = req.user && req.user.role !== 'STUDENT';

    if (issueObj.isAnonymous && !isStaffOrAdmin) {
      issueObj.reporter = {
        name: 'Anonymous Student',
        role: 'STUDENT',
      };
    }

    // Hide internal notes from students
    if (!isStaffOrAdmin) {
      delete issueObj.internalNotes;
    }

    res.json({
      success: true,
      data: {
        ...issueObj,
        hasSupported,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new campus complaint report (with AI classification & verified routing)
// @route   POST /api/issues
// @access  Private (Authenticated users)
export const createIssue = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      subcategory,
      location,
      specificLocation,
      locationDetails,
      priority,
      isAnonymous,
      imageUrl,
      submissionMode, // 'manual' | 'agent'
      targetOfficerRole, // e.g. 'FACULTY_OFFICER' | 'LIBRARY_OFFICER' | 'HOSTEL_WARDEN' | 'CANTEEN_MANAGER'
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both title and detailed complaint description.',
      });
    }

    // Duplicate submission protection: check if identical title was submitted by this user in last 15 seconds
    const recentDuplicate = await Complaint.findOne({
      reporter: req.user.id,
      title: title.trim(),
      createdAt: { $gte: new Date(Date.now() - 15000) },
    });

    if (recentDuplicate) {
      return res.status(429).json({
        success: false,
        message: 'Duplicate submission detected. Your complaint has already been received.',
        ticketNumber: recentDuplicate.ticketNumber,
        data: recentDuplicate,
      });
    }

    // Parse location details if passed as JSON string
    let parsedLocationDetails = {
      locationType: 'GENERAL',
      facultyName: req.user.faculty || '',
      hostelName: '',
      building: '',
      roomOrArea: specificLocation || '',
    };

    if (locationDetails) {
      try {
        parsedLocationDetails = typeof locationDetails === 'string' ? JSON.parse(locationDetails) : locationDetails;
      } catch {}
    }

    // Uploaded file path if provided via multer
    let finalImageUrl = imageUrl || '';
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    let assignedCategory = category || 'FACULTY_RELATED';
    let assignedSubcategory = subcategory || 'GENERAL';
    let routing = null;
    let aiClassification = null;

    if (submissionMode === 'agent') {
      // 1. AI Decision-Making Agent using Google Gemini
      const geminiDecision = await classifyComplaintWithGemini({
        title,
        description,
        faculty: req.user.faculty,
      });

      assignedCategory = geminiDecision.categoryKey;
      assignedSubcategory = 'AI_AUTO_ROUTED';

      // Find responsible staff user corresponding to targetRole
      const targetOfficer = await User.findOne({
        role: geminiDecision.targetRole,
        accountStatus: 'active',
      }).select('_id name role email');

      routing = {
        status: 'ASSIGNED',
        assignedUnit: geminiDecision.assignedUnit,
        assignedStaff: targetOfficer ? targetOfficer._id : null,
        assignedStaffName: targetOfficer ? `${targetOfficer.name} (${targetOfficer.role})` : geminiDecision.assignedUnit,
        ruleApplied: `Gemini AI Decision Agent (${geminiDecision.aiModel})`,
        reason: geminiDecision.reasoning,
        isVerifiedAssignment: true,
        targetRole: geminiDecision.targetRole,
      };

      aiClassification = {
        category: geminiDecision.categoryKey,
        targetRole: geminiDecision.targetRole,
        confidence: geminiDecision.confidence,
        summary: geminiDecision.summary,
        reason: geminiDecision.reasoning,
        suggestedPriority: geminiDecision.suggestedPriority,
        aiModel: geminiDecision.aiModel,
      };
    } else if (targetOfficerRole) {
      // 2. Manual Routing mode with directly chosen official role
      assignedCategory = getCategoryKeyForRole(targetOfficerRole);
      const assignedUnit = getUnitForRole(targetOfficerRole);

      const targetOfficer = await User.findOne({
        role: targetOfficerRole,
        accountStatus: 'active',
      }).select('_id name role email');

      routing = {
        status: 'ASSIGNED',
        assignedUnit,
        assignedStaff: targetOfficer ? targetOfficer._id : null,
        assignedStaffName: targetOfficer ? `${targetOfficer.name} (${targetOfficer.role})` : assignedUnit,
        ruleApplied: 'Manual Targeted Routing',
        reason: `Student directly routed complaint to ${targetOfficerRole}`,
        isVerifiedAssignment: true,
        targetRole: targetOfficerRole,
      };
    } else {
      // 3. Fallback Standard Scope Routing
      try {
        aiClassification = await classifyComplaintWithAI({
          title,
          description,
          location,
          faculty: req.user.faculty,
        });
      } catch (aiErr) {
        console.warn('[AI Engine Warning]', aiErr.message);
      }

      assignedCategory = aiClassification?.category || category || 'CAMPUS_MAINTENANCE';
      assignedSubcategory = subcategory || aiClassification?.subcategory || 'GENERAL';

      routing = await routeComplaint({
        category: assignedCategory,
        subcategory: assignedSubcategory,
        faculty: req.user.faculty,
        locationDetails: parsedLocationDetails,
        location: location || 'Campus',
      });
    }

    // 3. Create Ticket with Unique Identifier
    const initialStatus = routing.status || 'ASSIGNED';
    const initialPriority = priority || aiClassification?.suggestedPriority || 'Medium';

    const complaint = await Complaint.create({
      title: title.trim(),
      description: description.trim(),
      category: assignedCategory,
      subcategory: assignedSubcategory,
      location: (location || parsedLocationDetails.roomOrArea || 'SEUSL Campus').trim(),
      specificLocation: specificLocation ? specificLocation.trim() : '',
      locationDetails: parsedLocationDetails,
      university: 'South Eastern University of Sri Lanka',
      faculty: req.user.faculty || 'Faculty of Technology',
      priority: initialPriority,
      isAnonymous: Boolean(isAnonymous),
      imageUrl: finalImageUrl,
      reporter: req.user.id,
      studentRegistrationNumber: req.user.registrationNumber || req.user.studentId || '',
      studentName: req.user.name,
      status: initialStatus,
      aiAnalysis: aiClassification,
      routingDecision: routing,
      statusHistory: [
        {
          previousStatus: '',
          newStatus: initialStatus,
          changedBy: req.user.id,
          changedByName: `${req.user.name} (Student)`,
          note: `Complaint logged and verified route applied: ${routing.ruleApplied || 'Default Routing'}. Assigned to ${routing.assignedUnit}.`,
          timestamp: new Date(),
        },
      ],
    });

    // 4. Create in-app notification for student
    await Notification.create({
      recipient: req.user.id,
      type: 'issue_status',
      title: `Complaint Submitted: ${complaint.ticketNumber}`,
      message: `Your campus complaint "${complaint.title}" has been registered with ticket ${complaint.ticketNumber}. Assigned to: ${routing.assignedUnit}.`,
      link: `/campuscare/${complaint._id}`,
    });

    // 5. Notify assigned staff if specific staff identified
    if (routing.assignedStaff) {
      await Notification.create({
        recipient: routing.assignedStaff,
        type: 'issue_assigned',
        title: `New Ticket Assigned: ${complaint.ticketNumber}`,
        message: `Complaint "${complaint.title}" at ${complaint.location} requires your attention.`,
        link: `/campuscare/${complaint._id}`,
      });
    }

    await logAuditEvent({
      action: 'COMPLAINT_CREATED',
      user: req.user,
      targetEntity: 'Complaint',
      targetId: complaint._id,
      details: {
        ticketNumber: complaint.ticketNumber,
        category: complaint.category,
        assignedUnit: routing.assignedUnit,
        initialStatus,
      },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Campus complaint submitted successfully. Ticket #${complaint.ticketNumber}`,
      ticketNumber: complaint.ticketNumber,
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint status & workflow
// @route   PATCH /api/issues/:id/status
// @access  Private (Staff, Admin)
export const updateIssueStatus = async (req, res, next) => {
  try {
    const { status, note, resolutionDetails } = req.body;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId ? { _id: req.params.id } : { ticketNumber: req.params.id.toUpperCase() };

    const complaint = await Complaint.findOne(query);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    const previousStatus = complaint.status;

    // Validate transition
    const allowedNext = PERMITTED_STATUS_TRANSITIONS[previousStatus] || [];
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'admin';

    if (!isSuperAdmin && allowedNext.length > 0 && !allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from "${previousStatus}" to "${status}". Permitted: ${allowedNext.join(', ')}`,
      });
    }

    complaint.status = status;

    complaint.statusHistory.push({
      previousStatus,
      newStatus: status,
      changedBy: req.user.id,
      changedByName: `${req.user.name} (${req.user.role.toUpperCase()})`,
      note: note || `Status transitioned from ${previousStatus} to ${status}.`,
      timestamp: new Date(),
    });

    if (status === 'RESOLVED' || status === 'Resolved') {
      complaint.resolutionDetails = {
        resolvedBy: req.user.id,
        resolvedByName: req.user.name,
        details: resolutionDetails || note || 'Complaint marked as resolved by authorized officer.',
        resolvedAt: new Date(),
      };
    }

    await complaint.save();

    // Notify student
    await Notification.create({
      recipient: complaint.reporter,
      type: 'issue_status',
      title: `Ticket Status Updated: ${status}`,
      message: `Your complaint (${complaint.ticketNumber}) is now marked as "${status}". Note: ${note || 'Updated by university representative.'}`,
      link: `/campuscare/${complaint._id}`,
    });

    await logAuditEvent({
      action: 'COMPLAINT_STATUS_UPDATED',
      user: req.user,
      targetEntity: 'Complaint',
      targetId: complaint._id,
      details: { previousStatus, newStatus: status, note },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Complaint ${complaint.ticketNumber} status updated to ${status}.`,
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add official public response / remark shown to student
// @route   POST /api/issues/:id/respond
// @access  Private (Staff, Admin)
export const addOfficialResponse = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Response message cannot be empty.',
      });
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const complaint = await Complaint.findOne(isObjectId ? { _id: req.params.id } : { ticketNumber: req.params.id.toUpperCase() });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    complaint.officialResponses.push({
      user: req.user.id,
      responderName: req.user.name,
      responderRole: req.user.role,
      message: message.trim(),
      isOfficial: true,
      createdAt: new Date(),
    });

    await complaint.save();

    // Notify student
    await Notification.create({
      recipient: complaint.reporter,
      type: 'issue_response',
      title: `Official Response for ${complaint.ticketNumber}`,
      message: `${req.user.name} posted: "${message.slice(0, 90)}..."`,
      link: `/campuscare/${complaint._id}`,
    });

    res.json({
      success: true,
      message: 'Official response added successfully.',
      data: complaint.officialResponses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add internal confidential staff note
// @route   POST /api/issues/:id/internal-note
// @access  Private (Staff, Admin)
export const addInternalNote = async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note || note.trim() === '') {
      return res.status(400).json({ success: false, message: 'Internal note cannot be empty.' });
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const complaint = await Complaint.findOne(isObjectId ? { _id: req.params.id } : { ticketNumber: req.params.id.toUpperCase() });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    complaint.internalNotes.push({
      author: req.user.id,
      authorName: req.user.name,
      authorRole: req.user.role,
      note: note.trim(),
      createdAt: new Date(),
    });

    await complaint.save();

    res.json({
      success: true,
      message: 'Internal confidential note added.',
      data: complaint.internalNotes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Student answers a clarification request
// @route   POST /api/issues/:id/clarification/answer
// @access  Private (Reporter Student)
export const answerClarification = async (req, res, next) => {
  try {
    const { requestId, answer } = req.body;
    if (!answer || answer.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide an answer.' });
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const complaint = await Complaint.findOne(isObjectId ? { _id: req.params.id } : { ticketNumber: req.params.id.toUpperCase() });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (complaint.reporter.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the complaint reporter can submit clarification.' });
    }

    const reqItem = complaint.clarificationRequests.id(requestId) || complaint.clarificationRequests[complaint.clarificationRequests.length - 1];
    if (reqItem) {
      reqItem.studentAnswer = answer.trim();
      reqItem.answeredAt = new Date();
    }

    const prevStatus = complaint.status;
    complaint.status = 'IN_PROGRESS';

    complaint.statusHistory.push({
      previousStatus: prevStatus,
      newStatus: 'IN_PROGRESS',
      changedBy: req.user.id,
      changedByName: `${req.user.name} (Student Clarification Provided)`,
      note: `Student provided clarification: "${answer.slice(0, 100)}..."`,
      timestamp: new Date(),
    });

    await complaint.save();

    res.json({
      success: true,
      message: 'Clarification answer submitted successfully. Complaint moved back to IN_PROGRESS.',
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle community support ("I'm Affected Too")
// @route   POST /api/issues/:id/support
// @access  Private
export const toggleSupport = async (req, res, next) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const complaint = await Complaint.findOne(isObjectId ? { _id: req.params.id } : { ticketNumber: req.params.id.toUpperCase() });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const existingSupport = await IssueSupport.findOne({
      issue: complaint._id,
      user: req.user.id,
    });

    let hasSupported = false;

    if (existingSupport) {
      await IssueSupport.findByIdAndDelete(existingSupport._id);
      complaint.supportCount = Math.max(0, complaint.supportCount - 1);
      await complaint.save();
      hasSupported = false;
    } else {
      await IssueSupport.create({
        issue: complaint._id,
        user: req.user.id,
      });
      complaint.supportCount += 1;
      await complaint.save();
      hasSupported = true;

      if (complaint.supportCount % 5 === 0 && complaint.reporter.toString() !== req.user.id) {
        await Notification.create({
          recipient: complaint.reporter,
          type: 'issue_status',
          title: 'Community Support Milestone',
          message: `Your complaint "${complaint.title}" has reached ${complaint.supportCount} affected students supporting it!`,
          link: `/campuscare/${complaint._id}`,
        });
      }
    }

    res.json({
      success: true,
      hasSupported,
      supportCount: complaint.supportCount,
      message: hasSupported ? 'You have supported this complaint.' : 'Support removed.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get CampusCare & SmartResolve analytics data
// @route   GET /api/issues/analytics
// @access  Public / Authenticated
export const getCampusCareAnalytics = async (req, res, next) => {
  try {
    const [
      byCategory,
      byStatus,
      byPriority,
      byFaculty,
      locationTrends,
      recentIssues,
    ] = await Promise.all([
      Complaint.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Complaint.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Complaint.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Complaint.aggregate([
        { $group: { _id: '$faculty', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Complaint.aggregate([
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      Complaint.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select('ticketNumber title category status priority createdAt supportCount faculty location'),
    ]);

    const totalIssues = await Complaint.countDocuments();
    const resolvedIssues = await Complaint.countDocuments({ status: { $in: ['RESOLVED', 'Resolved', 'CLOSED', 'Closed'] } });
    const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalIssues,
        resolvedIssues,
        resolutionRate,
        byCategory: byCategory.map((item) => ({ name: item._id, value: item.count })),
        byStatus: byStatus.map((item) => ({ name: item._id, value: item.count })),
        byPriority: byPriority.map((item) => ({ name: item._id, value: item.count })),
        byFaculty: byFaculty.map((item) => ({ name: item._id, value: item.count })),
        locationTrends: locationTrends.map((item) => ({ location: item._id, count: item.count })),
        recentIssues,
      },
    });
  } catch (error) {
    next(error);
  }
};
