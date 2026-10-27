import Faculty from '../models/Faculty.js';
import Hostel from '../models/Hostel.js';
import ServiceUnit from '../models/ServiceUnit.js';
import ComplaintCategory from '../models/ComplaintCategory.js';

// @desc    Get dynamic university organizational structure (Faculties, Hostels, Service Units, Categories)
// @route   GET /api/metadata/organization
// @access  Public / Authenticated
export const getUniversityMetadata = async (req, res, next) => {
  try {
    const [faculties, hostels, serviceUnits, categories] = await Promise.all([
      Faculty.find({ isActive: true }).select('name code campus departments buildings').lean(),
      Hostel.find({ isActive: true }).select('name gender campus blocks').lean(),
      ServiceUnit.find({ isActive: true }).select('name code description defaultStaffRole').lean(),
      ComplaintCategory.find({ isActive: true }).sort({ displayOrder: 1 }).lean(),
    ]);

    res.json({
      success: true,
      data: {
        universityName: 'South Eastern University of Sri Lanka (SEUSL)',
        faculties,
        hostels,
        serviceUnits,
        categories,
      },
    });
  } catch (error) {
    next(error);
  }
};
