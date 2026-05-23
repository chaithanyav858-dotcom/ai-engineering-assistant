import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173', // Local Vite dev server
  'http://localhost:3000', // Local Express port
  process.env.FRONTEND_URL  // Production Vercel URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, postman, curl)
    if (!origin) return callback(null, true);
    
    // In development mode, allow all origins for easy testing
    if (process.env.NODE_ENV === 'development' || allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    return callback(new Error('CORS Policy: Access denied from this origin.'), false);
  },
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/chat', chatRouter);

// Health Check Endpoint (useful for keeping Render awake and checking deploy status)
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Default catch-all for API base
app.get('/', (req, res) => {
  res.send('AI Study Buddy API Backend is running. Access health at /health.');
});

// Start server
app.listen(PORT, () => {
  console.log(`[SERVER] AI Study Buddy backend running on port ${PORT}`);
  console.log(`[SERVER] Allowed Origins:`, allowedOrigins);
});
