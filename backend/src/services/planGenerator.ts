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

    console.log('[PlanGenerator] Starting plan generation...');
    console.log('[PlanGenerator] Model:', selectedModel);
    console.log('[PlanGenerator] Project:', projectName);

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

      return data.choices[0].message.content || 'Failed to generate plan';
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
You are creating an AI project plan. Follow the user's EXACT requirements without adding extra files or features.

Project Name: ${projectName}
User Request: ${instruction}

CRITICAL RULES:
1. If the user specifies what files they want, generate ONLY those files
2. If the user says "it must contain X, Y, Z", generate ONLY X, Y, Z (plus any folders they mention)
3. Do NOT add "helpful" extra files unless explicitly requested
4. Do NOT assume they want additional utilities, configs, or scripts

Generate a project plan that includes EXACTLY what the user described, nothing more.

Focus on:
- Project structure with only the requested files/folders
- Implementation details for each requested component
- Technical specifications that fulfill their requirements

Keep it simple and focused on their actual needs.
`;
  }
}