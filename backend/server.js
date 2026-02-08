import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Routes
import blogRoutes from './routes/blog.js';
import testimonialRoutes from './routes/testimonials.js';
import contactRoutes from './routes/contact.js';

// Middleware
import { errorHandler } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/blog', blogRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/contact', contactRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Portfolio API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
