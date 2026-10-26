import express from 'express';
import {
  getResources,
  createResource,
  toggleSaveResource,
  flagResource,
} from '../controllers/resourceController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, getResources);
router.post('/', protect, createResource);
router.post('/:id/save', protect, toggleSaveResource);
router.post('/:id/flag', protect, flagResource);

export default router;
