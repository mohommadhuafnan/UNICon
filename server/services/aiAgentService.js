import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';
import AIExecutionLog from '../models/AIExecutionLog.js';
import User from '../models/User.js';
import { retrieveRelevantChunks } from './ragService.js';
import { classifyComplaintWithAI } from './openRouterService.js';
import { routeComplaint } from './routingEngine.js';

/**
 * Tool 1: searchUniversityKnowledge
 */
export const searchUniversityKnowledge = async ({ query, departmentScope }, context = {}) => {
  const chunks = await retrieveRelevantChunks(query, { departmentScope, topK: 3 });
  return {
    success: true,
    results: chunks.map((c) => ({
      documentTitle: c.documentTitle,
      content: c.content,
      sourceUrl: c.sourceUrl,
      relevanceScore: Math.round((c.score || 0) * 100) / 100,
    })),
  };
};

/**
 * Tool 2: classifyComplaint
 */
export const classifyComplaintTool = async ({ complaintText, location, faculty }, context = {}) => {
  const result = await classifyComplaintWithAI({
    title: complaintText.slice(0, 100),
    description: complaintText,
    location: location || '',
    faculty: faculty || '',
  });
  return { success: true, classification: result };
};

/**
 * Tool 3: findResponsibleDepartment
 */
export const findResponsibleDepartment = async ({ category, subcategory, location, faculty }, context = {}) => {
  const decision = await routeComplaint({
    category,
    subcategory,
    faculty,
    location,
  });
  return { success: true, routingDecision: decision };
};

/**
 * Tool 4: createComplaintTicket
 */
export const createComplaintTicket = async (complaintData, context = {}) => {
  if (!context.user) {
    throw new Error('Authentication required to create complaint ticket.');
  }

  // Validate required fields
  if (!complaintData.title || !complaintData.description || !complaintData.category) {
    throw new Error('Title, description, and category are required.');
  }

  // Classify with AI
  const classification = await classifyComplaintWithAI({
    title: complaintData.title,
    description: complaintData.description,
    location: complaintData.location,
    faculty: context.user.faculty || complaintData.faculty,
  });

  // Apply verified routing
  const routing = await routeComplaint({
    category: classification.category || complaintData.category,
    subcategory: classification.subcategory || complaintData.subcategory,
    faculty: context.user.faculty || complaintData.faculty,
    location: complaintData.location,
  });

  const complaint = await Complaint.create({
    title: complaintData.title,
    description: complaintData.description,
    category: classification.category || complaintData.category,
    subcategory: classification.subcategory || complaintData.subcategory,
    location: complaintData.location || 'Campus Facility',
    specificLocation: complaintData.specificLocation || '',
    faculty: context.user.faculty || 'Faculty of Technology',
    university: 'South Eastern University of Sri Lanka',
    reporter: context.user._id,
    studentRegistrationNumber: context.user.registrationNumber || context.user.studentId || '',
    studentName: context.user.name,
    priority: classification.suggestedPriority || complaintData.priority || 'Medium',
    status: routing.status || 'ASSIGNED',
    aiAnalysis: classification,
    routingDecision: routing,
    statusHistory: [
      {
        previousStatus: '',
        newStatus: routing.status || 'ASSIGNED',
        changedBy: context.user._id,
        changedByName: `${context.user.name} (Student)`,
        note: `Complaint officially submitted and verified route applied: ${routing.ruleApplied}`,
        timestamp: new Date(),
      },
    ],
  });

  // Notify student
  await Notification.create({
    recipient: context.user._id,
    type: 'issue_status',
    title: `Ticket Created: ${complaint.ticketNumber}`,
    message: `Your complaint "${complaint.title}" has been registered. Initial status: ${complaint.status} (${routing.assignedUnit}).`,
    link: `/campuscare/${complaint._id}`,
  });

  return {
    success: true,
    ticketNumber: complaint.ticketNumber,
    complaintId: complaint._id,
    status: complaint.status,
    assignedUnit: routing.assignedUnit,
  };
};

/**
 * Tool 5: getComplaintStatus
 */
export const getComplaintStatus = async (args = {}, context = {}) => {
  const user = context.user || (context._id ? context : null);
  if (!user) throw new Error('Authentication required.');

  const ticketIdentifier = args.ticketId || args.ticketNumber;
  if (!ticketIdentifier) throw new Error('ticketId or ticketNumber required.');

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(ticketIdentifier);
  const query = isObjectId ? { _id: ticketIdentifier } : { ticketNumber: ticketIdentifier.toUpperCase() };

  const complaint = await Complaint.findOne(query)
    .populate('reporter', 'name email registrationNumber')
    .select('ticketNumber title category subcategory location status priority routingDecision statusHistory createdAt')
    .lean();

  if (!complaint) {
    return { success: false, message: `Ticket ${ticketId} not found.` };
  }

  // Authorization check: students can only see their own tickets
  if (
    user.role === 'STUDENT' &&
    complaint.reporter?._id?.toString() !== user._id?.toString()
  ) {
    throw new Error('Access denied: You are only authorized to check status of your own tickets.');
  }

  return { success: true, complaint };
};

/**
 * Tool 6: requestStudentClarification
 */
export const requestStudentClarification = async ({ ticketId, message }, context = {}) => {
  if (!context.user || context.user.role === 'STUDENT') {
    throw new Error('Only authorized staff or administrators can request student clarification.');
  }

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(ticketId);
  const complaint = await Complaint.findOne(isObjectId ? { _id: ticketId } : { ticketNumber: ticketId.toUpperCase() });

  if (!complaint) throw new Error(`Complaint ${ticketId} not found.`);

  complaint.clarificationRequests.push({
    requestedBy: context.user._id,
    requestedByName: context.user.name,
    question: message,
    requestedAt: new Date(),
  });

  const previousStatus = complaint.status;
  complaint.status = 'AWAITING_CLARIFICATION';

  complaint.statusHistory.push({
    previousStatus,
    newStatus: 'AWAITING_CLARIFICATION',
    changedBy: context.user._id,
    changedByName: `${context.user.name} (${context.user.role})`,
    note: `Clarification requested: "${message}"`,
    timestamp: new Date(),
  });

  await complaint.save();

  // Notify student
  await Notification.create({
    recipient: complaint.reporter,
    type: 'clarification_needed',
    title: `Action Required: Clarification Needed for ${complaint.ticketNumber}`,
    message: `${context.user.name} requested: "${message}"`,
    link: `/campuscare/${complaint._id}`,
  });

  return { success: true, message: 'Clarification request sent to student.' };
};

/**
 * Tool 7: notifyResponsibleStaff
 */
export const notifyResponsibleStaff = async ({ ticketId }, context = {}) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(ticketId);
  const complaint = await Complaint.findOne(isObjectId ? { _id: ticketId } : { ticketNumber: ticketId.toUpperCase() });

  if (!complaint) throw new Error(`Complaint ${ticketId} not found.`);

  if (complaint.routingDecision?.assignedStaff) {
    await Notification.create({
      recipient: complaint.routingDecision.assignedStaff,
      type: 'issue_assigned',
      title: `Work Order Assigned: ${complaint.ticketNumber}`,
      message: `A new complaint "${complaint.title}" at ${complaint.location} has been assigned to your queue.`,
      link: `/campuscare/${complaint._id}`,
    });
    return { success: true, message: 'Notification sent to assigned staff member.' };
  }

  return { success: true, message: 'No specific individual staff assigned; notified service unit queue.' };
};

/**
 * Tool 8: updateComplaintStatus
 */
export const updateComplaintStatus = async ({ ticketId, newStatus, note, resolutionDetails }, context = {}) => {
  if (!context.user || context.user.role === 'STUDENT') {
    throw new Error('Only authorized staff or administrators can update complaint status.');
  }

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(ticketId);
  const complaint = await Complaint.findOne(isObjectId ? { _id: ticketId } : { ticketNumber: ticketId.toUpperCase() });

  if (!complaint) throw new Error(`Complaint ${ticketId} not found.`);

  const previousStatus = complaint.status;
  complaint.status = newStatus;

  complaint.statusHistory.push({
    previousStatus,
    newStatus,
    changedBy: context.user._id,
    changedByName: `${context.user.name} (${context.user.role})`,
    note: note || `Status transitioned to ${newStatus}.`,
    timestamp: new Date(),
  });

  if (newStatus === 'RESOLVED' && resolutionDetails) {
    complaint.resolutionDetails = {
      resolvedBy: context.user._id,
      resolvedByName: context.user.name,
      details: resolutionDetails,
      resolvedAt: new Date(),
    };
  }

  await complaint.save();

  // Notify student
  await Notification.create({
    recipient: complaint.reporter,
    type: 'issue_status',
    title: `Ticket Status Updated: ${newStatus}`,
    message: `Your ticket ${complaint.ticketNumber} is now "${newStatus}". Note: ${note || 'Updated by authorized staff.'}`,
    link: `/campuscare/${complaint._id}`,
  });

  return { success: true, status: newStatus, ticketNumber: complaint.ticketNumber };
};

/**
 * Tool 9: escalateOverdueComplaint
 */
export const escalateOverdueComplaint = async ({ ticketId, reason }, context = {}) => {
  if (!context.user || context.user.role === 'STUDENT') {
    throw new Error('Permission denied.');
  }

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(ticketId);
  const complaint = await Complaint.findOne(isObjectId ? { _id: ticketId } : { ticketNumber: ticketId.toUpperCase() });

  if (!complaint) throw new Error(`Complaint ${ticketId} not found.`);

  complaint.priority = 'CRITICAL';
  complaint.status = 'AWAITING_ADMIN_REVIEW';

  complaint.statusHistory.push({
    previousStatus: complaint.status,
    newStatus: 'AWAITING_ADMIN_REVIEW',
    changedBy: context.user._id,
    changedByName: `${context.user.name} (Escalation)`,
    note: `ESCALATED: ${reason || 'Overdue complaint escalated to university administrator review queue.'}`,
    timestamp: new Date(),
  });

  await complaint.save();

  return { success: true, message: `Ticket ${complaint.ticketNumber} escalated to Administrator Review.` };
};

/**
 * Agent Dispatcher with Execution Auditing
 */
export const executeAgentTool = async (toolName, inputArgs, context = {}) => {
  const startTime = Date.now();
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  let outputResult = null;
  let isSuccess = true;
  let errorMessage = '';

  try {
    switch (toolName) {
      case 'searchUniversityKnowledge':
        outputResult = await searchUniversityKnowledge(inputArgs, context);
        break;
      case 'classifyComplaint':
        outputResult = await classifyComplaintTool(inputArgs, context);
        break;
      case 'findResponsibleDepartment':
        outputResult = await findResponsibleDepartment(inputArgs, context);
        break;
      case 'createComplaintTicket':
        outputResult = await createComplaintTicket(inputArgs, context);
        break;
      case 'getComplaintStatus':
        outputResult = await getComplaintStatus(inputArgs, context);
        break;
      case 'requestStudentClarification':
        outputResult = await requestStudentClarification(inputArgs, context);
        break;
      case 'notifyResponsibleStaff':
        outputResult = await notifyResponsibleStaff(inputArgs, context);
        break;
      case 'updateComplaintStatus':
        outputResult = await updateComplaintStatus(inputArgs, context);
        break;
      case 'escalateOverdueComplaint':
        outputResult = await escalateOverdueComplaint(inputArgs, context);
        break;
      default:
        throw new Error(`Tool "${toolName}" is not a recognized verified agent tool.`);
    }
  } catch (err) {
    isSuccess = false;
    errorMessage = err.message;
    outputResult = { success: false, error: err.message };
  } finally {
    const executionTimeMs = Date.now() - startTime;
    // Log tool execution for audit compliance
    try {
      await AIExecutionLog.create({
        traceId,
        toolName,
        inputArgs,
        outputResult,
        executionTimeMs,
        isSuccess,
        performedBy: context.user?._id || null,
        errorMessage,
      });
    } catch (logErr) {
      console.error('[AI Log Error]', logErr.message);
    }
  }

  if (!isSuccess) {
    throw new Error(errorMessage);
  }

  return outputResult;
};
