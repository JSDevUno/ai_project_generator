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
    <div className="flex flex-col items-center justify-center py-8 px-6">
      <div className="rounded-sm shadow-[4px_4px_0_0_#000] border-2 border-black p-10 max-w-lg w-full backdrop-blur-sm" style={{backgroundColor: '#FFFFFF'}}>
        {/* Icon and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-sm mb-6 shadow-[1px_1px_0_0_#000] border-2 border-black" style={{background: 'linear-gradient(to bottom right, #DBEAFE, #BFDBFE)'}}>
            <IconComponent className="h-10 w-10 animate-spin" style={{color: '#2563EB'}} />
          </div>
          <h3 className="text-xl font-bold mb-3" style={{color: '#0F172A'}}>
            {stageInfo.title}
          </h3>
          <p className="text-base leading-relaxed" style={{color: '#475569'}}>
            {stageInfo.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-3">
            <span className="font-medium">Progress</span>
            <span className="font-semibold">{Math.round(currentProgress)}%</span>
          </div>
          <div className="w-full rounded-sm h-3 shadow-[1px_1px_0_0_#000] border-2 border-black" style={{backgroundColor: '#E5E7EB'}}>
            <div
              className="h-3 rounded-sm transition-all duration-500 ease-out shadow-sm"
              style={{ 
                width: `${currentProgress}%`,
                backgroundColor: '#2563EB'
              }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${step.completed
                ? 'bg-green-100 text-green-600 shadow-sm'
                : 'bg-gray-100 text-gray-400'
                }`}>
                {step.completed ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <div className="w-3 h-3 bg-current rounded-sm border border-black" />
                )}
              </div>
              <span className={`text-base font-medium transition-colors duration-200 ${step.completed ? 'text-gray-900' : 'text-gray-500'
                }`}>
                {step.name}
              </span>
            </div>
          ))}
        </div>

        {/* Connection Status & Estimated Time */}
        <div className="mt-8 text-center">
          {isRealTime && (
            <div className={`inline-flex items-center text-sm px-3 py-2 rounded-xl mb-3 font-medium ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
              <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
              {isConnected ? 'Live Progress Connected' : 'Connection Lost'}
            </div>
          )}
          <p className="text-sm text-gray-500">
            {stage === 'project' ? 'This usually takes 1-2 minutes' : 'This usually takes 30-60 seconds'}
          </p>
        </div>
      </div>
    </div>
  );
}