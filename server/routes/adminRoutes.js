import express from 'express';
import {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  getStudentSummary,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/student-summary', protect, getStudentSummary);
router.get('/stats', protect, authorize('staff', 'admin'), getAdminStats);
router.get('/users', protect, authorize('admin'), getAllUsers);
router.patch('/users/:id/role', protect, authorize('admin'), updateUserRole);

export default router;
