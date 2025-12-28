import { useState } from 'react';
import { Info, Search, GitBranch, Star, GitFork, BarChart3, ExternalLink, Lightbulb, CheckCircle } from 'lucide-react';
import type { GeneratedPlan } from './MLScriptGenerator.js';
import type { JSX } from 'react/jsx-runtime';

interface PlanDisplayProps {
  plan: GeneratedPlan;
  onApprove: () => void;
  onRethink: (feedback?: string) => void;
}

// Simple markdown-to-HTML converter for better display
function formatMarkdownText(text: string): string {
  return text
    // Headers with better spacing
    .replace(/^### (.*$)/gm, '<h3 class="text-base sm:text-lg font-semibold text-gray-900 mt-6 mb-3 first:mt-0">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg sm:text-xl font-semibold text-gray-900 mt-8 mb-4 first:mt-0">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-6 first:mt-0">$1</h1>')

    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')

    // Code blocks with better mobile spacing
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```\w*\n?/g, '').replace(/```$/g, '');
      return `<pre class="bg-gray-100 p-3 sm:p-4 rounded-md text-xs sm:text-sm font-mono overflow-x-auto my-4 border"><code>${code}</code></pre>`;
    })

    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm font-mono">$1</code>')

    // Lists with better spacing
    .replace(/^- (.*$)/gm, '<li class="ml-4 mb-2 text-sm sm:text-base">• $1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 mb-2 text-sm sm:text-base">$1. $2</li>')

    // Line breaks
    .replace(/\n\n/g, '</p><p class="mb-4 text-sm sm:text-base leading-relaxed">')
    .replace(/\n/g, '<br/>')

    // Wrap in paragraphs with better spacing
    .replace(/^(.)/gm, '<p class="mb-4 text-sm sm:text-base leading-relaxed first:mt-0">$1')
    .replace(/(.*)$/gm, '$1</p>')

    // Clean up extra paragraph tags
    .replace(/<p class="mb-4 text-sm sm:text-base leading-relaxed first:mt-0"><\/p>/g, '')
    .replace(/<p class="mb-4 text-sm sm:text-base leading-relaxed first:mt-0">(<h[1-6])/g, '$1')
    .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
    .replace(/<p class="mb-4 text-sm sm:text-base leading-relaxed first:mt-0">(<pre)/g, '$1')
    .replace(/(<\/pre>)<\/p>/g, '$1')
    .replace(/<p class="mb-4 text-sm sm:text-base leading-relaxed first:mt-0">(<li)/g, '$1')
    .replace(/(<\/li>)<\/p>/g, '$1');
}

export function PlanDisplay({ plan, onApprove, onRethink }: PlanDisplayProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleRethinkWithFeedback = () => {
    if (feedback.trim()) {
      onRethink(feedback.trim());
      setFeedback('');
      setShowFeedback(false);
    } else {
      onRethink();
    }
  };

  const formattedPlan = formatMarkdownText(plan.content);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="rounded-sm border-2 border-black shadow-[4px_4px_0_0_#000] transition-shadow duration-300" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate" style={{ color: '#0F172A' }}>
                AI Project Plan: {plan.projectName}
              </h2>
              <p className="text-base mt-2" style={{ color: '#475569' }}>
                Complete project structure and implementation plan
              </p>
            </div>
            <div className="flex items-center space-x-3 flex-shrink-0">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                Plan Generated
              </span>
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="px-8 py-6 bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="text-base space-y-4">
            <div>
              <span className="font-semibold text-gray-700">Project Description:</span>
              <p className="mt-2 text-gray-600 leading-relaxed">{plan.instruction}</p>
            </div>
            {plan.searchEnabled && (
              <div>
                <span className="font-semibold text-gray-700 flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  GitHub Search:
                </span>
                <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Enabled
                </span>
              </div>
            )}
          </div>
        </div>

        {/* GitHub Repositories Section */}
        {plan.searchEnabled && (
          <div className="px-8 py-6 bg-blue-50 border-b border-blue-200">
            <h3 className="text-base font-bold text-blue-900 mb-4 flex items-center">
              <GitBranch className="w-5 h-5 mr-3" />
              Referenced GitHub Repositories
            </h3>

            {plan.repositories && plan.repositories.length > 0 ? (
              <>
                <div className="space-y-4">
                  {plan.repositories.slice(0, 3).map((repo, index) => (
                    <div key={index} className="p-5 rounded-sm border-2 border-black shadow-[3px_3px_0_0_#000] transition-shadow duration-200" style={{ backgroundColor: '#FFFFFF' }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-gray-900 text-base">{repo.name}</h4>
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center font-medium"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </a>
                        </div>
                        <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
                          Rank #{repo.rank}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 leading-relaxed line-clamp-2">{repo.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {repo.keyFeatures && repo.keyFeatures.slice(0, 3).map((feature, idx) => (
                          <span key={idx} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-lg font-medium">
                            {feature}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Star className="w-4 h-4 mr-1" />
                            {repo.stars?.toLocaleString() || 0}
                          </span>
                          <span className="flex items-center">
                            <GitFork className="w-4 h-4 mr-1" />
                            {repo.forks?.toLocaleString() || 0}
                          </span>
                          <span className="flex items-center">
                            <BarChart3 className="w-4 h-4 mr-1" />
                            {repo.relevanceScore || 0}%
                          </span>
                        </div>
                        <span className="text-sm text-gray-400 truncate max-w-40">{repo.reasoning || 'Quality implementation'}</span>
                      </div>

                      {/* Implementation Details */}
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="text-sm text-blue-700 font-semibold mb-2 flex items-center">
                          <Lightbulb className="w-4 h-4 mr-2" />
                          How this will be implemented:
                        </div>
                        <div className="text-sm text-blue-600 space-y-1">
                          {getImplementationDetails(repo, plan.instruction)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-blue-700 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  These repositories influenced the project structure and technology choices in the plan below.
                </div>
              </>
            ) : (
              <div className="bg-yellow-50 border-2 border-black rounded-sm p-4 shadow-[1px_1px_0_0_#000]">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-yellow-800">
                      <strong>No repositories found</strong> - GitHub search was enabled but no relevant repositories were discovered.
                      The plan was generated using standard AI knowledge.
                    </p>
                    <p className="text-sm text-yellow-600 mt-2">
                      This might happen due to very specific requirements, API rate limits, or network issues.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Plan Content - Now properly formatted */}
        <div className="px-8 py-8">
          <div className="prose prose-base max-w-none">
            <div
              className="rounded-sm p-8 border-2 border-black shadow-[3px_3px_0_0_#000]"
              style={{ background: 'linear-gradient(to bottom right, #F7F9FC, #E5E7EB)' }}
              dangerouslySetInnerHTML={{ __html: formattedPlan }}
            />
          </div>
        </div>

        {/* Feedback Section */}
        {showFeedback && (
          <div className="px-8 py-6 bg-yellow-50 border-t border-yellow-200">
            <div className="w-full">
              <h3 className="text-base font-bold text-yellow-800 mb-3 text-center">
                Customize Your Project Plan
              </h3>
              <p className="text-sm text-yellow-700 mb-4 text-center">
                Tell the AI exactly what you want to change, add, or remove from this plan:
              </p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Examples:
• Add Docker containerization and Kubernetes deployment
• Remove ONNX export and add TensorRT optimization instead
• Change from CNN to ResNet-50 architecture
• Include data augmentation with rotation and flipping
• Add REST API endpoints for model serving
• Include unit tests and CI/CD pipeline with GitHub Actions
• Add model monitoring and logging capabilities
• Change dataset from CIFAR-10 to custom dataset loading"
                rows={6}
                className="w-full px-4 py-3 border-2 border-black rounded-sm text-base transition-all duration-200 shadow-[2px_2px_0_0_#000]"
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
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 space-y-3 sm:space-y-0">
                <p className="text-sm text-yellow-600 text-center sm:text-left flex items-center justify-center sm:justify-start">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Be specific about what you want - the AI will adapt the entire plan accordingly
                </p>
                <div className="flex justify-center sm:justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowFeedback(false);
                      setFeedback('');
                    }}
                    className="px-4 py-2 text-base text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRethinkWithFeedback}
                    disabled={!feedback.trim()}
                    className={`px-6 py-2 text-base font-semibold rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-200 shadow-[1px_1px_0_0_#000] ${feedback.trim()
                      ? 'text-white bg-yellow-600 hover:bg-yellow-700 shadow-[1px_1px_0_0_#000]'
                      : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      }`}
                  >
                    Update Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-8 py-6 bg-gradient-to-br from-gray-50 to-gray-100 border-t border-gray-200 flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-6">
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className="px-6 py-3 text-base font-semibold border-2 border-black rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-[2px_2px_0_0_#000]"
            style={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = '#F7F9FC';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = '#FFFFFF';
            }}
          >
            {showFeedback ? 'Hide Customization' : 'Customize Plan'}
          </button>

          <button
            onClick={onApprove}
            className="px-8 py-3 text-base font-semibold text-white border-2 border-black rounded-sm transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-[2px_2px_0_0_#000]"
            style={{ backgroundColor: '#16A34A' }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = '#15803D';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = '#16A34A';
            }}
          >
            Generate Code →
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 border-2 border-black rounded-sm p-6 shadow-[3px_3px_0_0_#000]" style={{ backgroundColor: '#DBEAFE' }}>
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-6 w-6 text-blue-400" />
          </div>
          <div className="ml-4">
            <h3 className="text-base font-bold text-blue-800">
              Review Your AI Project Plan
            </h3>
            <div className="mt-3 text-base text-blue-700">
              <p>
                Your AI project plan is ready! You have two options:
              </p>
              <ul className="mt-3 list-disc list-inside space-y-2">
                <li><strong>Customize Plan:</strong> Click to request specific changes, additions, or modifications</li>
                <li><strong>Approve & Generate:</strong> Create the complete project with the current plan</li>
              </ul>
              <p className="mt-3 text-sm text-blue-600 flex items-center">
                <Lightbulb className="w-4 h-4 mr-2" />
                The customization feature lets you fine-tune every aspect of your project before generation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate implementation details for each repository
function getImplementationDetails(repo: any, instruction: string): JSX.Element[] {
  const details: JSX.Element[] = [];
  const instructionLower = instruction.toLowerCase();
  const repoName = repo.name.toLowerCase();
  const keyFeatures = repo.keyFeatures || [];
  const techStack = repo.techStack || [];

  // Architecture patterns
  if (repo.architecture === 'ML Pipeline') {
    details.push(
      <div key="architecture" className="flex items-start">
        <span className="text-blue-500 mr-1">•</span>
        <span>Adopt <strong>{repo.name}</strong>'s ML pipeline architecture for training and inference workflows</span>
      </div>
    );
  }

  // Technology stack integration
  if (techStack.includes('Python') || techStack.includes('PyTorch') || techStack.includes('TensorFlow')) {
    const frameworks = techStack.filter((tech: string) => ['PyTorch', 'TensorFlow', 'Keras'].includes(tech));
    if (frameworks.length > 0) {
      details.push(
        <div key="frameworks" className="flex items-start">
          <span className="text-blue-500 mr-1">•</span>
          <span>Use <strong>{frameworks.join(', ')}</strong> framework patterns from {repo.name}</span>
        </div>
      );
    }
  }

  // Feature-specific implementations
  if (keyFeatures.includes('Testing Suite')) {
    details.push(
      <div key="testing" className="flex items-start">
        <span className="text-blue-500 mr-1">•</span>
        <span>Implement testing patterns and validation methods from {repo.name}</span>
      </div>
    );
  }

  if (keyFeatures.includes('Docker Support')) {
    details.push(
      <div key="docker" className="flex items-start">
        <span className="text-blue-500 mr-1">•</span>
        <span>Integrate containerization setup inspired by {repo.name}'s Docker configuration</span>
      </div>
    );
  }

  if (keyFeatures.includes('Documentation')) {
    details.push(
      <div key="docs" className="flex items-start">
        <span className="text-blue-500 mr-1">•</span>
        <span>Follow documentation structure and README format from {repo.name}</span>
      </div>
    );
  }

  // Algorithm-specific implementations
  if (instructionLower.includes('yolo') && repoName.includes('yolo')) {
    details.push(
      <div key="yolo" className="flex items-start">
        <span className="text-blue-500 mr-1">•</span>
        <span>Incorporate YOLO model architecture and optimization techniques from {repo.name}</span>
      </div>
    );
  }

  if (instructionLower.includes('clustering') && (repoName.includes('cluster') || repoName.includes('kmeans'))) {
    details.push(
      <div key="clustering" className="flex items-start">
        <span className="text-blue-500 mr-1">•</span>
        <span>Apply clustering algorithms and evaluation metrics from {repo.name}</span>
      </div>
    );
  }

  if (instructionLower.includes('detection') && repoName.includes('detection')) {
    details.push(
      <div key="detection" className="flex items-start">
        <span className="text-blue-500 mr-1">•</span>
        <span>Leverage object detection preprocessing and post-processing from {repo.name}</span>
      </div>
    );
  }

  // Performance optimizations
  if (repo.relevanceScore > 80) {
    details.push(
      <div key="optimization" className="flex items-start">
        <span className="text-blue-500 mr-1">•</span>
        <span>Adopt performance optimization strategies and best practices from this highly relevant repository</span>
      </div>
    );
  }

  // Fallback if no specific implementations found
  if (details.length === 0) {
    details.push(
      <div key="general" className="flex items-start">
        <span className="text-blue-500 mr-1">•</span>
        <span>Reference code structure, naming conventions, and implementation patterns from {repo.name}</span>
      </div>
    );
  }

  return details;
}