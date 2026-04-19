/**
 * server.js — MoodTune Backend Entry Point
 * Sets up Express app with CORS, JSON parsing, and API routes.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import emotionRoutes from './routes/emotionRoutes.js';
import musicRoutes from './routes/musicRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ──────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5175',
    'http://localhost:3000',
  ],
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ──────────────────────────────────────────
// Routes
// ──────────────────────────────────────────
app.use('/api/emotion', emotionRoutes);
app.use('/api/music', musicRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MoodTune backend is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ──────────────────────────────────────────
// Start server
// ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ MoodTune backend running on http://localhost:${PORT}`);
});
