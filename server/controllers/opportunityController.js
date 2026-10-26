import Opportunity from '../models/Opportunity.js';

// @desc    Get all opportunities with filters (category, active/expired, search)
// @route   GET /api/opportunities
// @access  Public / Optional Auth
export const getOpportunities = async (req, res, next) => {
  try {
    const { category, status = 'Active', search, locationType, page = 1, limit = 10 } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (status && status !== 'All') {
      if (status === 'Active') {
        // Active: deadline >= now or status === Active
        query.deadline = { $gte: new Date() };
        query.status = 'Active';
      } else if (status === 'Expired') {
        query.$or = [{ status: 'Expired' }, { deadline: { $lt: new Date() } }];
      }
    }

    if (locationType && locationType !== 'All') {
      query.locationType = locationType;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { organizer: searchRegex },
        { skills: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [opportunities, total] = await Promise.all([
      Opportunity.find(query)
        .sort({ deadline: 1 }) // Closest deadlines first
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Opportunity.countDocuments(query),
    ]);

    const enriched = opportunities.map((opp) => {
      const isSaved = req.user && opp.savedBy
        ? opp.savedBy.some((uid) => uid.toString() === req.user.id)
        : false;
      const isExpired = new Date(opp.deadline) < new Date();
      return {
        ...opp,
        isSaved,
        isExpired,
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

// @desc    Get opportunity by ID
// @route   GET /api/opportunities/:id
// @access  Public / Optional Auth
export const getOpportunityById = async (req, res, next) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) {
      return res.status(404).json({ success: false, message: 'Opportunity not found.' });
    }

    const isSaved = req.user && opp.savedBy
      ? opp.savedBy.some((uid) => uid.toString() === req.user.id)
      : false;

    res.json({
      success: true,
      data: {
        ...opp.toObject(),
        isSaved,
        isExpired: new Date(opp.deadline) < new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create opportunity
// @route   POST /api/opportunities
// @access  Private (Organizer, Staff, Admin)
export const createOpportunity = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      organizer,
      eligibility,
      skills,
      locationType,
      deadline,
      eventDate,
      registrationUrl,
      sourceUrl,
    } = req.body;

    if (!title || !description || !organizer || !deadline || !registrationUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields (title, description, organizer, deadline, registrationUrl).',
      });
    }

    const opportunity = await Opportunity.create({
      title,
      description,
      category: category || 'Hackathon',
      organizer,
      eligibility: eligibility || 'All university undergraduates',
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map((s) => s.trim()) : []),
      locationType: locationType || 'Remote',
      deadline: new Date(deadline),
      eventDate: eventDate ? new Date(eventDate) : null,
      registrationUrl,
      sourceUrl: sourceUrl || '',
      verificationStatus: ['staff', 'admin'].includes(req.user.role) ? 'Verified' : 'Community',
      status: 'Active',
      postedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Opportunity posted successfully.',
      data: opportunity,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle save opportunity
// @route   POST /api/opportunities/:id/save
// @access  Private
export const toggleSaveOpportunity = async (req, res, next) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) {
      return res.status(404).json({ success: false, message: 'Opportunity not found.' });
    }

    const index = opp.savedBy.indexOf(req.user.id);
    let isSaved = false;

    if (index === -1) {
      opp.savedBy.push(req.user.id);
      isSaved = true;
    } else {
      opp.savedBy.splice(index, 1);
      isSaved = false;
    }

    await opp.save();

    res.json({
      success: true,
      isSaved,
      message: isSaved ? 'Opportunity saved to your hub' : 'Opportunity removed from saved list',
    });
  } catch (error) {
    next(error);
  }
};
