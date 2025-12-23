import { useState } from 'react';
import type { GeneratedPlan } from './MLScriptGenerator.js';
import { Info } from 'lucide-react';

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
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                AI Project Plan: {plan.projectName}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Complete project structure and implementation plan
              </p>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Plan Generated
              </span>
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="text-sm">
            <span className="font-medium text-gray-700">Project Description:</span>
            <p className="mt-1 text-gray-600">{plan.instruction}</p>
          </div>
        </div>

        {/* Plan Content - Now properly formatted */}
        <div className="px-6 py-6">
          <div className="prose prose-sm max-w-none">
            <div
              className="bg-white rounded-lg p-6 border border-gray-200"
              dangerouslySetInnerHTML={{ __html: formattedPlan }}
            />
          </div>
        </div>

        {/* Feedback Section */}
        {showFeedback && (
          <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-200">
            <div className="w-full">
              <h3 className="text-sm font-medium text-yellow-800 mb-2 text-center">
                Customize Your Project Plan
              </h3>
              <p className="text-xs text-yellow-700 mb-3 text-center">
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
                rows={5}
                className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
              />
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-3 space-y-2 sm:space-y-0">
                <p className="text-xs text-yellow-600 text-center sm:text-left">
                  💡 Be specific about what you want - the AI will adapt the entire plan accordingly
                </p>
                <div className="flex justify-center sm:justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowFeedback(false);
                      setFeedback('');
                    }}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRethinkWithFeedback}
                    disabled={!feedback.trim()}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${feedback.trim()
                        ? 'text-white bg-yellow-600 hover:bg-yellow-700'
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
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {showFeedback ? 'Hide Customization' : 'Customize Plan'}
          </button>

          <button
            onClick={onApprove}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Generate Code →
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Review Your AI Project Plan
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Your AI project plan is ready! You have two options:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li><strong>Customize Plan:</strong> Click to request specific changes, additions, or modifications</li>
                <li><strong>Approve & Generate:</strong> Create the complete project with the current plan</li>
              </ul>
              <p className="mt-2 text-xs text-blue-600">
                💡 The customization feature lets you fine-tune every aspect of your project before generation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}