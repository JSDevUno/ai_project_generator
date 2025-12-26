import type { ProjectConfig, GeneratedPlan } from '../components/MLScriptGenerator.js';

// Environment-aware API URL
const getApiBaseUrl = () => {
  // In production (Vercel), use relative API paths
  if (import.meta.env.PROD) {
    return '/api';
  }

  // In development, use the full localhost URL
  return import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async generatePlan(config: ProjectConfig): Promise<GeneratedPlan> {
    const response = await this.request<{
      success: boolean;
      plan: string;
      projectName: string;
      instruction: string;
      repositories?: any[];
      searchEnabled?: boolean;
    }>('/plan/generate', {
      method: 'POST',
      body: JSON.stringify(config),
    });

    return {
      content: response.plan,
      projectName: response.projectName,
      instruction: response.instruction,
      repositories: response.repositories || [],
      searchEnabled: response.searchEnabled || false,
    };
  }

  async rethinkPlan(config: ProjectConfig, feedback?: string): Promise<GeneratedPlan> {
    const response = await this.request<{
      success: boolean;
      plan: string;
      projectName: string;
      instruction: string;
      repositories?: any[];
      searchEnabled?: boolean;
    }>('/plan/rethink', {
      method: 'POST',
      body: JSON.stringify({ ...config, feedback }),
    });

    return {
      content: response.plan,
      projectName: response.projectName,
      instruction: response.instruction,
      repositories: response.repositories || [],
      searchEnabled: response.searchEnabled || false,
    };
  }

  async generateProject(config: ProjectConfig, plan: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/code/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...config,
        plan,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle ZIP file download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.projectName}_project.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  async generateProjectWithProgress(config: ProjectConfig, plan: string, sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/code/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...config,
        plan,
        sessionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle ZIP file download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.projectName}_project.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  async getGitHubRateLimit(): Promise<{
    search: { limit: number; remaining: number; reset: string; resetIn: number };
    core: { limit: number; remaining: number; reset: string; resetIn: number };
  }> {
    const response = await this.request<{
      success: boolean;
      search: { limit: number; remaining: number; reset: string; resetIn: number };
      core: { limit: number; remaining: number; reset: string; resetIn: number };
    }>('/github/rate-limit');

    return {
      search: response.search,
      core: response.core
    };
  }
}

export const apiService = new ApiService();