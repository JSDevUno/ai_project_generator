import { Router, Request, Response } from 'express';
import { ProjectGenerator } from '../services/projectGenerator.js';

const router = Router();
const projectGenerator = new ProjectGenerator();

// Streaming code generation endpoint
router.post('/generate-stream', async (req: Request, res: Response) => {
    try {
        const { projectName, instruction, plan, model, sessionId } = req.body;

        console.log('[Stream] Request received:', {
            projectName,
            instruction: instruction?.substring(0, 50) + '...',
            plan: plan?.substring(0, 50) + '...',
            model,
            sessionId
        });

        // Validate required fields
        if (!projectName || !instruction || !plan) {
            const error = 'Missing required fields: projectName, instruction, plan';
            console.error('[Stream] Validation error:', error);
            res.write(`data: ${JSON.stringify({ type: 'error', message: error })}\n\n`);
            res.end();
            return;
        }

        // Set up Server-Sent Events
        res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // Progress callback for real-time updates
        const onProgress = (data: any) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        // Generate project with streaming updates
        await projectGenerator.generateProjectStream({
            projectName,
            instruction,
            plan,
            model,
            sessionId
        }, onProgress);

        // Send completion signal
        res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
        res.end();

    } catch (error) {
        console.error('[Stream] Generation error:', error);
        res.write(`data: ${JSON.stringify({ 
            type: 'error', 
            message: error instanceof Error ? error.message : 'Generation failed' 
        })}\n\n`);
        res.end();
    }
});

// Download generated project as ZIP
router.post('/download', async (req: Request, res: Response) => {
    try {
        const { projectName, sessionId } = req.body;

        console.log('[Download] Request received:', { projectName, sessionId });

        if (!projectName || !sessionId) {
            return res.status(400).json({
                error: 'Missing required fields: projectName, sessionId'
            });
        }

        // Check if ZIP is ready
        const zipBuffer = await projectGenerator.getProjectZip(sessionId);

        if (!zipBuffer) {
            return res.status(404).json({
                error: 'Project not ready',
                message: 'Project is still generating or not found. Please wait for generation to complete.'
            });
        }

        console.log('[Download] Sending ZIP file:', `${projectName}.zip`);

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${projectName}.zip"`);
        res.send(zipBuffer);

    } catch (error) {
        console.error('[Download] Error:', error);
        
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ 
                error: 'Project not found',
                message: 'Project is still generating or has expired. Please regenerate the project.'
            });
        } else {
            res.status(500).json({ 
                error: 'Download failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
});

export { router as streamRouter };