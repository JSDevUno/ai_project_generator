import express from 'express';
import { NotebookPlanGenerator } from '../services/notebookPlanGenerator.js';
import { NotebookGenerator } from '../services/notebookGenerator.js';

export const notebookRouter = express.Router();
const planGenerator = new NotebookPlanGenerator();
const notebookGenerator = new NotebookGenerator();

// Generate notebook plan (Phase 1)
notebookRouter.post('/plan', async (req, res) => {
    try {
        const { instruction, model } = req.body;

        if (!instruction) {
            return res.status(400).json({
                error: 'Missing required field: instruction'
            });
        }

        console.log('[Notebook] Generating plan with model:', model);

        const plan = await planGenerator.generatePlan(
            instruction,
            model || 'kwaipilot/kat-coder-pro:free'
        );

        res.json({
            success: true,
            plan
        });
    } catch (error) {
        console.error('[Notebook] Plan generation error:', error);
        res.status(500).json({
            error: 'Failed to generate notebook plan',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Revise notebook plan
notebookRouter.post('/revise', async (req, res) => {
    try {
        const { plan, feedback, model } = req.body;

        if (!plan || !feedback) {
            return res.status(400).json({
                error: 'Missing required fields: plan, feedback'
            });
        }

        console.log('[Notebook] Revising plan with feedback');

        const revisedPlan = await planGenerator.revisePlan(
            plan,
            feedback,
            model || 'kwaipilot/kat-coder-pro:free'
        );

        res.json({
            success: true,
            plan: revisedPlan
        });
    } catch (error) {
        console.error('[Notebook] Plan revision error:', error);
        res.status(500).json({
            error: 'Failed to revise notebook plan',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Generate notebook JSON (Phase 2)
notebookRouter.post('/generate', async (req, res) => {
    try {
        const { plan, model } = req.body;

        if (!plan) {
            return res.status(400).json({
                error: 'Missing required field: plan'
            });
        }

        console.log('[Notebook] Generating notebook JSON');

        const notebook = await notebookGenerator.generateNotebook(
            plan,
            model || 'kwaipilot/kat-coder-pro:free'
        );

        res.json({
            success: true,
            notebook
        });
    } catch (error) {
        console.error('[Notebook] Generation error:', error);
        res.status(500).json({
            error: 'Failed to generate notebook',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
