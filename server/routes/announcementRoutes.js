import express from 'express';
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  toggleSaveAnnouncement,
} from '../controllers/announcementController.js';
import { protect, optionalAuth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, getAnnouncements);
router.get('/:id', getAnnouncementById);
router.post('/', protect, authorize('staff', 'admin', 'organizer'), createAnnouncement);
router.post('/:id/save', protect, toggleSaveAnnouncement);

export default router;
