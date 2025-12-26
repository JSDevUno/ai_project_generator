import express from 'express';
import { GitHubSearchService } from '../services/githubSearchService.js';

export const githubRouter = express.Router();
const githubService = new GitHubSearchService();

// Get GitHub API rate limit status
githubRouter.get('/rate-limit', async (req, res) => {
    try {
        const response = await fetch('https://api.github.com/rate_limit', {
            headers: {
                'Authorization': `token ${process.env.GITHUB_API_KEY}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'AI-Project-Generator'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({
                error: 'Failed to fetch rate limit',
                details: `GitHub API returned ${response.status}`
            });
        }

        const data = await response.json();
        
        // Extract search API limits (most relevant for our use case)
        const searchLimits = data.resources.search;
        const coreLimits = data.resources.core;
        
        res.json({
            success: true,
            search: {
                limit: searchLimits.limit,
                remaining: searchLimits.remaining,
                reset: new Date(searchLimits.reset * 1000).toISOString(),
                resetIn: Math.max(0, searchLimits.reset - Math.floor(Date.now() / 1000))
            },
            core: {
                limit: coreLimits.limit,
                remaining: coreLimits.remaining,
                reset: new Date(coreLimits.reset * 1000).toISOString(),
                resetIn: Math.max(0, coreLimits.reset - Math.floor(Date.now() / 1000))
            }
        });
    } catch (error) {
        console.error('GitHub rate limit check error:', error);
        res.status(500).json({
            error: 'Failed to check GitHub rate limits',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});