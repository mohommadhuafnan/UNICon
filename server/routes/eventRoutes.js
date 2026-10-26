import express from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  toggleSaveEvent,
} from '../controllers/eventController.js';
import { protect, optionalAuth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, getEvents);
router.get('/:id', optionalAuth, getEventById);
router.post('/', protect, authorize('organizer', 'staff', 'admin'), createEvent);
router.post('/:id/save', protect, toggleSaveEvent);

export default router;
