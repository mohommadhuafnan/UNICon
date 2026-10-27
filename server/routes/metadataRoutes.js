import express from 'express';
import { getUniversityMetadata } from '../controllers/metadataController.js';

const router = express.Router();

router.get('/organization', getUniversityMetadata);

export default router;
