import express from 'express';
import { PlanGenerator } from '../services/planGenerator.js';

export const planRouter = express.Router();
const planGenerator = new PlanGenerator();

planRouter.post('/generate', async (req, res) => {
    try {
        const { projectName, instruction, model } = req.body;

        if (!projectName || !instruction) {
            return res.status(400).json({
                error: 'Missing required fields: projectName, instruction'
            });
        }

        const plan = await planGenerator.generatePlan(projectName, instruction, model);

        res.json({
            success: true,
            plan,
            projectName,
            instruction,
            model: model || 'kwaipilot/kat-coder-pro:free'
        });
    } catch (error) {
        console.error('Plan generation error:', error);
        res.status(500).json({
            error: 'Failed to generate plan',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

planRouter.post('/rethink', async (req, res) => {
    try {
        const { projectName, instruction, feedback, model } = req.body;

        const improvedPlan = await planGenerator.rethinkPlan(
            projectName,
            instruction,
            feedback,
            model
        );

        res.json({
            success: true,
            plan: improvedPlan,
            projectName,
            instruction,
            model: model || 'kwaipilot/kat-coder-pro:free'
        });
    } catch (error) {
        console.error('Plan rethink error:', error);
        res.status(500).json({
            error: 'Failed to rethink plan',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});