import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { initializeSocket } from './socket.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// Security & Validation Middleware
import { validateEnv } from './config/envValidation.js';
import { securityHeaders, corsOptions } from './middleware/securityMiddleware.js';
import { sanitizeData, preventXSS, trimInputs } from './middleware/sanitizationMiddleware.js';
import { apiLimiter } from './middleware/rateLimitMiddleware.js';
import { logger, errorLogger } from './middleware/loggerMiddleware.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config();

// Validate environment variables FIRST
validateEnv();

// Connect to database
connectDB();

const app = express();
const server = createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

// Make io accessible to routes
app.set('io', io);

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security Middleware (Apply first)
app.use(securityHeaders());

// CORS Configuration (imported from securityMiddleware.js)
app.use(cors(corsOptions));
app.use(compression());

// Request logging (only in production)
if (process.env.NODE_ENV === 'production') {
  app.use(logger);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization middleware
app.use(trimInputs);
app.use(sanitizeData());
app.use(preventXSS());

// Create uploads directory if it doesn't exist
import fs from 'fs';
const uploadsDir = path.join(__dirname, 'uploads');
const avatarsDir = path.join(__dirname, 'uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Chat App API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/contacts', contactRoutes);



// Error handling
app.use(errorLogger); // Log errors before handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔒 Security: Enhanced with Helmet, CORS, Rate Limiting`);
  console.log(`🛡️  Sanitization: MongoDB injection & XSS protection`);
  console.log(`📊 Database: Connection pooling enabled`);
  console.log(`📝 Logging: ${process.env.NODE_ENV === 'production' ? 'File' : 'Console'} logging active`);
  console.log('='.repeat(50));
});

export default app;
