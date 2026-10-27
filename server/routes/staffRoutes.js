import express from 'express';
import {
  getStaffComplaints,
  acknowledgeComplaint,
  requestClarification,
  reassignComplaint,
  escalateComplaint,
} from '../controllers/staffController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

const STAFF_ROLES = [
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

router.use(protect);
router.use(authorize(...STAFF_ROLES));

router.get('/complaints', getStaffComplaints);
router.post('/complaints/:id/acknowledge', acknowledgeComplaint);
router.post('/complaints/:id/clarification', requestClarification);
router.post('/complaints/:id/reassign', reassignComplaint);
router.post('/complaints/:id/escalate', escalateComplaint);

export default router;
