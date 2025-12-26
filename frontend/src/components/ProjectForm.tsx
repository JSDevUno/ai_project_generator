import { useState, useEffect } from 'react';
import { Search, Clock, AlertTriangle, Sparkles, CheckCircle } from 'lucide-react';
import type { ProjectConfig, ModelType } from './MLScriptGenerator.js';
import { apiService } from '../services/api.js';

interface ProjectFormProps {
  onSubmit: (config: ProjectConfig) => void;
}

export function ProjectForm({ onSubmit }: ProjectFormProps) {
  const [projectName, setProjectName] = useState('');
  const [instruction, setInstruction] = useState('');
  const [model, setModel] = useState<ModelType>('kwaipilot/kat-coder-pro:free');
  const [enableGitHubSearch, setEnableGitHubSearch] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    search: { limit: number; remaining: number; reset: string; resetIn: number };
    core: { limit: number; remaining: number; reset: string; resetIn: number };
  } | null>(null);
  const [rateLimitLoading, setRateLimitLoading] = useState(false);

  // Fetch rate limit info when GitHub search is enabled
  useEffect(() => {
    if (enableGitHubSearch) {
      fetchRateLimit();
    }
  }, [enableGitHubSearch]);

  const fetchRateLimit = async () => {
    setRateLimitLoading(true);
    try {
      const rateLimit = await apiService.getGitHubRateLimit();
      setRateLimitInfo(rateLimit);
    } catch (error) {
      console.error('Failed to fetch GitHub rate limit:', error);
      setRateLimitInfo(null);
    } finally {
      setRateLimitLoading(false);
    }
  };

  const formatResetTime = (resetIn: number) => {
    if (resetIn <= 0) return 'Now';
    const minutes = Math.floor(resetIn / 60);
    const seconds = resetIn % 60;
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getRateLimitStatus = () => {
    if (!rateLimitInfo) return null;
    
    const { search } = rateLimitInfo;
    const percentage = (search.remaining / search.limit) * 100;
    
    if (percentage > 50) {
      return { color: 'green', status: 'Good' };
    } else if (percentage > 20) {
      return { color: 'yellow', status: 'Limited' };
    } else {
      return { color: 'red', status: 'Critical' };
    }
  };

  const modelOptions = [
    {
      value: 'kwaipilot/kat-coder-pro:free',
      label: 'KAT Coder Pro (Free)',
      description: 'Specialized coding model, excellent for generating high-quality code',
      cost: 'Free'
    },
    {
      value: 'meta-llama/llama-4-maverick:free',
      label: 'Llama 4 Maverick (Free)',
      description: 'Latest Meta Llama 4 model with enhanced reasoning and coding capabilities',
      cost: 'Free'
    },
    {
      value: 'qwen/qwen3-coder:free',
      label: 'Qwen 3 Coder (Free)',
      description: 'Alibaba\'s specialized coding model with strong programming abilities',
      cost: 'Free'
    },
    {
      value: 'openai/gpt-oss-20b:free',
      label: 'GPT-OSS 20B (Free)',
      description: 'Large 20B parameter model, excellent quality and completely free!',
      cost: 'Free'
    },
    {
      value: 'openai/gpt-oss-120b:free',
      label: 'GPT-OSS 120B (Free)',
      description: 'Massive 120B parameter model with exceptional quality, completely free!',
      cost: 'Free'
    },
    {
      value: 'mistralai/mistral-7b-instruct:free',
      label: 'Mistral 7B (Free)',
      description: 'Smaller but efficient instruction-tuned model',
      cost: 'Free'
    },
    {
      value: 'meta-llama/llama-3-8b-instruct:free',
      label: 'Llama 3 8B (Free)',
      description: 'Meta\'s Llama 3, very capable for complex tasks',
      cost: 'Free'
    },
    {
      value: 'mistralai/mixtral-8x7b-instruct:free',
      label: 'Mixtral 8x7B (Free)',
      description: 'Mistral\'s mixture of experts model',
      cost: 'Free'
    },
    {
      value: 'openai/gpt-oss-120b',
      label: 'GPT-OSS 120B (Premium)',
      description: 'Largest model, highest quality but costs credits',
      cost: 'Paid'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim() || !instruction.trim()) {
      return;
    }

    // Validate project name for file system compatibility
    const validProjectName = projectName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (validProjectName !== projectName.trim()) {
      // Auto-fix the project name
      setProjectName(validProjectName);
    }

    onSubmit({
      projectName: validProjectName,
      instruction: instruction.trim(),
      model,
      enableGitHubSearch
    });
  };

  const isValid = projectName.trim() && instruction.trim();

  return (
    <div className="w-full px-4 sm:px-0">
      <div className="bg-white rounded-lg p-4 sm:p-8 shadow-lg">
        <div className="space-y-6 sm:space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              Create AI Project
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Describe any AI project you want to build - from computer vision to NLP,
              traditional ML to deep learning. The system will generate a complete project
              structure with training scripts, inference code, and documentation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Project Name */}
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., image_classifier, sentiment_analyzer"
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
              />
              <p className="text-xs text-gray-500 mt-2">
                Use lowercase with underscores (will be used for folder naming)
              </p>
            </div>

            {/* Instruction */}
            <div>
              <label htmlFor="instruction" className="block text-sm font-medium text-gray-700 mb-2">
                Project Description
              </label>
              <textarea
                id="instruction"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Describe any AI project you want to build. Examples:
• 'Create a YOLO object detection system for traffic signs'
• 'Build a BERT-based sentiment analysis pipeline'
• 'Develop a GAN for generating synthetic medical images'
• 'Create a reinforcement learning agent for stock trading'
• 'Build a speech recognition system using Whisper'"
                rows={5}
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical transition-colors text-base"
              />
              <p className="text-xs text-gray-500 mt-2">
                Be as specific as possible about your requirements, data types, and desired outcomes
              </p>
            </div>

            {/* GitHub Search Toggle */}
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <input
                  type="checkbox"
                  id="githubSearch"
                  checked={enableGitHubSearch}
                  onChange={(e) => setEnableGitHubSearch(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="githubSearch" className="flex items-center text-sm font-medium text-gray-700">
                  <Search className="w-4 h-4 mr-2" />
                  Search GitHub repositories for reference implementations
                </label>
              </div>
              <div className="ml-7 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600">
                  <strong>When enabled:</strong> The system will search GitHub for relevant repositories, 
                  analyze their implementations, and incorporate best practices into your project plan.
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  This adds ~30-60 seconds to generation time but provides enhanced project quality.
                </div>
                {enableGitHubSearch && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 flex items-center">
                    <Sparkles className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span><strong>Enhanced mode enabled:</strong> Your plan will include insights from top-rated repositories in your domain.</span>
                  </div>
                )}
                
                {/* GitHub Rate Limit Indicator */}
                {enableGitHubSearch && (
                  <div className="mt-3 border-t border-gray-200 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">GitHub API Status</span>
                      {rateLimitLoading && (
                        <div className="flex items-center text-xs text-gray-500">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500 mr-1"></div>
                          Checking...
                        </div>
                      )}
                    </div>
                    
                    {rateLimitInfo && !rateLimitLoading && (
                      <div className="space-y-2">
                        {/* Search API Limits */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Search className="w-3 h-3 mr-1 text-gray-500" />
                            <span className="text-xs text-gray-600">Search API</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              getRateLimitStatus()?.color === 'green' ? 'bg-green-500' :
                              getRateLimitStatus()?.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            <span className="text-xs font-medium">
                              {rateLimitInfo.search.remaining}/{rateLimitInfo.search.limit}
                            </span>
                          </div>
                        </div>
                        
                        {/* Reset Time */}
                        {rateLimitInfo.search.remaining < rateLimitInfo.search.limit && (
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>Resets in</span>
                            </div>
                            <span>{formatResetTime(rateLimitInfo.search.resetIn)}</span>
                          </div>
                        )}
                        
                        {/* Warning for low limits */}
                        {rateLimitInfo.search.remaining < 5 && (
                          <div className="flex items-center p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            <AlertTriangle className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span>Low API quota. GitHub search may be limited.</span>
                          </div>
                        )}
                        
                        {/* Info for good limits */}
                        {rateLimitInfo.search.remaining >= 10 && (
                          <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span>Sufficient API quota for GitHub search</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!rateLimitInfo && !rateLimitLoading && (
                      <div className="text-xs text-gray-500 italic">
                        Unable to check GitHub API limits
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                AI Model Selection
              </label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value as ModelType)}
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
              >
                {modelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.cost}
                  </option>
                ))}
              </select>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs sm:text-sm text-gray-700">
                  <strong>{modelOptions.find(opt => opt.value === model)?.label}</strong>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {modelOptions.find(opt => opt.value === model)?.description}
                </div>
                <div className="text-xs mt-1">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${modelOptions.find(opt => opt.value === model)?.cost === 'Free'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                    }`}>
                    {modelOptions.find(opt => opt.value === model)?.cost}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-start pt-4 sm:pt-6">
              <button
                type="submit"
                disabled={!isValid}
                className={`w-full sm:w-auto px-6 py-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-center ${isValid
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {enableGitHubSearch && <Search className="w-4 h-4 mr-2" />}
                {enableGitHubSearch ? 'Generate AI Project Plan with GitHub Search' : 'Generate AI Project Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}