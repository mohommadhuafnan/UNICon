import User from '../models/User.js';
import Issue from '../models/Issue.js';
import Announcement from '../models/Announcement.js';
import Opportunity from '../models/Opportunity.js';
import Resource from '../models/Resource.js';
import Event from '../models/Event.js';
import Feedback from '../models/Feedback.js';

// @desc    Get overall admin platform analytics & metrics
// @route   GET /api/admin/stats
// @access  Private (Staff, Admin)
export const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      studentsCount,
      staffCount,
      totalIssues,
      openIssues,
      inProgressIssues,
      resolvedIssues,
      totalAnnouncements,
      activeOpportunities,
      totalResources,
      upcomingEvents,
      totalFeedback,
      pendingFeedback,
      issuesByCategory,
      issuesByStatus,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: { $in: ['staff', 'admin'] } }),
      Issue.countDocuments(),
      Issue.countDocuments({ status: { $in: ['Reported', 'Under Review'] } }),
      Issue.countDocuments({ status: 'In Progress' }),
      Issue.countDocuments({ status: 'Resolved' }),
      Announcement.countDocuments(),
      Opportunity.countDocuments({ status: 'Active', deadline: { $gte: new Date() } }),
      Resource.countDocuments(),
      Event.countDocuments({ startDate: { $gte: new Date() } }),
      Feedback.countDocuments(),
      Feedback.countDocuments({ status: 'Submitted' }),
      Issue.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Issue.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role university createdAt'),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        studentsCount,
        staffCount,
        totalIssues,
        openIssues,
        inProgressIssues,
        resolvedIssues,
        resolutionRate: totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0,
        totalAnnouncements,
        activeOpportunities,
        totalResources,
        upcomingEvents,
        totalFeedback,
        pendingFeedback,
        issuesByCategory: issuesByCategory.map((c) => ({ category: c._id, count: c.count })),
        issuesByStatus: issuesByStatus.map((s) => ({ status: s._id, count: s.count })),
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users list for admin moderation
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role && role !== 'All') {
      query.role = role;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { studentId: searchRegex }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user role or status
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Admin)
export const updateUserRole = async (req, res, next) => {
  try {
    const { role, accountStatus } = req.body;
    const validRoles = ['student', 'staff', 'organizer', 'admin'];

    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (role) user.role = role;
    if (accountStatus) user.accountStatus = accountStatus;

    await user.save();

    res.json({
      success: true,
      message: 'User permissions updated successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Student personalized dashboard summary
// @route   GET /api/admin/student-summary
// @access  Private
export const getStudentSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [
      myReportedIssuesCount,
      myResolvedIssuesCount,
      savedOpportunitiesCount,
      savedEventsCount,
      recentIssues,
      latestAnnouncements,
      recommendedOpportunities,
      upcomingEvents,
    ] = await Promise.all([
      Issue.countDocuments({ reporter: userId }),
      Issue.countDocuments({ reporter: userId, status: 'Resolved' }),
      Opportunity.countDocuments({ savedBy: userId }),
      Event.countDocuments({ savedBy: userId }),
      Issue.find().sort({ createdAt: -1 }).limit(4).populate('reporter', 'name avatar').lean(),
      Announcement.find({ isPublished: true }).sort({ publishedAt: -1 }).limit(3).lean(),
      Opportunity.find({ status: 'Active', deadline: { $gte: new Date() } }).sort({ deadline: 1 }).limit(3).lean(),
      Event.find({ startDate: { $gte: new Date() } }).sort({ startDate: 1 }).limit(3).lean(),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          myReportedIssues: myReportedIssuesCount,
          myResolvedIssues: myResolvedIssuesCount,
          savedOpportunities: savedOpportunitiesCount,
          savedEvents: savedEventsCount,
        },
        recentIssues,
        latestAnnouncements,
        recommendedOpportunities,
        upcomingEvents,
      },
    });
  } catch (error) {
    next(error);
  }
};
