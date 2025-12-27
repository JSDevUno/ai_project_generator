import { useState, useEffect } from 'react';
import { Search, Clock, AlertTriangle, Sparkles, CheckCircle, Star, Crown, Award, Trophy, Medal, ChevronDown } from 'lucide-react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch rate limit info when GitHub search is enabled
  useEffect(() => {
    if (enableGitHubSearch) {
      fetchRateLimit();
    }
  }, [enableGitHubSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && !(event.target as Element).closest('.relative')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

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
      description: '256K context, optimized for agentic coding, 73.4% solve rate on SWE-Bench',
      cost: 'Free',
      status: 'verified',
      rank: 1,
      icon: 'crown'
    },
    {
      value: 'mistralai/devstral-2512:free',
      label: 'Devstral 2512 (Free)',
      description: '123B params, 256K context, specialized in agentic coding & multi-file projects',
      cost: 'Free',
      status: 'verified',
      rank: 2,
      icon: 'trophy'
    },
    {
      value: 'xiaomi/mimo-v2-flash:free',
      label: 'Mimo V2 Flash (Free)',
      description: '309B total/15B active params, 256K context, excels at reasoning & coding',
      cost: 'Free',
      status: 'verified',
      rank: 3,
      icon: 'award'
    },
    {
      value: 'nvidia/nemotron-3-nano-30b-a3b:free',
      label: 'Nemotron 3 Nano (Free)',
      description: '30B MoE, optimized for agentic AI systems',
      cost: 'Free',
      status: 'verified',
      rank: 4,
      icon: 'medal'
    },
    {
      value: 'qwen/qwen3-coder:free',
      label: 'Qwen 3 Coder (Free)',
      description: '480B MoE model, optimized for function calling & long-context coding',
      cost: 'Free',
      status: 'working'
    },
    {
      value: 'deepseek/deepseek-r1-0528:free',
      label: 'DeepSeek R1 (Free)',
      description: '671B params (37B active), strong reasoning for coding',
      cost: 'Free',
      status: 'working'
    },
    {
      value: 'mistralai/mistral-small-3.1-24b-instruct:free',
      label: 'Mistral Small 3.1 (Free)',
      description: '24B params, reliable performer for various coding tasks',
      cost: 'Free',
      status: 'working'
    },
    {
      value: 'mistralai/mistral-7b-instruct:free',
      label: 'Mistral 7B (Free)',
      description: '32K context, general purpose coding',
      cost: 'Free',
      status: 'working'
    },
    {
      value: 'meta-llama/llama-3.3-70b-instruct:free',
      label: 'Llama 3.3 70B (Free)',
      description: '70B params, 131K context, strong general coding',
      cost: 'Free',
      status: 'working'
    },
    {
      value: 'google/gemma-3-27b-it:free',
      label: 'Gemma 3 27B (Free)',
      description: '27B params, 131K context, multimodal with structured outputs',
      cost: 'Free',
      status: 'working'
    },
    {
      value: 'z-ai/glm-4.5-air:free',
      label: 'GLM 4.5 Air (Free)',
      description: 'MoE architecture, hybrid reasoning modes, agent-centric',
      cost: 'Free',
      status: 'working'
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
              
              {/* Custom Dropdown with Lucide Icons */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base bg-white text-left flex items-center justify-between"
                >
                  <div className="flex items-center">
                    {(() => {
                      const selectedModel = modelOptions.find(opt => opt.value === model);
                      if (selectedModel?.icon === 'crown') {
                        return <Crown className="w-4 h-4 text-yellow-500 mr-2" />;
                      } else if (selectedModel?.icon === 'trophy') {
                        return <Trophy className="w-4 h-4 text-orange-500 mr-2" />;
                      } else if (selectedModel?.icon === 'award') {
                        return <Award className="w-4 h-4 text-purple-500 mr-2" />;
                      } else if (selectedModel?.icon === 'medal') {
                        return <Medal className="w-4 h-4 text-blue-500 mr-2" />;
                      } else if (selectedModel?.status === 'verified') {
                        return <CheckCircle className="w-4 h-4 text-green-500 mr-2" />;
                      } else if (selectedModel?.status === 'working') {
                        return <Star className="w-4 h-4 text-blue-500 mr-2" />;
                      }
                      return null;
                    })()}
                    <span>{modelOptions.find(opt => opt.value === model)?.label} - {modelOptions.find(opt => opt.value === model)?.cost}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {modelOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setModel(option.value as ModelType);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-3 sm:px-4 py-3 text-left hover:bg-gray-50 flex items-center transition-colors ${
                          model === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {option.icon === 'crown' && <Crown className="w-4 h-4 text-yellow-500 mr-2" />}
                        {option.icon === 'trophy' && <Trophy className="w-4 h-4 text-orange-500 mr-2" />}
                        {option.icon === 'award' && <Award className="w-4 h-4 text-purple-500 mr-2" />}
                        {option.icon === 'medal' && <Medal className="w-4 h-4 text-blue-500 mr-2" />}
                        {!option.icon && option.status === 'verified' && <CheckCircle className="w-4 h-4 text-green-500 mr-2" />}
                        {!option.icon && option.status === 'working' && <Star className="w-4 h-4 text-blue-500 mr-2" />}
                        <div className="flex-1">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.cost}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center text-xs sm:text-sm text-gray-700">
                  {(() => {
                    const selectedModel = modelOptions.find(opt => opt.value === model);
                    if (selectedModel?.icon === 'crown') {
                      return <Crown className="w-4 h-4 text-yellow-500 mr-2" />;
                    } else if (selectedModel?.icon === 'trophy') {
                      return <Trophy className="w-4 h-4 text-orange-500 mr-2" />;
                    } else if (selectedModel?.icon === 'award') {
                      return <Award className="w-4 h-4 text-purple-500 mr-2" />;
                    } else if (selectedModel?.icon === 'medal') {
                      return <Medal className="w-4 h-4 text-blue-500 mr-2" />;
                    } else if (selectedModel?.status === 'verified') {
                      return <CheckCircle className="w-4 h-4 text-green-500 mr-2" />;
                    } else if (selectedModel?.status === 'working') {
                      return <Star className="w-4 h-4 text-blue-500 mr-2" />;
                    }
                    return null;
                  })()}
                  <strong>{modelOptions.find(opt => opt.value === model)?.label}</strong>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {modelOptions.find(opt => opt.value === model)?.description}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${modelOptions.find(opt => opt.value === model)?.cost === 'Free'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                    }`}>
                    {modelOptions.find(opt => opt.value === model)?.cost}
                  </span>
                  <div className="flex items-center text-xs">
                    {modelOptions.find(opt => opt.value === model)?.status === 'verified' && (
                      <span className="flex items-center text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified Available
                      </span>
                    )}
                    {modelOptions.find(opt => opt.value === model)?.status === 'working' && (
                      <span className="flex items-center text-blue-600">
                        <Star className="w-3 h-3 mr-1" />
                        Confirmed Working
                      </span>
                    )}
                  </div>
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