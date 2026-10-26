import Event from '../models/Event.js';

// @desc    Get all campus events (upcoming/past, categories)
// @route   GET /api/events
// @access  Public / Optional Auth
export const getEvents = async (req, res, next) => {
  try {
    const { category, timeline = 'all', search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    const now = new Date();
    if (timeline === 'upcoming') {
      query.startDate = { $gte: now };
    } else if (timeline === 'past') {
      query.startDate = { $lt: now };
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { organizer: searchRegex },
        { venue: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [events, total] = await Promise.all([
      Event.find(query)
        .sort({ startDate: timeline === 'past' ? -1 : 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Event.countDocuments(query),
    ]);

    const enriched = events.map((ev) => {
      const isSaved = req.user && ev.savedBy
        ? ev.savedBy.some((uid) => uid.toString() === req.user.id)
        : false;
      const isPast = new Date(ev.startDate) < now;
      return {
        ...ev,
        isSaved,
        isPast,
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

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Public / Optional Auth
export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const isSaved = req.user && event.savedBy
      ? event.savedBy.some((uid) => uid.toString() === req.user.id)
      : false;

    res.json({
      success: true,
      data: {
        ...event.toObject(),
        isSaved,
        isPast: new Date(event.startDate) < new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create event
// @route   POST /api/events
// @access  Private (Organizer, Staff, Admin)
export const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      organizer,
      venue,
      startDate,
      endDate,
      registrationDeadline,
      registrationUrl,
      imageUrl,
    } = req.body;

    if (!title || !description || !organizer || !venue || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, organizer, venue, and start date.',
      });
    }

    const event = await Event.create({
      title,
      description,
      category: category || 'Workshop',
      organizer,
      venue,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      registrationUrl: registrationUrl || '',
      imageUrl: imageUrl || '',
      status: 'Upcoming',
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Campus event published successfully.',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle save event
// @route   POST /api/events/:id/save
// @access  Private
export const toggleSaveEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const index = event.savedBy.indexOf(req.user.id);
    let isSaved = false;

    if (index === -1) {
      event.savedBy.push(req.user.id);
      event.attendeeCount = (event.attendeeCount || 0) + 1;
      isSaved = true;
    } else {
      event.savedBy.splice(index, 1);
      event.attendeeCount = Math.max(0, (event.attendeeCount || 1) - 1);
      isSaved = false;
    }

    await event.save();

    res.json({
      success: true,
      isSaved,
      message: isSaved ? 'Event added to your calendar/saved list' : 'Event removed from saved list',
    });
  } catch (error) {
    next(error);
  }
};
