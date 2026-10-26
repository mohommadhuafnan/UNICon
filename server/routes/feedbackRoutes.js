import express from 'express';
import {
  getFeedbacks,
  createFeedback,
  toggleFeedbackSupport,
  updateFeedbackStatus,
} from '../controllers/feedbackController.js';
import { protect, optionalAuth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, getFeedbacks);
router.post('/', protect, createFeedback);
router.post('/:id/support', protect, toggleFeedbackSupport);
router.patch('/:id/status', protect, authorize('staff', 'admin'), updateFeedbackStatus);

export default router;
