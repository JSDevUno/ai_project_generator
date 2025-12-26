import dotenv from 'dotenv';

dotenv.config();

export interface Repository {
    name: string;
    fullName: string;
    description: string;
    url: string;
    stars: number;
    forks: number;
    language: string;
    topics: string[];
    updatedAt: string;
}

export interface RepositoryAnalysis {
    repository: Repository;
    keyFeatures: string[];
    architecture: string;
    techStack: string[];
    relevanceScore: number;
    codeQuality: number;
}

export interface RankedRepository extends RepositoryAnalysis {
    rank: number;
    reasoning: string;
}

export class GitHubSearchService {
    private apiKey: string;
    private baseUrl = 'https://api.github.com';
    private lastRequestTime = 0;
    private minRequestInterval = 1000; // 1 second between requests

    constructor() {
        this.apiKey = process.env.GITHUB_API_KEY || '';
        console.log('[GitHubSearchService] API Key loaded:', this.apiKey ? 'YES' : 'NO');
    }

    private async rateLimitDelay(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
            const delay = this.minRequestInterval - timeSinceLastRequest;
            console.log(`[GitHubSearchService] Rate limiting: waiting ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        this.lastRequestTime = Date.now();
    }

    async searchRepositories(query: string, language: string = 'python'): Promise<Repository[]> {
        // Apply rate limiting
        await this.rateLimitDelay();

        try {
            // Use more flexible search - try multiple queries with decreasing specificity
            const searchQueries = [
                `${query} language:${language} stars:>100`,  // First try: high quality repos
                `${query} language:${language} stars:>10`,   // Second try: lower threshold
                `${query.split(' ').slice(0, 2).join(' ')} language:${language} stars:>50` // Third try: fewer keywords
            ];

            for (let i = 0; i < searchQueries.length; i++) {
                const searchQuery = searchQueries[i];
                console.log(`[GitHubSearchService] Attempt ${i + 1}: Searching for:`, searchQuery);

                // Add timeout protection
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    console.log('[GitHubSearchService] Search timeout after 10 seconds');
                    controller.abort();
                }, 10000); // 10 second timeout

                const response = await fetch(`${this.baseUrl}/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc&per_page=10`, {
                    headers: {
                        'Authorization': `token ${this.apiKey}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'AI-Project-Generator'
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    console.error(`[GitHubSearchService] Search attempt ${i + 1} failed:`, response.status, response.statusText);
                    continue; // Try next query
                }

                const data = await response.json();
                console.log(`[GitHubSearchService] Attempt ${i + 1} found ${data.total_count} repositories`);

                if (data.items && data.items.length > 0) {
                    // Found results, return them
                    const repositories = data.items.map((item: any) => ({
                        name: item.name,
                        fullName: item.full_name,
                        description: item.description || '',
                        stars: item.stargazers_count,
                        language: item.language,
                        url: item.html_url,
                        topics: item.topics || []
                    }));

                    console.log(`[GitHubSearchService] Successfully found ${repositories.length} repositories on attempt ${i + 1}`);
                    return repositories;
                }

                // If no results, try next query (unless it's the last one)
                if (i < searchQueries.length - 1) {
                    console.log(`[GitHubSearchService] No results for attempt ${i + 1}, trying more flexible query...`);
                    await this.rateLimitDelay(); // Rate limit between attempts
                }
            }

            // If all attempts failed
            console.log('[GitHubSearchService] All search attempts returned no results');
            return [];

        } catch (error) {
            console.error('[GitHubSearchService] Search error:', error);

            if (error instanceof Error && error.name === 'AbortError') {
                console.error('[GitHubSearchService] Search timed out');
            }

            // Return empty array instead of throwing to allow graceful degradation
            return [];
        }
    }

    async analyzeRepository(repo: Repository): Promise<RepositoryAnalysis> {
        // Apply rate limiting
        await this.rateLimitDelay();

        try {
            console.log(`[GitHubSearchService] 🔍 Analyzing repository: ${repo.fullName}`);

            // Add timeout protection for repository analysis
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log(`[GitHubSearchService] ⏰ Analysis timeout for ${repo.fullName}`);
                controller.abort();
            }, 5000); // 5 second timeout for analysis

            // Fetch repository contents to analyze structure
            const contentsResponse = await fetch(`${this.baseUrl}/repos/${repo.fullName}/contents`, {
                headers: {
                    'Authorization': `token ${this.apiKey}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'AI-Project-Generator'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            let keyFeatures: string[] = [];
            let architecture = 'Standard';
            let techStack: string[] = [repo.language];

            if (contentsResponse.ok) {
                const contents = await contentsResponse.json();
                console.log(`[GitHubSearchService] ✅ Got contents for ${repo.fullName}: ${contents.length} items`);

                // Analyze file structure
                const files = contents.map((item: any) => item.name.toLowerCase());

                // Detect key features based on files
                if (files.includes('requirements.txt') || files.includes('pyproject.toml')) {
                    keyFeatures.push('Python Dependencies');
                }
                if (files.includes('dockerfile')) {
                    keyFeatures.push('Docker Support');
                    techStack.push('Docker');
                }
                if (files.includes('docker-compose.yml')) {
                    keyFeatures.push('Docker Compose');
                }
                if (files.some((f: string) => f.includes('test'))) {
                    keyFeatures.push('Testing Suite');
                }
                if (files.includes('readme.md')) {
                    keyFeatures.push('Documentation');
                }
                if (files.includes('.github')) {
                    keyFeatures.push('CI/CD');
                }
                if (files.some((f: string) => f.includes('model') || f.includes('train'))) {
                    keyFeatures.push('ML Training');
                    architecture = 'ML Pipeline';
                }
                if (files.some((f: string) => f.includes('api') || f.includes('server'))) {
                    keyFeatures.push('API Server');
                    architecture = 'Web Service';
                }

                console.log(`[GitHubSearchService] 🔧 Features detected for ${repo.name}: ${keyFeatures.join(', ')}`);
            } else {
                console.warn(`[GitHubSearchService] ⚠️  Could not fetch contents for ${repo.fullName}: ${contentsResponse.status}`);
                // Continue with basic analysis even if contents fetch fails
            }

            // Calculate quality score (relevance will be calculated during ranking)
            const codeQuality = this.calculateCodeQuality(repo, keyFeatures);

            const analysis: RepositoryAnalysis = {
                repository: repo,
                keyFeatures,
                architecture,
                techStack,
                relevanceScore: 0, // Will be calculated during ranking with user instruction
                codeQuality
            };

            console.log(`[GitHubSearchService] ✅ Analysis complete for ${repo.name}: ${keyFeatures.length} features, quality: ${codeQuality}`);
            return analysis;

        } catch (error) {
            console.error(`[GitHubSearchService] ❌ Analysis error for ${repo.fullName}:`, error);

            // Return basic analysis instead of failing completely
            const fallbackAnalysis: RepositoryAnalysis = {
                repository: repo,
                keyFeatures: ['Basic Implementation'],
                architecture: 'Standard',
                techStack: [repo.language || 'Python'],
                relevanceScore: 0, // Will be calculated during ranking
                codeQuality: 60
            };

            console.log(`[GitHubSearchService] 🔄 Using fallback analysis for ${repo.name}`);
            return fallbackAnalysis;
        }
    }

    rankRepositories(analyses: RepositoryAnalysis[], criteria: string): RankedRepository[] {
        console.log(`[GitHubSearchService] 🏆 Ranking ${analyses.length} repositories based on: "${criteria}"`);

        if (analyses.length === 0) {
            console.warn('[GitHubSearchService] ⚠️  No analyses to rank');
            return [];
        }

        // Score repositories based on multiple factors
        const scored = analyses.map((analysis, index) => {
            const repo = analysis.repository;
            console.log(`[GitHubSearchService] 📊 Scoring ${index + 1}/${analyses.length}: ${repo.name}`);

            // Base score from stars and activity
            let score = Math.min(repo.stars / 1000, 10) * 10; // Max 100 points from stars
            console.log(`[GitHubSearchService]   Stars score: ${Math.round(score)} (${repo.stars} stars)`);

            // Recency bonus
            const daysSinceUpdate = (Date.now() - new Date(repo.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
            let recencyBonus = 0;
            if (daysSinceUpdate < 30) recencyBonus = 20;
            else if (daysSinceUpdate < 90) recencyBonus = 10;
            score += recencyBonus;
            console.log(`[GitHubSearchService]   Recency bonus: ${recencyBonus} (${Math.round(daysSinceUpdate)} days old)`);

            // Feature bonus
            const featureBonus = analysis.keyFeatures.length * 5;
            score += featureBonus;
            console.log(`[GitHubSearchService]   Feature bonus: ${featureBonus} (${analysis.keyFeatures.length} features)`);

            // Quality bonus
            const qualityBonus = analysis.codeQuality * 0.3;
            score += qualityBonus;
            console.log(`[GitHubSearchService]   Quality bonus: ${Math.round(qualityBonus)} (${analysis.codeQuality} quality)`);

            // Relevance bonus - now uses dynamic term extraction
            const relevanceScore = this.calculateRelevanceScore(repo, analysis.keyFeatures, criteria);
            analysis.relevanceScore = relevanceScore; // Update the analysis object
            const relevanceBonus = relevanceScore * 0.5;
            score += relevanceBonus;
            console.log(`[GitHubSearchService]   Relevance bonus: ${Math.round(relevanceBonus)} (${relevanceScore}% relevant)`);

            const finalScore = Math.round(score);
            console.log(`[GitHubSearchService]   Final score: ${finalScore}`);

            return {
                ...analysis,
                rank: 0, // Will be set after sorting
                reasoning: this.generateReasoning(analysis, score),
                totalScore: finalScore
            };
        });

        // Sort by score and assign ranks
        scored.sort((a, b) => b.totalScore - a.totalScore);
        console.log(`[GitHubSearchService] 🥇 Top scored repository: ${scored[0]?.repository.name} (${scored[0]?.totalScore} points)`);

        const ranked = scored.map((item, index) => ({
            ...item,
            rank: index + 1
        }));

        console.log(`[GitHubSearchService] ✅ Ranking complete: ${ranked.length} repositories ranked`);
        return ranked;
    }

    private transformRepository(item: any): Repository {
        return {
            name: item.name,
            fullName: item.full_name,
            description: item.description || 'No description available',
            url: item.html_url,
            stars: item.stargazers_count,
            forks: item.forks_count,
            language: item.language || 'Unknown',
            topics: item.topics || [],
            updatedAt: item.updated_at
        };
    }

    private calculateRelevanceScore(repo: Repository, keyFeatures: string[], userInstruction: string): number {
        let score = 50; // Base score

        const instructionLower = userInstruction.toLowerCase();

        // Extract relevant terms dynamically from user instruction
        const extractedTerms = this.extractRelevantTerms(instructionLower);

        // Topic relevance - check if repo topics match extracted terms
        const matchingTopics = repo.topics.filter(topic =>
            extractedTerms.some(term =>
                topic.toLowerCase().includes(term) ||
                term.includes(topic.toLowerCase())
            )
        );
        score += matchingTopics.length * 15; // Higher weight for topic matches

        // Description relevance - check if description contains extracted terms
        const descriptionLower = repo.description.toLowerCase();
        const matchingKeywords = extractedTerms.filter(term =>
            descriptionLower.includes(term)
        );
        score += matchingKeywords.length * 10; // Higher weight for description matches

        // Repository name relevance
        const repoNameLower = repo.name.toLowerCase();
        const nameMatches = extractedTerms.filter(term =>
            repoNameLower.includes(term)
        );
        score += nameMatches.length * 20; // Highest weight for name matches

        // Feature relevance
        if (keyFeatures.includes('ML Training')) score += 20;
        if (keyFeatures.includes('API Server')) score += 10;
        if (keyFeatures.includes('Docker Support')) score += 10;

        console.log(`[GitHubSearchService] Relevance for ${repo.name}: ${score}% (matched terms: ${[...matchingTopics, ...matchingKeywords, ...nameMatches].join(', ')})`);

        return Math.min(score, 100);
    }

    private extractRelevantTerms(instruction: string): string[] {
        const terms = new Set<string>();

        // Extract specific algorithms mentioned
        const algorithms = ['kmeans', 'k-means', 'svm', 'random forest', 'decision tree', 'logistic regression', 'linear regression', 'pca', 'dbscan', 'hierarchical clustering', 'gaussian mixture', 'neural network', 'cnn', 'rnn', 'lstm', 'transformer', 'bert', 'gpt', 'yolo', 'resnet'];
        algorithms.forEach(algo => {
            if (instruction.includes(algo)) {
                terms.add(algo);
            }
        });

        // Extract task types mentioned
        const tasks = ['clustering', 'classification', 'regression', 'segmentation', 'detection', 'generation', 'prediction', 'analysis', 'recognition', 'recommendation'];
        tasks.forEach(task => {
            if (instruction.includes(task)) {
                terms.add(task);
            }
        });

        // Extract domain-specific terms
        const domains = ['customer', 'market', 'image', 'text', 'nlp', 'computer vision', 'time series', 'financial', 'medical', 'social media'];
        domains.forEach(domain => {
            if (instruction.includes(domain)) {
                terms.add(domain);
            }
        });

        // Extract frameworks/libraries mentioned
        const frameworks = ['tensorflow', 'pytorch', 'scikit-learn', 'sklearn', 'pandas', 'numpy', 'opencv', 'transformers', 'huggingface'];
        frameworks.forEach(framework => {
            if (instruction.includes(framework)) {
                terms.add(framework);
            }
        });

        // Add general ML terms if specific ones not found
        if (terms.size === 0) {
            terms.add('machine learning');
            terms.add('python');
        }

        return Array.from(terms);
    }

    private calculateCodeQuality(repo: Repository, keyFeatures: string[]): number {
        let score = 40; // Base score

        // Community indicators
        if (repo.stars > 100) score += 10;
        if (repo.stars > 500) score += 10;
        if (repo.stars > 1000) score += 10;
        if (repo.forks > 50) score += 10;

        // Quality indicators
        if (keyFeatures.includes('Documentation')) score += 10;
        if (keyFeatures.includes('Testing Suite')) score += 15;
        if (keyFeatures.includes('CI/CD')) score += 10;
        if (keyFeatures.includes('Docker Support')) score += 5;

        return Math.min(score, 100);
    }

    private generateReasoning(analysis: RepositoryAnalysis, score: number): string {
        const repo = analysis.repository;
        const reasons = [];

        if (repo.stars > 500) reasons.push(`Popular (${repo.stars} stars)`);
        if (analysis.keyFeatures.includes('ML Training')) reasons.push('ML-focused');
        if (analysis.keyFeatures.includes('Documentation')) reasons.push('Well-documented');
        if (analysis.keyFeatures.includes('Testing Suite')) reasons.push('Has tests');
        if (analysis.keyFeatures.includes('Docker Support')) reasons.push('Production-ready');

        const daysSinceUpdate = (Date.now() - new Date(repo.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 30) reasons.push('Recently updated');

        return reasons.length > 0 ? reasons.join(', ') : 'Standard implementation';
    }

    async extractSearchTerms(instruction: string, useAI: boolean = true): Promise<string> {
        // Validate input
        if (!instruction || instruction.trim().length < 3) {
            console.warn('[GitHubSearchService] Instruction too short for meaningful search');
            return 'machine learning python';
        }

        // Skip AI if disabled or for speed
        if (!useAI) {
            return this.extractSearchTermsFallback(instruction);
        }

        try {
            console.log('[GitHubSearchService] 🤖 Using AI to extract relevant search terms...');

            const aiPrompt = `You are an expert at finding relevant GitHub repositories for machine learning projects.

User wants to create: "${instruction}"

Extract the MOST SPECIFIC and RELEVANT search terms that would find GitHub repositories directly related to this project. Focus on:

1. Specific algorithms mentioned (e.g., "kmeans", "yolo", "bert", "resnet")
2. Specific techniques (e.g., "clustering", "object detection", "sentiment analysis")  
3. Specific domains (e.g., "computer vision", "nlp", "time series")
4. Implementation approaches (e.g., "from scratch", "pytorch", "tensorflow")

CRITICAL RULES:
- Return 2-3 BROAD search terms separated by spaces
- Prioritize POPULAR algorithms and techniques that have many GitHub repositories
- AVOID overly specific domain terms (like "workout", "medical", "finance") that limit results
- Focus on the CORE technology, not the application domain
- For detection projects, use "object detection" not "workout detection"
- For classification projects, use "classification" not specific domains

Examples:
- "Create a K-means clustering project for customer segmentation" → "kmeans clustering"
- "Build a YOLO object detection system for workout detection" → "yolo object detection"
- "Sentiment analysis with BERT for movie reviews" → "bert sentiment analysis"
- "Time series forecasting with LSTM for stock prices" → "lstm time series"
- "CNN image classification for medical images" → "cnn image classification"

Return only the search terms, nothing else:`;

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://ai-project-generator.local',
                    'X-Title': 'AI Project Generator - Search Term Extraction',
                },
                body: JSON.stringify({
                    model: 'kwaipilot/kat-coder-pro:free', // Fast, free model for this task
                    messages: [{ role: 'user', content: aiPrompt }],
                    max_tokens: 50,
                    temperature: 0.3, // Low temperature for consistent results
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const aiSearchTerms = data.choices[0].message.content?.trim() || '';

                if (aiSearchTerms && aiSearchTerms.length > 0) {
                    console.log('[GitHubSearchService] ✅ AI extracted search terms:', aiSearchTerms);
                    return aiSearchTerms;
                }
            } else {
                console.warn('[GitHubSearchService] AI search term extraction failed, using fallback');
            }
        } catch (error) {
            console.warn('[GitHubSearchService] AI search term extraction error:', error);
        }

        // Fallback to rule-based extraction if AI fails
        return this.extractSearchTermsFallback(instruction);
    }

    private extractSearchTermsFallback(instruction: string): string {
        console.log('[GitHubSearchService] Using fallback search term extraction');

        const instructionLower = instruction.toLowerCase();

        // Specific algorithm detection with high priority
        if (instructionLower.includes('kmean') || instructionLower.includes('k-mean')) {
            return 'kmeans clustering unsupervised';
        }
        if (instructionLower.includes('yolo')) {
            return 'yolo object detection';
        }
        if (instructionLower.includes('bert')) {
            return 'bert transformer nlp';
        }
        if (instructionLower.includes('resnet')) {
            return 'resnet cnn pytorch';
        }
        if (instructionLower.includes('lstm')) {
            return 'lstm rnn tensorflow';
        }

        // Task-specific detection
        if (instructionLower.includes('clustering')) {
            return 'clustering unsupervised machine-learning';
        }
        if (instructionLower.includes('object detection') || instructionLower.includes('detection')) {
            return 'object detection computer vision';
        }
        if (instructionLower.includes('sentiment')) {
            return 'sentiment analysis nlp';
        }
        if (instructionLower.includes('classification')) {
            return 'classification supervised machine-learning';
        }

        // Domain-specific detection
        if (instructionLower.includes('computer vision') || instructionLower.includes('image')) {
            return 'computer vision pytorch opencv';
        }
        if (instructionLower.includes('nlp') || instructionLower.includes('text')) {
            return 'nlp natural language processing';
        }
        if (instructionLower.includes('time series')) {
            return 'time series forecasting';
        }

        // Generic fallback
        return 'machine learning python';
    }
}