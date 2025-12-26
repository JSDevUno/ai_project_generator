import { Loader2, Brain, FolderOpen, CheckCircle, Search, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  stage?: 'plan' | 'github-search' | 'github-analysis' | 'project';
  progress?: number;
  sessionId?: string;
  isRealTime?: boolean;
}

export function LoadingSpinner({
  stage = 'plan',
  progress = 0,
  sessionId,
  isRealTime = false
}: LoadingSpinnerProps) {
  const [isConnected, setIsConnected] = useState(false);

  // Real-time progress updates are handled by the parent component
  // No need for separate SSE connection since streaming is handled in MLScriptGenerator
  useEffect(() => {
    if (isRealTime && sessionId) {
      setIsConnected(true); // Assume connected since parent is handling the stream
    }
  }, [sessionId, isRealTime]);

  const getStageInfo = () => {
    switch (stage) {
      case 'github-search':
        return {
          title: 'Searching GitHub Repositories',
          description: 'Finding relevant repositories that match your project requirements...',
          icon: Search
        };
      case 'github-analysis':
        return {
          title: 'Analyzing Repository Implementations',
          description: 'Examining code structure, architecture patterns, and best practices...',
          icon: BarChart3
        };
      case 'plan':
        return {
          title: 'Generating AI Project Plan',
          description: 'Analyzing your requirements and creating a comprehensive project plan...',
          icon: Brain
        };
      case 'project':
        return {
          title: 'Generating Complete Project',
          description: 'Creating folder structure, Python files, documentation, and packaging as ZIP...',
          icon: FolderOpen
        };
      default:
        return {
          title: 'Processing',
          description: 'Working on your request...',
          icon: Loader2
        };
    }
  };

  const stageInfo = getStageInfo();
  const IconComponent = stageInfo.icon;

  // Use progress prop since real-time updates are handled by parent
  const currentProgress = progress;

  const getSteps = () => {
    // Static steps based on stage
    return stage === 'project' ? [
      { name: 'Analyzing Project Structure', completed: currentProgress > 20 },
      { name: 'Generating Training Scripts', completed: currentProgress > 40 },
      { name: 'Creating Inference Code', completed: currentProgress > 60 },
      { name: 'Building Documentation', completed: currentProgress > 80 },
      { name: 'Packaging ZIP File', completed: currentProgress > 95 }
    ] : [
      { name: 'Analyzing Requirements', completed: currentProgress > 30 },
      { name: 'Designing Architecture', completed: currentProgress > 60 },
      { name: 'Creating Implementation Plan', completed: currentProgress > 90 }
    ];
  };

  const steps = getSteps();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* Icon and Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <IconComponent className="h-8 w-8 animate-spin text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {stageInfo.title}
          </h3>
          <p className="text-sm text-gray-600">
            {stageInfo.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Progress</span>
            <span>{Math.round(currentProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${step.completed
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400'
                }`}>
                {step.completed ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <div className="w-2 h-2 bg-current rounded-full" />
                )}
              </div>
              <span className={`text-sm ${step.completed ? 'text-gray-900' : 'text-gray-500'
                }`}>
                {step.name}
              </span>
            </div>
          ))}
        </div>

        {/* Connection Status & Estimated Time */}
        <div className="mt-6 text-center">
          {isRealTime && (
            <div className={`inline-flex items-center text-xs px-2 py-1 rounded mb-2 ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
              {isConnected ? 'Live Progress Connected' : 'Connection Lost'}
            </div>
          )}
          <p className="text-xs text-gray-500">
            {stage === 'project' ? 'This usually takes 1-2 minutes' : 'This usually takes 30-60 seconds'}
          </p>
        </div>
      </div>
    </div>
  );
}