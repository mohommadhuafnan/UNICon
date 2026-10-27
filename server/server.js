import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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

// Request body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Development request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', limiter);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check API (Always succeeds, reports DB state)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'UniConnect SmartResolve - South Eastern University of Sri Lanka (SEUSL)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'connecting_or_disconnected',
    isVercel: !!process.env.VERCEL,
  });
});

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

app.listen(PORT, () => {
  console.log(`[UniConnect SmartResolve API] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export default app;
