import express from 'express';
import {
  getIssues,
  getIssueById,
  createIssue,
  toggleSupport,
  updateIssueStatus,
  addOfficialResponse,
  addInternalNote,
  answerClarification,
  getCampusCareAnalytics,
} from '../controllers/issueController.js';
import { protect, optionalAuth, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

const STAFF_AND_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'UNIVERSITY_ADMIN',
  'FACULTY_OFFICER',
  'HOSTEL_WARDEN',
  'HOSTEL_SUB_WARDEN',
  'MAINTENANCE_OFFICER',
  'LIBRARY_OFFICER',
  'CANTEEN_MANAGER',
  'HEALTH_CENTRE_OFFICER',
  'SECURITY_OFFICER',
  'STUDENT_WELFARE_OFFICER',
  'OTHER_AUTHORIZED_SERVICE_OFFICER',
  'staff',
  'admin',
];

router.get('/analytics', getCampusCareAnalytics);
router.get('/', optionalAuth, getIssues);
router.get('/:id', optionalAuth, getIssueById);
router.post('/', protect, upload.single('image'), createIssue);
router.post('/:id/support', protect, toggleSupport);
router.patch('/:id/status', protect, authorize(...STAFF_AND_ADMIN_ROLES), updateIssueStatus);
router.post('/:id/respond', protect, authorize(...STAFF_AND_ADMIN_ROLES), addOfficialResponse);
router.post('/:id/internal-note', protect, authorize(...STAFF_AND_ADMIN_ROLES), addInternalNote);
router.post('/:id/clarification/answer', protect, answerClarification);

export default router;
