import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import metadataRoutes from './routes/metadataRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import opportunityRoutes from './routes/opportunityRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env if present, otherwise root .env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();

// Trust reverse proxy (Vercel, AWS Lambda, Cloudflare)
app.set('trust proxy', 1);

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// Dynamic CORS setup allowing all Vercel deployments and localhost
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://unicon-eight.vercel.app',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in production to ensure client connectivity
      }
    },
    credentials: true,
  })
);

// Health Check API (Always accessible, reports DB and Vercel state)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'UniConnect SmartResolve - South Eastern University of Sri Lanka (SEUSL)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    isVercel: !!process.env.VERCEL,
    hasMongoUri: !!process.env.MONGODB_URI,
  });
});

// Request body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Development request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting with disabled trust proxy validation error for Vercel
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  validate: { xForwardedForHeader: false, trustProxy: false },
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', limiter);

// Serve static uploads
const uploadsDir = process.env.VERCEL ? path.join(os.tmpdir(), 'uploads') : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Database connection middleware: ensures MongoDB is connected before handling any data routes
app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[DB Middleware Error]', err.message);
    return res.status(503).json({
      success: false,
      message: 'Database connection failed. Please ensure MONGODB_URI is correctly configured on Vercel.',
      error: err.message,
    });
  }
});

// Mount Core Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/complaints', issueRoutes); // Dual alias for issues & complaints
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/metadata', metadataRoutes);

// Additional Campus Modules
app.use('/api/announcements', announcementRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[UniConnect SmartResolve API] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;
