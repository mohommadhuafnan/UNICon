import express from 'express';
import {
  getIssues,
  getIssueById,
  createIssue,
  toggleSupport,
  updateIssueStatus,
  addOfficialResponse,
  getCampusCareAnalytics,
} from '../controllers/issueController.js';
import { protect, optionalAuth, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/analytics', getCampusCareAnalytics);
router.get('/', optionalAuth, getIssues);
router.get('/:id', optionalAuth, getIssueById);
router.post('/', protect, upload.single('image'), createIssue);
router.post('/:id/support', protect, toggleSupport);
router.patch('/:id/status', protect, authorize('staff', 'admin'), updateIssueStatus);
router.post('/:id/respond', protect, authorize('staff', 'admin'), addOfficialResponse);

export default router;
