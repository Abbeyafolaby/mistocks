import express, { json } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import investmentRoutes from './routes/investmentRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config(); // Load environment variables

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS configuration (adjust origin as needed)
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.NODE_ENV === 'production' 
  ? 'https://mistockvista.netlify.app'
  : 'http://localhost:3000';

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

// Middleware
app.use(json()); // Parse JSON bodies
app.use(cookieParser()); // Parse cookies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/profile', profileRoutes);

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => 
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`)
);