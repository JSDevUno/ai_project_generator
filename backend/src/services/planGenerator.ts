import dotenv from 'dotenv';

// Ensure environment is loaded
dotenv.config();

export class PlanGenerator {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY!;
    console.log('[PlanGenerator] API Key loaded:', this.apiKey ? 'YES' : 'NO');
    console.log('[PlanGenerator] API Key length:', this.apiKey?.length || 0);
  }

  async generatePlan(projectName: string, instruction: string, model?: string): Promise<string> {
    const selectedModel = model || 'kwaipilot/kat-coder-pro:free';
    const prompt = this.buildUniversalPlanPrompt(projectName, instruction);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
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
        signal: controller.signal,
      });

      console.log('[PlanGenerator] OpenRouter Response Status:', response.status);
      console.log('[PlanGenerator] Using model:', selectedModel);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content || 'Failed to generate plan';
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
  }

  async rethinkPlan(projectName: string, instruction: string, feedback?: string, model?: string): Promise<string> {
    const selectedModel = model || 'kwaipilot/kat-coder-pro:free';
    
    let prompt;
    if (feedback && feedback.trim()) {
      // User provided specific feedback
      prompt = `
Improve the AI project plan based on the user's specific feedback:

Project: ${projectName}
Original Instruction: ${instruction}
User Feedback: ${feedback}

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

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content || 'Failed to rethink plan';
  }

  private buildUniversalPlanPrompt(projectName: string, instruction: string): string {
    return `
Create a comprehensive AI project plan for ANY type of AI/ML project:

Project Name: ${projectName}
User Request: ${instruction}

ANALYZE THE REQUEST AND DETERMINE:
1. **AI Domain**: Computer Vision, NLP, Audio, Traditional ML, Deep Learning, RL, etc.
2. **Frameworks Needed**: PyTorch, TensorFlow, sklearn, transformers, ultralytics, etc.
3. **Project Complexity**: Simple classifier, complex pipeline, multi-model system, etc.

GENERATE A COMPLETE PROJECT PLAN INCLUDING:

**1. PROJECT STRUCTURE**
Define the complete folder hierarchy appropriate for this AI type:
- data/ (raw, processed, train, val, test as needed)
- models/ (checkpoints, exports, pretrained as needed)
- src/ (all Python modules)
- configs/ (configuration files)
- results/ (logs, plots, metrics, outputs)
- deployment/ (if applicable)
- notebooks/ (if needed for exploration)
- scripts/ (utility scripts)
- requirements.txt, README.md, setup files

**2. PYTHON FILES TO GENERATE**
List ALL Python files needed:
- Data preprocessing/loading modules
- Model architecture definitions
- Training script with epoch logging
- Inference/prediction scripts
- Evaluation and metrics modules
- Utility functions
- Configuration management
- Export/conversion scripts (ONNX, TensorRT, etc.)

**3. TRAINING APPROACH**
- Model architecture details
- Training loop with comprehensive logging
- Validation strategy
- Checkpointing and model saving
- Hyperparameter configuration
- Progress tracking and visualization

**4. DATA PIPELINE**
- Data loading and preprocessing
- Augmentation strategies (if applicable)
- Batch processing
- Data validation and quality checks

**5. EVALUATION & METRICS**
- Appropriate metrics for the AI type
- Validation procedures
- Testing protocols
- Performance visualization

**6. DEPLOYMENT PREPARATION**
- Model export formats
- Inference optimization
- API endpoints (if needed)
- Docker containerization (if applicable)

**7. DOCUMENTATION**
- Setup instructions
- Usage examples
- API documentation
- Training guides

The plan should be detailed enough to generate a complete, working AI project that the user can immediately use and extend. Include specific technical details about the architecture, training process, and implementation approach.

Make this plan work for ANY AI project type - from simple sklearn models to complex transformer architectures, computer vision pipelines, or reinforcement learning systems.
`;
  }
}