import express from 'express';
import {
  askUniversityKnowledge,
  agentChat,
  runAgentTool,
} from '../controllers/agentController.js';
import { sendReportMessage, getReportSession } from '../controllers/agentReportController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Turn multer failures (size / type / count) into clean 400 responses
const uploadImages = (req, res, next) =>
  upload.array('images', 5)(req, res, (err) => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Each image must be smaller than 5MB.' : err.code === 'LIMIT_UNEXPECTED_FILE' ? 'You can attach at most 5 images per message.' : err.message;
    res.status(400).json({ success: false, message });
  });

router.post('/rag/ask', optionalAuth, askUniversityKnowledge);
router.post('/chat', protect, agentChat);
router.post('/tool', protect, runAgentTool);
router.post('/report/message', protect, uploadImages, sendReportMessage);
router.get('/report/session/:id', protect, getReportSession);

export default router;
