import dotenv from 'dotenv';
import { GitHubSearchService, type RankedRepository, type RepositoryAnalysis } from './githubSearchService.js';

// Ensure environment is loaded
dotenv.config();

export interface EnhancedPlan {
  content: string;
  projectName: string;
  instruction: string;
  repositories?: RankedRepository[];
  searchEnabled: boolean;
}

export class PlanGenerator {
  private githubService: GitHubSearchService;
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY!;
    this.githubService = new GitHubSearchService();
    console.log('[PlanGenerator] API Key loaded:', this.apiKey ? 'YES' : 'NO');
    console.log('[PlanGenerator] API Key length:', this.apiKey?.length || 0);
  }

  async generatePlan(projectName: string, instruction: string, model?: string, enableGitHubSearch?: boolean): Promise<EnhancedPlan> {
    const selectedModel = model || 'kwaipilot/kat-coder-pro:free';
    let repositories: RankedRepository[] = [];

    console.log('[PlanGenerator] Starting plan generation...');
    console.log('[PlanGenerator] Model:', selectedModel);
    console.log('[PlanGenerator] Project:', projectName);
    console.log('[PlanGenerator] GitHub Search:', enableGitHubSearch ? 'ENABLED' : 'DISABLED');

    // GitHub repository search if enabled
    if (enableGitHubSearch) {
      try {
        console.log('[PlanGenerator] 🔍 Searching GitHub repositories...');

        // Extract search terms from instruction (use AI for maximum accuracy)
        const searchTerms = await this.githubService.extractSearchTerms(instruction, true);
        console.log('[PlanGenerator] Search terms:', searchTerms);

        // Search repositories
        const foundRepos = await this.githubService.searchRepositories(searchTerms);
        console.log(`[PlanGenerator] Found ${foundRepos.length} repositories`);

        if (foundRepos.length > 0) {
          console.log(`[PlanGenerator] 📊 Analyzing ${foundRepos.length} repositories...`);

          // Analyze repositories with better error handling
          const analyses: RepositoryAnalysis[] = [];

          for (let i = 0; i < Math.min(foundRepos.length, 5); i++) {
            const repo = foundRepos[i];
            try {
              console.log(`[PlanGenerator] 🔍 Analyzing ${i + 1}/${Math.min(foundRepos.length, 5)}: ${repo.name}`);
              const analysis = await this.githubService.analyzeRepository(repo);
              analyses.push(analysis);
              console.log(`[PlanGenerator] ✅ Analysis ${i + 1} complete: ${analysis.keyFeatures.length} features`);
            } catch (error) {
              console.error(`[PlanGenerator] ❌ Failed to analyze ${repo.name}:`, error);
              // Continue with other repositories instead of failing completely
            }
          }

          console.log(`[PlanGenerator] 📈 Successfully analyzed ${analyses.length} repositories`);

          if (analyses.length > 0) {
            // Rank repositories
            repositories = this.githubService.rankRepositories(analyses, instruction);
            console.log(`[PlanGenerator] 🏆 Ranked ${repositories.length} repositories`);

            if (repositories.length > 0) {
              console.log(`[PlanGenerator] 🎯 Top repository: ${repositories[0].repository.name} (${repositories[0].relevanceScore}% relevant)`);
            }
          } else {
            console.warn('[PlanGenerator] ⚠️  No repositories could be analyzed successfully');
          }
        }
      } catch (error) {
        console.error('[PlanGenerator] GitHub search failed:', error);
        // Continue without repositories - don't fail the entire process
      }
    }

    const prompt = this.buildEnhancedPlanPrompt(projectName, instruction, repositories);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[PlanGenerator] Request timeout after 60 seconds');
      controller.abort();
    }, 60000); // 60 second timeout

    try {
      console.log('[PlanGenerator] Making request to OpenRouter...');

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ai-project-generator.local',
          'X-Title': 'Universal AI Project Generator',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{
            role: 'user',
            content: prompt,
          }],
          stream: false,
          max_tokens: 4000,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      console.log('[PlanGenerator] OpenRouter Response Status:', response.status);
      console.log('[PlanGenerator] Response Headers:', Object.fromEntries(response.headers.entries()));

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[PlanGenerator] API Error Response:', errorText);
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[PlanGenerator] Response received successfully');

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('[PlanGenerator] Invalid response structure:', data);
        throw new Error('Invalid response from OpenRouter API');
      }

      const planContent = data.choices[0].message.content || 'Failed to generate plan';

      return {
        content: planContent,
        projectName,
        instruction,
        repositories: repositories.slice(0, 3), // Top 3 for display
        searchEnabled: enableGitHubSearch || false
      };
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[PlanGenerator] Error details:', error);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        if (error.message.includes('terminated')) {
          throw new Error('Connection lost to AI service - please check your internet connection and try again');
        }
      }
      throw error;
    }
  }

  async rethinkPlan(projectName: string, instruction: string, feedback?: string, model?: string, enableGitHubSearch?: boolean): Promise<EnhancedPlan> {
    const selectedModel = model || 'kwaipilot/kat-coder-pro:free';
    let repositories: RankedRepository[] = [];

    // GitHub repository search if enabled (same as generatePlan)
    if (enableGitHubSearch) {
      try {
        console.log('[PlanGenerator] 🔍 Re-searching GitHub repositories for rethink...');

        const searchTerms = await this.githubService.extractSearchTerms(instruction + ' ' + (feedback || ''), true);
        const foundRepos = await this.githubService.searchRepositories(searchTerms);

        if (foundRepos.length > 0) {
          const analyses = await Promise.all(
            foundRepos.slice(0, 5).map(repo => this.githubService.analyzeRepository(repo))
          );
          repositories = this.githubService.rankRepositories(analyses, instruction);
        }
      } catch (error) {
        console.error('[PlanGenerator] GitHub search failed during rethink:', error);
      }
    }

    let prompt;
    if (feedback && feedback.trim()) {
      // User provided specific feedback
      prompt = `
Improve the AI project plan based on the user's specific feedback:

Project: ${projectName}
Original Instruction: ${instruction}
User Feedback: ${feedback}

${repositories.length > 0 ? this.buildRepositoryContext(repositories) : ''}

Generate an improved, more detailed plan that addresses the user's feedback and incorporates their requested changes.

IMPORTANT:
- Focus on implementing the specific changes requested in the feedback
- If they want to add features (Docker, ONNX, API, etc.), include detailed implementation plans
- If they want to remove features, exclude them from the plan
- If they want to change architecture (CNN to ResNet, etc.), update the technical approach
- If they want different technologies, adapt the tech stack accordingly
- Maintain the overall project structure while incorporating their changes
- Be specific about how the requested changes will be implemented

Provide a comprehensive plan that reflects their customization requests.
`;
    } else {
      // General regeneration without specific feedback
      prompt = `
Generate an alternative AI project plan with a different approach:

Project: ${projectName}
Instruction: ${instruction}

${repositories.length > 0 ? this.buildRepositoryContext(repositories) : ''}

Create a new plan that:
- Uses a different technical approach or architecture
- Suggests alternative frameworks or methodologies
- Provides a fresh perspective on the implementation
- Maintains the core requirements but explores different solutions
- Includes different project structure or workflow

Focus on practical implementation and clear project organization.
Include complete folder structure and file organization.
`;
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-project-generator.local',
        'X-Title': 'Universal AI Project Generator',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{
          role: 'user',
          content: prompt,
        }],
        stream: false,
      }),
    });

    console.log('[PlanGenerator] Rethink using model:', selectedModel);
    console.log('[PlanGenerator] Feedback provided:', feedback ? 'YES' : 'NO');
    console.log('[PlanGenerator] GitHub repositories:', repositories.length);

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const planContent = data.choices[0].message.content || 'Failed to rethink plan';

    return {
      content: planContent,
      projectName,
      instruction,
      repositories: repositories.slice(0, 3),
      searchEnabled: enableGitHubSearch || false
    };
  }

  private buildEnhancedPlanPrompt(projectName: string, instruction: string, repositories: RankedRepository[]): string {
    let prompt = this.buildUniversalPlanPrompt(projectName, instruction);

    if (repositories.length > 0) {
      prompt += `\n\n${this.buildRepositoryContext(repositories)}`;
    }

    return prompt;
  }

  private buildRepositoryContext(repositories: RankedRepository[]): string {
    let context = `REFERENCE IMPLEMENTATIONS:\n`;
    context += `The following GitHub repositories provide relevant reference implementations:\n\n`;

    repositories.forEach((repo, index) => {
      context += `${index + 1}. ${repo.repository.name} (${repo.repository.stars} stars)\n`;
      context += `   Repository: ${repo.repository.fullName}\n`;
      context += `   Description: ${repo.repository.description}\n`;
      context += `   Key Features: ${repo.keyFeatures.join(', ')}\n`;
      context += `   Architecture: ${repo.architecture}\n`;
      context += `   Tech Stack: ${repo.techStack.join(', ')}\n`;
      context += `   Relevance Score: ${repo.relevanceScore}%\n`;
      context += `   Reasoning: ${repo.reasoning}\n\n`;
    });

    context += `Consider these implementations when designing the project structure and choosing appropriate technologies. `;
    context += `Incorporate best practices and patterns observed in these repositories while adapting them to the specific requirements. `;
    context += `Reference these repositories in your plan to show how they influenced your design decisions.\n`;

    return context;
  }
  private buildUniversalPlanPrompt(projectName: string, instruction: string): string {
    return `
You are creating an AI project plan. Follow the user's EXACT requirements without adding extra files or features.

Project Name: ${projectName}
User Request: ${instruction}

CRITICAL RULES:
1. If the user specifies what files they want, generate ONLY those files
2. If the user says "it must contain X, Y, Z", generate ONLY X, Y, Z (plus any folders they mention)
3. Do NOT add "helpful" extra files unless explicitly requested
4. Do NOT assume they want additional utilities, configs, or scripts

NEVER INCLUDE THESE USER-PROVIDED FILES:
- Video files (.mp4, .avi, .mov) - users provide their own test videos
- Audio files (.wav, .mp3) - users provide their own audio data
- Image datasets - users provide their own training images
- Model weight files (.pt, .pth, .h5, .pkl) - users train their own models
- Jupyter notebooks (.ipynb) - users create their own analysis notebooks
- Test data files - users provide their own test datasets
- Configuration files unless specifically requested
- Complex utility modules - keep utilities minimal and focused

FOCUS ON CODE GENERATION ONLY:
- Main application scripts
- Core functionality modules
- Simple configuration files (only if needed)
- README with setup instructions
- Requirements.txt for dependencies
- Basic project structure

If user says "simple only" or "no deployment", create a MINIMAL project with just the essential code files.

Generate a project plan that includes EXACTLY what the user described, nothing more.

Focus on:
- Project structure with only the requested files/folders
- Implementation details for each requested component
- Technical specifications that fulfill their requirements

Keep it simple and focused on their actual needs.
`;
  }
}