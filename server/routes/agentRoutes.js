import express from 'express';
import {
  askUniversityKnowledge,
  agentChat,
  runAgentTool,
} from '../controllers/agentController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/rag/ask', optionalAuth, askUniversityKnowledge);
router.post('/chat', protect, agentChat);
router.post('/tool', protect, runAgentTool);

export default router;
