import express from 'express';
import {
  getAdminStats,
  getStudentSummary,
  getAllUsers,
  verifyStudentAccount,
  provisionStaffAccount,
  updateUserRole,
  getCategories,
  createCategory,
  updateCategory,
  getRoutingRules,
  createRoutingRule,
  updateRoutingRule,
  deleteRoutingRule,
  getKnowledgeDocuments,
  ingestDocument,
  getSystemSettings,
  updateSystemSetting,
  getAuditLogs,
  getAILogs,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

const ADMIN_ROLES = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'admin'];

// Student personal dashboard summary
router.get('/student-summary', protect, getStudentSummary);

// Protected Admin Overview Stats
router.get('/stats', protect, authorize(...ADMIN_ROLES, 'staff', 'FACULTY_OFFICER'), getAdminStats);

// User Directory & Verifications
router.get('/users', protect, authorize(...ADMIN_ROLES), getAllUsers);
router.patch('/users/:id/verification', protect, authorize(...ADMIN_ROLES), verifyStudentAccount);
router.post('/users/provision-staff', protect, authorize(...ADMIN_ROLES), provisionStaffAccount);
router.patch('/users/:id/role', protect, authorize(...ADMIN_ROLES), updateUserRole);

// Category Management
router.get('/categories', protect, authorize(...ADMIN_ROLES), getCategories);
router.post('/categories', protect, authorize(...ADMIN_ROLES), createCategory);
router.patch('/categories/:id', protect, authorize(...ADMIN_ROLES), updateCategory);

// Routing Rules
router.get('/routing-rules', protect, authorize(...ADMIN_ROLES), getRoutingRules);
router.post('/routing-rules', protect, authorize(...ADMIN_ROLES), createRoutingRule);
router.patch('/routing-rules/:id', protect, authorize(...ADMIN_ROLES), updateRoutingRule);
router.delete('/routing-rules/:id', protect, authorize(...ADMIN_ROLES), deleteRoutingRule);

// Knowledge Base (RAG)
router.get('/knowledge-docs', protect, authorize(...ADMIN_ROLES), getKnowledgeDocuments);
router.post('/knowledge-docs/ingest', protect, authorize(...ADMIN_ROLES), ingestDocument);

// System Settings / AI Configuration
router.get('/settings', protect, authorize(...ADMIN_ROLES), getSystemSettings);
router.post('/settings', protect, authorize(...ADMIN_ROLES), updateSystemSetting);

// Audit & AI Logs
router.get('/audit-logs', protect, authorize(...ADMIN_ROLES), getAuditLogs);
router.get('/ai-logs', protect, authorize(...ADMIN_ROLES), getAILogs);

export default router;
