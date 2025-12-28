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
      <div style={{ backgroundColor: '#FFFFFF' }} className="rounded-sm p-6 sm:p-10 border-2 border-black ring-1 ring-gray-300 ring-inset shadow-[4px_4px_0_0_#000]">
        <div className="space-y-8 sm:space-y-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: '#0F172A' }}>
              Create AI Project
            </h2>
            <p className="text-base sm:text-lg leading-relaxed" style={{ color: '#475569' }}>
              Describe any AI project you want to build - from computer vision to NLP,
              traditional ML to deep learning. The system will generate a complete project
              structure with training scripts, inference code, and documentation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Project Name */}
            <div>
              <label htmlFor="projectName" className="block text-sm font-semibold mb-3" style={{ color: '#0F172A' }}>
                Project Name
              </label>
              <input
                type="text"
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., image_classifier, sentiment_analyzer"
                className="w-full px-4 sm:px-5 py-4 border-2 border-black rounded-sm focus:ring-2 transition-all duration-200 text-base font-medium shadow-[2px_2px_0_0_#000]"
                style={{ backgroundColor: '#F7F9FC', color: '#0F172A' }}
                onFocus={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.style.backgroundColor = '#FFFFFF';
                  target.style.borderColor = '#2563EB';
                }}
                onBlur={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.style.backgroundColor = '#F7F9FC';
                  target.style.borderColor = '#000000';
                }}
              />
              <p className="text-xs mt-2 ml-1" style={{ color: '#475569' }}>
                Use lowercase with underscores (will be used for folder naming)
              </p>
            </div>

            {/* Instruction */}
            <div>
              <label htmlFor="instruction" className="block text-sm font-semibold mb-3" style={{ color: '#0F172A' }}>
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
                rows={6}
                className="w-full px-4 sm:px-5 py-4 border-2 border-black rounded-sm resize-vertical transition-all duration-200 text-base leading-relaxed shadow-[2px_2px_0_0_#000]"
                style={{ backgroundColor: '#F7F9FC', color: '#0F172A' }}
                onFocus={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.backgroundColor = '#FFFFFF';
                  target.style.borderColor = '#2563EB';
                }}
                onBlur={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.backgroundColor = '#F7F9FC';
                  target.style.borderColor = '#000000';
                }}
              />
              <p className="text-xs mt-2 ml-1" style={{ color: '#475569' }}>
                Be as specific as possible about your requirements, data types, and desired outcomes
              </p>
            </div>

            {/* GitHub Search Toggle */}
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <input
                  type="checkbox"
                  id="githubSearch"
                  checked={enableGitHubSearch}
                  onChange={(e) => setEnableGitHubSearch(e.target.checked)}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-md"
                />
                <label htmlFor="githubSearch" className="flex items-center text-sm font-semibold" style={{ color: '#0F172A' }}>
                  <Search className="w-4 h-4 mr-2" />
                  Search GitHub repositories for reference implementations
                </label>
              </div>
              <div className="ml-8 p-4 rounded-sm border-2 border-black ring-1 ring-gray-300 ring-inset shadow-[4px_4px_0_0_#000]" style={{ background: 'linear-gradient(to bottom right, #F7F9FC, #E5E7EB)' }}>
                <div className="text-sm leading-relaxed" style={{ color: '#0F172A' }}>
                  <strong>When enabled:</strong> The system will search GitHub for relevant repositories,
                  analyze their implementations, and incorporate best practices into your project plan.
                </div>
                <div className="text-xs mt-2" style={{ color: '#475569' }}>
                  This adds ~30-60 seconds to generation time but provides enhanced project quality.
                </div>
                {enableGitHubSearch && (
                  <div className="mt-3 p-3 border-2 border-black rounded-sm text-sm flex items-center shadow-[1px_1px_0_0_#000]" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                    <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span><strong>Enhanced mode enabled:</strong> Your plan will include insights from top-rated repositories in your domain.</span>
                  </div>
                )}

                {/* GitHub Rate Limit Indicator */}
                {enableGitHubSearch && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700">GitHub API Status</span>
                      {rateLimitLoading && (
                        <div className="flex items-center text-sm text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                          Checking...
                        </div>
                      )}
                    </div>

                    {rateLimitInfo && !rateLimitLoading && (
                      <div className="space-y-3">
                        {/* Search API Limits */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-sm border-2 border-black shadow-[1px_1px_0_0_#000]">
                          <div className="flex items-center">
                            <Search className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-sm text-gray-700 font-medium">Search API</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${getRateLimitStatus()?.color === 'green' ? 'bg-green-500' :
                              getRateLimitStatus()?.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}></div>
                            <span className="text-sm font-semibold">
                              {rateLimitInfo.search.remaining}/{rateLimitInfo.search.limit}
                            </span>
                          </div>
                        </div>

                        {/* Reset Time */}
                        {rateLimitInfo.search.remaining < rateLimitInfo.search.limit && (
                          <div className="flex items-center justify-between text-sm text-gray-500 px-3">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              <span>Resets in</span>
                            </div>
                            <span className="font-medium">{formatResetTime(rateLimitInfo.search.resetIn)}</span>
                          </div>
                        )}

                        {/* Warning for low limits */}
                        {rateLimitInfo.search.remaining < 5 && (
                          <div className="flex items-center p-3 bg-red-50 border-2 border-black rounded-sm text-sm text-red-700 shadow-[1px_1px_0_0_#000]">
                            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>Low API quota. GitHub search may be limited.</span>
                          </div>
                        )}

                        {/* Info for good limits */}
                        {rateLimitInfo.search.remaining >= 10 && (
                          <div className="text-sm text-green-700 bg-green-50 border-2 border-black rounded-sm p-3 flex items-center shadow-[1px_1px_0_0_#000]">
                            <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>Sufficient API quota for GitHub search</span>
                          </div>
                        )}
                      </div>
                    )}

                    {!rateLimitInfo && !rateLimitLoading && (
                      <div className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-sm border-2 border-black shadow-[1px_1px_0_0_#000]">
                        Unable to check GitHub API limits
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label htmlFor="model" className="block text-sm font-semibold mb-3" style={{ color: '#0F172A' }}>
                AI Model Selection
              </label>

              {/* Custom Dropdown with Lucide Icons */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 sm:px-5 py-4 border-2 border-black rounded-sm transition-all duration-200 text-base font-medium text-left flex items-center justify-between shadow-[2px_2px_0_0_#000]"
                  style={{ backgroundColor: '#F7F9FC', color: '#0F172A' }}
                  onFocus={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.style.backgroundColor = '#FFFFFF';
                    target.style.borderColor = '#2563EB';
                  }}
                  onBlur={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.style.backgroundColor = '#F7F9FC';
                    target.style.borderColor = '#000000';
                  }}
                >
                  <div className="flex items-center">
                    {(() => {
                      const selectedModel = modelOptions.find(opt => opt.value === model);
                      if (selectedModel?.icon === 'crown') {
                        return <Crown className="w-5 h-5 text-yellow-500 mr-3" />;
                      } else if (selectedModel?.icon === 'trophy') {
                        return <Trophy className="w-5 h-5 text-orange-500 mr-3" />;
                      } else if (selectedModel?.icon === 'award') {
                        return <Award className="w-5 h-5 text-purple-500 mr-3" />;
                      } else if (selectedModel?.icon === 'medal') {
                        return <Medal className="w-5 h-5 text-blue-500 mr-3" />;
                      } else if (selectedModel?.status === 'verified') {
                        return <CheckCircle className="w-5 h-5 text-green-500 mr-3" />;
                      } else if (selectedModel?.status === 'working') {
                        return <Star className="w-5 h-5 text-blue-500 mr-3" />;
                      }
                      return null;
                    })()}
                    <span>{modelOptions.find(opt => opt.value === model)?.label} - {modelOptions.find(opt => opt.value === model)?.cost}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-2 border-2 border-black rounded-sm shadow-[2px_2px_0_0_#000] max-h-64 overflow-y-auto" style={{ backgroundColor: '#FFFFFF' }}>
                    {modelOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setModel(option.value as ModelType);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 sm:px-5 py-4 text-left hover:bg-gray-50 flex items-center transition-all duration-200 ${model === option.value ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500' : 'text-gray-700'
                          }`}
                      >
                        {option.icon === 'crown' && <Crown className="w-5 h-5 text-yellow-500 mr-3" />}
                        {option.icon === 'trophy' && <Trophy className="w-5 h-5 text-orange-500 mr-3" />}
                        {option.icon === 'award' && <Award className="w-5 h-5 text-purple-500 mr-3" />}
                        {option.icon === 'medal' && <Medal className="w-5 h-5 text-blue-500 mr-3" />}
                        {!option.icon && option.status === 'verified' && <CheckCircle className="w-5 h-5 text-green-500 mr-3" />}
                        {!option.icon && option.status === 'working' && <Star className="w-5 h-5 text-blue-500 mr-3" />}
                        <div className="flex-1">
                          <div className="font-semibold">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.cost}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3 p-4 rounded-sm border-2 border-black shadow-[4px_4px_0_0_#000]" style={{ background: 'linear-gradient(to bottom right, #F7F9FC, #E5E7EB)' }}>
                <div className="flex items-center text-sm sm:text-base text-gray-700 font-medium">
                  {(() => {
                    const selectedModel = modelOptions.find(opt => opt.value === model);
                    if (selectedModel?.icon === 'crown') {
                      return <Crown className="w-5 h-5 text-yellow-500 mr-3" />;
                    } else if (selectedModel?.icon === 'trophy') {
                      return <Trophy className="w-5 h-5 text-orange-500 mr-3" />;
                    } else if (selectedModel?.icon === 'award') {
                      return <Award className="w-5 h-5 text-purple-500 mr-3" />;
                    } else if (selectedModel?.icon === 'medal') {
                      return <Medal className="w-5 h-5 text-blue-500 mr-3" />;
                    } else if (selectedModel?.status === 'verified') {
                      return <CheckCircle className="w-5 h-5 text-green-500 mr-3" />;
                    } else if (selectedModel?.status === 'working') {
                      return <Star className="w-5 h-5 text-blue-500 mr-3" />;
                    }
                    return null;
                  })()}
                  <strong>{modelOptions.find(opt => opt.value === model)?.label}</strong>
                </div>
                <div className="text-sm text-gray-600 mt-2 leading-relaxed">
                  {modelOptions.find(opt => opt.value === model)?.description}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${modelOptions.find(opt => opt.value === model)?.cost === 'Free'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                    }`}>
                    {modelOptions.find(opt => opt.value === model)?.cost}
                  </span>
                  <div className="flex items-center text-sm">
                    {modelOptions.find(opt => opt.value === model)?.status === 'verified' && (
                      <span className="flex items-center text-green-600 font-medium">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Verified Available
                      </span>
                    )}
                    {modelOptions.find(opt => opt.value === model)?.status === 'working' && (
                      <span className="flex items-center text-blue-600 font-medium">
                        <Star className="w-4 h-4 mr-1" />
                        Confirmed Working
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-start pt-6 sm:pt-8">
              <button
                type="submit"
                disabled={!isValid}
                className={`w-full sm:w-auto px-8 py-4 text-base font-semibold rounded-sm transition-all duration-200 flex items-center justify-center transform ${isValid
                  ? 'text-white hover:-translate-y-0.5 focus:ring-2 focus:ring-offset-2 shadow-[2px_2px_0_0_#000]'
                  : 'cursor-not-allowed shadow-[2px_2px_0_0_#000]'
                  }`}
                style={{
                  backgroundColor: isValid ? '#2563EB' : '#E5E7EB',
                  color: isValid ? '#FFFFFF' : '#475569',
                  borderColor: '#000000'
                }}
                onMouseEnter={(e) => {
                  if (isValid) {
                    const target = e.target as HTMLButtonElement;
                    target.style.backgroundColor = '#1D4ED8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isValid) {
                    const target = e.target as HTMLButtonElement;
                    target.style.backgroundColor = '#2563EB';
                  }
                }}
              >
                {enableGitHubSearch && <Search className="w-5 h-5 mr-3" />}
                {enableGitHubSearch ? 'Generate AI Project Plan with GitHub Search' : 'Generate AI Project Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}