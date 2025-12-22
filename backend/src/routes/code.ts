import express from 'express';
import { ProjectGenerator } from '../services/projectGenerator.js';

export const codeRouter = express.Router();
const projectGenerator = new ProjectGenerator();

// Store active SSE connections
const progressClients = new Map<string, express.Response>();

// SSE endpoint for real-time progress updates
codeRouter.get('/generate/progress/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Store this client connection
  progressClients.set(sessionId, res);
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Progress stream connected' })}\n\n`);
  
  // Clean up on client disconnect
  req.on('close', () => {
    progressClients.delete(sessionId);
  });
});

// Helper function to send progress updates
export function sendProgress(sessionId: string, data: any) {
  const client = progressClients.get(sessionId);
  if (client) {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

// Main generation endpoint
codeRouter.post('/generate', async (req, res) => {
  try {
    const { projectName, instruction, plan, model, sessionId } = req.body;
    
    if (!projectName || !instruction || !plan) {
      return res.status(400).json({ 
        error: 'Missing required fields: projectName, instruction, plan' 
      });
    }

    // Generate project with progress callback
    const zipBuffer = await projectGenerator.generateProject(
      projectName, 
      instruction, 
      plan,
      model,
      sessionId ? (progress) => sendProgress(sessionId, progress) : undefined
    );
    
    // Send completion event
    if (sessionId) {
      sendProgress(sessionId, { type: 'complete', message: 'Project generation complete' });
      // Close SSE connection after a short delay
      setTimeout(() => {
        const client = progressClients.get(sessionId);
        if (client) {
          client.end();
          progressClients.delete(sessionId);
        }
      }, 1000);
    }
    
    // Set headers for ZIP file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${projectName}_project.zip"`);
    res.setHeader('Content-Length', zipBuffer.length);
    
    res.send(zipBuffer);
  } catch (error) {
    console.error('Project generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate project',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});