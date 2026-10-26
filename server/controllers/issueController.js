import Issue from '../models/Issue.js';
import IssueSupport from '../models/IssueSupport.js';
import Notification from '../models/Notification.js';

// @desc    Get all issues with search, filtering, and pagination
// @route   GET /api/issues
// @access  Public / Optional Auth
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

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Status filter
    if (status && status !== 'All') {
      query.status = status;
    }

    // Priority filter
    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    // Faculty filter
    if (faculty && faculty !== 'All') {
      query.faculty = faculty;
    }

    // Search query
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { specificLocation: searchRegex },
      ];
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sort === 'most_supported') {
      sortOptions = { supportCount: -1, createdAt: -1 };
    } else if (sort === 'priority') {
      // Custom priority order handled or by priority field
      sortOptions = { priority: 1, createdAt: -1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [issues, total] = await Promise.all([
      Issue.find(query)
        .populate('reporter', 'name role avatar')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Issue.countDocuments(query),
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

    // Enrich issues with hasSupported and mask anonymous reporter
    const enrichedIssues = issues.map((issue) => {
      let reporterInfo = issue.reporter;
      if (issue.isAnonymous && (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff'))) {
        reporterInfo = { name: 'Anonymous Student', role: 'student' };
      }
      return {
        ...issue,
        reporter: reporterInfo,
        hasSupported: userSupportedSet.has(issue._id.toString()),
      };
    });

    // Also gather aggregate status summary counts
    const [totalReported, totalUnderReview, totalInProgress, totalResolved] = await Promise.all([
      Issue.countDocuments({ status: 'Reported' }),
      Issue.countDocuments({ status: 'Under Review' }),
      Issue.countDocuments({ status: 'In Progress' }),
      Issue.countDocuments({ status: 'Resolved' }),
    ]);

    res.json({
      success: true,
      count: enrichedIssues.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      stats: {
        totalIssues: await Issue.countDocuments(),
        reported: totalReported,
        underReview: totalUnderReview,
        inProgress: totalInProgress,
        resolved: totalResolved,
      },
      data: enrichedIssues,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single issue by ID
// @route   GET /api/issues/:id
// @access  Public / Optional Auth
export const getIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reporter', 'name email role faculty department avatar')
      .populate('statusHistory.changedBy', 'name role')
      .populate('officialResponses.user', 'name role avatar');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.',
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
    if (issueObj.isAnonymous && (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff'))) {
      issueObj.reporter = {
        name: 'Anonymous Student',
        role: 'student',
      };
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

// @desc    Create a new campus issue report
// @route   POST /api/issues
// @access  Private (Authenticated users)
export const createIssue = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      university,
      faculty,
      location,
      specificLocation,
      priority,
      isAnonymous,
      imageUrl,
    } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, category, and location.',
      });
    }

    // Uploaded file path if provided via multer
    let finalImageUrl = imageUrl || '';
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    const issue = await Issue.create({
      title,
      description,
      category,
      university: university || req.user.university || 'University of Colombo',
      faculty: faculty || req.user.faculty || 'Faculty of Computing',
      location,
      specificLocation: specificLocation || '',
      priority: priority || 'Medium',
      isAnonymous: Boolean(isAnonymous),
      imageUrl: finalImageUrl,
      reporter: req.user.id,
      status: 'Reported',
      statusHistory: [
        {
          previousStatus: '',
          newStatus: 'Reported',
          changedBy: req.user.id,
          changedByName: req.user.name,
          note: 'Issue officially reported and submitted for administrative review.',
          timestamp: new Date(),
        },
      ],
    });

    // Create a system confirmation notification for the reporter
    await Notification.create({
      recipient: req.user.id,
      type: 'issue_status',
      title: 'Issue Report Submitted',
      message: `Your campus report "${issue.title}" has been received and assigned status "Reported".`,
      link: `/campuscare/${issue._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Campus issue reported successfully.',
      data: issue,
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
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.',
      });
    }

    const existingSupport = await IssueSupport.findOne({
      issue: issue._id,
      user: req.user.id,
    });

    let hasSupported = false;

    if (existingSupport) {
      // Remove support
      await IssueSupport.findByIdAndDelete(existingSupport._id);
      issue.supportCount = Math.max(0, issue.supportCount - 1);
      await issue.save();
      hasSupported = false;
    } else {
      // Add support
      await IssueSupport.create({
        issue: issue._id,
        user: req.user.id,
      });
      issue.supportCount += 1;
      await issue.save();
      hasSupported = true;

      // Notify the reporter if a milestone is reached or someone supports their issue
      if (issue.supportCount % 5 === 0 && issue.reporter.toString() !== req.user.id) {
        await Notification.create({
          recipient: issue.reporter,
          type: 'issue_status',
          title: 'Community Support Milestone',
          message: `Your report "${issue.title}" now has ${issue.supportCount} affected students supporting it!`,
          link: `/campuscare/${issue._id}`,
        });
      }
    }

    res.json({
      success: true,
      hasSupported,
      supportCount: issue.supportCount,
      message: hasSupported
        ? 'You have supported this report ("Affected Too").'
        : 'Your support has been withdrawn.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update issue status & workflow
// @route   PATCH /api/issues/:id/status
// @access  Private (Staff, Admin)
export const updateIssueStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['Reported', 'Under Review', 'In Progress', 'Resolved', 'Closed', 'Rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.',
      });
    }

    const previousStatus = issue.status;
    issue.status = status;

    issue.statusHistory.push({
      previousStatus,
      newStatus: status,
      changedBy: req.user.id,
      changedByName: `${req.user.name} (${req.user.role.toUpperCase()})`,
      note: note || `Status updated from ${previousStatus} to ${status}.`,
      timestamp: new Date(),
    });

    await issue.save();

    // Notify issue reporter
    await Notification.create({
      recipient: issue.reporter,
      type: 'issue_status',
      title: `Issue Status Updated: ${status}`,
      message: `Your report "${issue.title}" has been moved to "${status}". Note: ${note || 'Status updated by campus representative.'}`,
      link: `/campuscare/${issue._id}`,
    });

    res.json({
      success: true,
      message: `Issue status updated to ${status}.`,
      data: issue,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add official response / remark
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

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.',
      });
    }

    issue.officialResponses.push({
      user: req.user.id,
      responderName: req.user.name,
      responderRole: req.user.role === 'admin' ? 'Campus Administrator' : 'Department Staff Representative',
      message: message.trim(),
      isOfficial: true,
      createdAt: new Date(),
    });

    await issue.save();

    // Notify issue reporter
    await Notification.create({
      recipient: issue.reporter,
      type: 'issue_response',
      title: 'Official Response Added',
      message: `An official response was posted on your report "${issue.title}": "${message.slice(0, 80)}..."`,
      link: `/campuscare/${issue._id}`,
    });

    res.json({
      success: true,
      message: 'Official response submitted successfully.',
      data: issue.officialResponses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get CampusCare analytics data
// @route   GET /api/issues/analytics
// @access  Public / Authenticated
export const getCampusCareAnalytics = async (req, res, next) => {
  try {
    const [
      byCategory,
      byStatus,
      byPriority,
      locationTrends,
      recentIssues,
    ] = await Promise.all([
      Issue.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Issue.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Issue.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Issue.aggregate([
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      Issue.find().sort({ createdAt: -1 }).limit(5).select('title category status priority createdAt supportCount'),
    ]);

    const totalIssues = await Issue.countDocuments();
    const resolvedIssues = await Issue.countDocuments({ status: 'Resolved' });
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
        locationTrends: locationTrends.map((item) => ({ location: item._id, count: item.count })),
        recentIssues,
      },
    });
  } catch (error) {
    next(error);
  }
};
