import Feedback from '../models/Feedback.js';
import Notification from '../models/Notification.js';

// @desc    Get student voice suggestions
// @route   GET /api/feedback
// @access  Public / Optional Auth
export const getFeedbacks = async (req, res, next) => {
  try {
    const { category, status, search, sort = 'most_supported', page = 1, limit = 10 } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }
    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { description: searchRegex }, { campusLocation: searchRegex }];
    }

    let sortOptions = { supportCount: -1, createdAt: -1 };
    if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [feedbacks, total] = await Promise.all([
      Feedback.find(query)
        .populate('author', 'name role avatar')
        .populate('administrativeResponse.respondedBy', 'name role')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Feedback.countDocuments(query),
    ]);

    const enriched = feedbacks.map((fb) => {
      let authorInfo = fb.author;
      if (fb.isAnonymous && (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff'))) {
        authorInfo = { name: 'Anonymous Student', role: 'student' };
      }

      const hasSupported = req.user && fb.supportedUsers
        ? fb.supportedUsers.some((uid) => uid.toString() === req.user.id)
        : false;

      return {
        ...fb,
        author: authorInfo,
        hasSupported,
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit student voice suggestion
// @route   POST /api/feedback
// @access  Private (Authenticated users)
export const createFeedback = async (req, res, next) => {
  try {
    const { title, description, category, campusLocation, isAnonymous } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide suggestion title, detailed description, and category.',
      });
    }

    const feedback = await Feedback.create({
      title,
      description,
      category,
      campusLocation: campusLocation || 'Main Campus',
      isAnonymous: Boolean(isAnonymous),
      author: req.user.id,
      status: 'Submitted',
      supportCount: 1, // Author automatically supports their own suggestion
      supportedUsers: [req.user.id],
    });

    res.status(201).json({
      success: true,
      message: 'Suggestion submitted successfully to StudentVoice.',
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle upvote / support for suggestion
// @route   POST /api/feedback/:id/support
// @access  Private
export const toggleFeedbackSupport = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Suggestion not found.' });
    }

    const index = feedback.supportedUsers.indexOf(req.user.id);
    let hasSupported = false;

    if (index === -1) {
      feedback.supportedUsers.push(req.user.id);
      feedback.supportCount += 1;
      hasSupported = true;
    } else {
      feedback.supportedUsers.splice(index, 1);
      feedback.supportCount = Math.max(0, feedback.supportCount - 1);
      hasSupported = false;
    }

    await feedback.save();

    res.json({
      success: true,
      hasSupported,
      supportCount: feedback.supportCount,
      message: hasSupported ? 'Upvoted suggestion!' : 'Upvote removed',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update feedback status and administrative response
// @route   PATCH /api/feedback/:id/status
// @access  Private (Staff, Admin)
export const updateFeedbackStatus = async (req, res, next) => {
  try {
    const { status, responseText } = req.body;
    const validStatuses = ['Submitted', 'Under Review', 'Accepted', 'Implemented', 'Declined'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Suggestion not found.' });
    }

    feedback.status = status;

    if (responseText && responseText.trim() !== '') {
      feedback.administrativeResponse = {
        respondedBy: req.user.id,
        responderName: `${req.user.name} (${req.user.role.toUpperCase()})`,
        responseText: responseText.trim(),
        respondedAt: new Date(),
      };
    }

    await feedback.save();

    // Notify original author
    await Notification.create({
      recipient: feedback.author,
      type: 'feedback_update',
      title: `StudentVoice Update: ${status}`,
      message: `Your suggestion "${feedback.title}" is now marked as "${status}".${responseText ? ` Staff remark: "${responseText}"` : ''}`,
      link: '/studentvoice',
    });

    res.json({
      success: true,
      message: `Suggestion status updated to ${status}.`,
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};
