import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables FIRST
dotenv.config();

import { planRouter } from './routes/plan.js';
import { codeRouter } from './routes/code.js';
import { streamRouter } from './routes/stream.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Enhanced CORS for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ai-project-generator.vercel.app', 'https://your-custom-domain.com'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/plan', planRouter);
app.use('/api/code', codeRouter);
app.use('/api/stream', streamRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    apiKey: process.env.OPENROUTER_API_KEY ? 'Configured' : 'Missing'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  // Handle client-side routing
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API route not found' });
    }
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// For Vercel serverless functions
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 [Server] AI Project Generator running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 OpenRouter API Key: ${process.env.OPENROUTER_API_KEY ? 'Configured ✅' : 'Missing ❌'}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  });
}