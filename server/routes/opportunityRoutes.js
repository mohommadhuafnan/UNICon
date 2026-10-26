import express from 'express';
import {
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  toggleSaveOpportunity,
} from '../controllers/opportunityController.js';
import { protect, optionalAuth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, getOpportunities);
router.get('/:id', optionalAuth, getOpportunityById);
router.post('/', protect, authorize('organizer', 'staff', 'admin'), createOpportunity);
router.post('/:id/save', protect, toggleSaveOpportunity);

export default router;
