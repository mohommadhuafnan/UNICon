import RoutingRule from '../models/RoutingRule.js';
import User from '../models/User.js';

/**
 * Route a complaint according to verified admin-configured routing rules
 */
export const routeComplaint = async ({
  category,
  subcategory,
  faculty,
  locationDetails = {},
  location = '',
}) => {
  // 1. Fetch all active routing rules for this category, ordered by priority
  const rules = await RoutingRule.find({
    category,
    isActive: true,
  }).sort({ priority: -1 }).lean();

  if (!rules || rules.length === 0) {
    return {
      status: 'AWAITING_ADMIN_REVIEW',
      assignedUnit: 'Unassigned (Awaiting Admin Review)',
      assignedStaff: null,
      assignedStaffName: '',
      ruleApplied: 'NO_MATCHING_RULE',
      reason: `No active routing rule configured for category "${category}". Routed to Administrator Review queue.`,
      isVerifiedAssignment: false,
    };
  }

  // 2. Find the most specific matching rule
  let matchedRule = null;

  for (const rule of rules) {
    // Check subcategory match
    const subcategoryMatch =
      rule.subcategory === 'ALL' ||
      !rule.subcategory ||
      rule.subcategory.toUpperCase() === (subcategory || '').toUpperCase();

    // Check faculty match
    const facultyMatch =
      rule.facultyScope === 'ANY' ||
      !rule.facultyScope ||
      rule.facultyScope.toLowerCase() === (faculty || '').toLowerCase();

    // Check hostel match if location is hostel
    const hostelName = locationDetails.hostelName || '';
    const hostelMatch =
      rule.hostelScope === 'ANY' ||
      !rule.hostelScope ||
      (hostelName && rule.hostelScope.toLowerCase() === hostelName.toLowerCase());

    if (subcategoryMatch && facultyMatch && hostelMatch) {
      matchedRule = rule;
      break;
    }
  }

  if (!matchedRule) {
    return {
      status: 'AWAITING_ADMIN_REVIEW',
      assignedUnit: 'Unassigned (No Specific Scope Rule)',
      assignedStaff: null,
      assignedStaffName: '',
      ruleApplied: 'NO_SPECIFIC_RULE',
      reason: `Category "${category}" matched, but no specific subcategory/scope rule matched "${subcategory}" at "${location}".`,
      isVerifiedAssignment: false,
    };
  }

  // 3. Find an authorized staff member for this service unit or role
  let assignedStaff = null;
  let assignedStaffName = '';

  const candidateQuery = {
    accountStatus: 'active',
  };

  if (matchedRule.permittedRoles && matchedRule.permittedRoles.length > 0) {
    candidateQuery.role = { $in: matchedRule.permittedRoles };
  }

  // If faculty scope specified on staff
  if (matchedRule.facultyScope && matchedRule.facultyScope !== 'ANY') {
    candidateQuery.assignedFaculties = matchedRule.facultyScope;
  }

  // If hostel scope specified on staff
  if (matchedRule.hostelScope && matchedRule.hostelScope !== 'ANY') {
    candidateQuery.assignedHostels = matchedRule.hostelScope;
  }

  const candidateStaff = await User.findOne(candidateQuery).select('_id name role email');

  if (candidateStaff) {
    assignedStaff = candidateStaff._id;
    assignedStaffName = `${candidateStaff.name} (${candidateStaff.role})`;
  }

  const initialStatus = 'ASSIGNED';
  const hours = matchedRule.escalationHours || 48;

  return {
    status: initialStatus,
    assignedUnit: matchedRule.responsibleUnit,
    assignedStaff,
    assignedStaffName,
    ruleApplied: matchedRule.name,
    ruleAppliedName: matchedRule.name,
    ruleAppliedId: matchedRule._id,
    escalationHours: hours,
    slaHours: hours,
    slaEscalationDueAt: new Date(Date.now() + hours * 3600 * 1000),
    isVerifiedAssignment: true,
    reason: `Verified routing rule "${matchedRule.name}" applied. Assigned to ${matchedRule.responsibleUnit}.`,
  };
};

/**
 * Detect conflicts in routing rules
 */
export const detectRoutingRuleConflicts = async (newRule) => {
  const existingRules = await RoutingRule.find({
    category: newRule.category,
    subcategory: newRule.subcategory,
    facultyScope: newRule.facultyScope || 'ANY',
    hostelScope: newRule.hostelScope || 'ANY',
    locationScope: newRule.locationScope || 'ANY',
    isActive: true,
    _id: { $ne: newRule._id },
  }).lean();

  if (existingRules.length > 0) {
    return {
      hasConflict: true,
      conflicts: existingRules.map((r) => ({
        id: r._id,
        name: r.name,
        responsibleUnit: r.responsibleUnit,
      })),
      message: `Warning: ${existingRules.length} existing active rule(s) already match category "${newRule.category}" and subcategory "${newRule.subcategory}". Priority will determine precedence.`,
    };
  }

  return { hasConflict: false };
};
