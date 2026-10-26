import Announcement from '../models/Announcement.js';

// @desc    Get all announcements with search & category filter
// @route   GET /api/announcements
// @access  Public / Optional Auth
export const getAnnouncements = async (req, res, next) => {
  try {
    const { search, category, verifiedOnly, page = 1, limit = 10 } = req.query;
    const query = { isPublished: true };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (verifiedOnly === 'true') {
      query.isVerified = true;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { description: searchRegex }, { sourceDepartment: searchRegex }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .sort({ priority: -1, publishedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Announcement.countDocuments(query),
    ]);

    // Check saved state if authenticated
    const enriched = announcements.map((ann) => {
      const isSaved = req.user && ann.savedBy
        ? ann.savedBy.some((uid) => uid.toString() === req.user.id)
        : false;
      return {
        ...ann,
        isSaved,
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

// @desc    Get announcement by ID
// @route   GET /api/announcements/:id
// @access  Public
export const getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }
    res.json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
};

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private (Staff, Admin, Organizer)
export const createAnnouncement = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      sourceDepartment,
      targetAudience,
      sourceUrl,
      attachmentUrl,
      expiresAt,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both title and description.',
      });
    }

    // Official verification granted to staff/admin
    const isVerified = ['staff', 'admin'].includes(req.user.role);

    const announcement = await Announcement.create({
      title,
      description,
      category: category || 'General Notices',
      priority: priority || 'Normal',
      publisher: req.user.id,
      publisherName: req.user.name,
      publisherRole: req.user.role === 'admin' ? 'University Administrator' : 'Department Representative',
      sourceDepartment: sourceDepartment || req.user.department || 'Campus Affairs',
      targetAudience: targetAudience || 'All Students & Staff',
      sourceUrl: sourceUrl || '',
      attachmentUrl: attachmentUrl || '',
      expiresAt: expiresAt || null,
      isVerified,
      isPublished: true,
    });

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully.',
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle save / bookmark announcement
// @route   POST /api/announcements/:id/save
// @access  Private
export const toggleSaveAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    const index = announcement.savedBy.indexOf(req.user.id);
    let isSaved = false;

    if (index === -1) {
      announcement.savedBy.push(req.user.id);
      isSaved = true;
    } else {
      announcement.savedBy.splice(index, 1);
      isSaved = false;
    }

    await announcement.save();

    res.json({
      success: true,
      isSaved,
      message: isSaved ? 'Announcement bookmarked' : 'Announcement removed from bookmarks',
    });
  } catch (error) {
    next(error);
  }
};
