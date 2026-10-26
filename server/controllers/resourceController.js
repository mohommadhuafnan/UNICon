import Resource from '../models/Resource.js';

// @desc    Get study materials with faculty, semester & type filters
// @route   GET /api/resources
// @access  Public / Optional Auth
export const getResources = async (req, res, next) => {
  try {
    const { faculty, semester, resourceType, search, page = 1, limit = 12 } = req.query;
    const query = { moderationStatus: { $ne: 'Flagged' } };

    if (faculty && faculty !== 'All') {
      query.faculty = faculty;
    }
    if (semester && semester !== 'All') {
      query.semester = semester;
    }
    if (resourceType && resourceType !== 'All') {
      query.resourceType = resourceType;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { subject: searchRegex },
        { tags: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const [resources, total] = await Promise.all([
      Resource.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Resource.countDocuments(query),
    ]);

    const enriched = resources.map((resItem) => {
      const isSaved = req.user && resItem.savedBy
        ? resItem.savedBy.some((uid) => uid.toString() === req.user.id)
        : false;
      return {
        ...resItem,
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

// @desc    Add educational resource
// @route   POST /api/resources
// @access  Private (Authenticated users)
export const createResource = async (req, res, next) => {
  try {
    const {
      title,
      description,
      subject,
      faculty,
      department,
      semester,
      resourceType,
      sourceUrl,
      tags,
    } = req.body;

    if (!title || !description || !subject || !sourceUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, subject code/name, and resource URL.',
      });
    }

    const resource = await Resource.create({
      title,
      description,
      subject,
      faculty: faculty || req.user.faculty || 'Faculty of Computing',
      department: department || req.user.department || 'Computer Science',
      semester: semester || 'Year 1 Sem 1',
      resourceType: resourceType || 'Lecture Notes',
      sourceUrl,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t) => t.trim()) : []),
      contributor: req.user.id,
      contributorName: req.user.name,
      moderationStatus: 'Approved',
    });

    res.status(201).json({
      success: true,
      message: 'Learning resource uploaded successfully.',
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle bookmark resource
// @route   POST /api/resources/:id/save
// @access  Private
export const toggleSaveResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    const index = resource.savedBy.indexOf(req.user.id);
    let isSaved = false;

    if (index === -1) {
      resource.savedBy.push(req.user.id);
      resource.bookmarksCount = (resource.bookmarksCount || 0) + 1;
      isSaved = true;
    } else {
      resource.savedBy.splice(index, 1);
      resource.bookmarksCount = Math.max(0, (resource.bookmarksCount || 1) - 1);
      isSaved = false;
    }

    await resource.save();

    res.json({
      success: true,
      isSaved,
      message: isSaved ? 'Resource bookmarked' : 'Resource removed from bookmarks',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Report/Flag resource (e.g. broken link or unauthorized material)
// @route   POST /api/resources/:id/flag
// @access  Private
export const flagResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    resource.reportCount = (resource.reportCount || 0) + 1;
    if (resource.reportCount >= 3) {
      resource.moderationStatus = 'Pending';
    }
    await resource.save();

    res.json({
      success: true,
      message: 'Resource report submitted. Our team will review the link.',
    });
  } catch (error) {
    next(error);
  }
};
