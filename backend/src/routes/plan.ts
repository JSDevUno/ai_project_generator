import express from 'express';
import { PlanGenerator, type EnhancedPlan } from '../services/planGenerator.js';

export const planRouter = express.Router();
const planGenerator = new PlanGenerator();

planRouter.post('/generate', async (req, res) => {
    try {
        const { projectName, instruction, model, enableGitHubSearch } = req.body;

        if (!projectName || !instruction) {
            return res.status(400).json({
                error: 'Missing required fields: projectName, instruction'
            });
        }

        const plan: EnhancedPlan = await planGenerator.generatePlan(
            projectName, 
            instruction, 
            model, 
            enableGitHubSearch
        );

        res.json({
            success: true,
            plan: plan.content,
            projectName: plan.projectName,
            instruction: plan.instruction,
            repositories: plan.repositories?.map(repo => ({
                name: repo.repository.name,
                fullName: repo.repository.fullName,
                description: repo.repository.description,
                url: repo.repository.url,
                stars: repo.repository.stars,
                forks: repo.repository.forks,
                language: repo.repository.language,
                topics: repo.repository.topics,
                keyFeatures: repo.keyFeatures,
                architecture: repo.architecture,
                techStack: repo.techStack,
                relevanceScore: repo.relevanceScore,
                rank: repo.rank,
                reasoning: repo.reasoning
            })) || [],
            searchEnabled: plan.searchEnabled,
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
        const { projectName, instruction, feedback, model, enableGitHubSearch } = req.body;

        const improvedPlan: EnhancedPlan = await planGenerator.rethinkPlan(
            projectName,
            instruction,
            feedback,
            model,
            enableGitHubSearch
        );

        res.json({
            success: true,
            plan: improvedPlan.content,
            projectName: improvedPlan.projectName,
            instruction: improvedPlan.instruction,
            repositories: improvedPlan.repositories?.map(repo => ({
                name: repo.repository.name,
                fullName: repo.repository.fullName,
                description: repo.repository.description,
                url: repo.repository.url,
                stars: repo.repository.stars,
                forks: repo.repository.forks,
                language: repo.repository.language,
                topics: repo.repository.topics,
                keyFeatures: repo.keyFeatures,
                architecture: repo.architecture,
                techStack: repo.techStack,
                relevanceScore: repo.relevanceScore,
                rank: repo.rank,
                reasoning: repo.reasoning
            })) || [],
            searchEnabled: improvedPlan.searchEnabled,
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