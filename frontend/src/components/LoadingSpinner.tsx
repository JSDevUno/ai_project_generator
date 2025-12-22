import { Loader2, Brain, FolderOpen, CheckCircle, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  stage?: 'plan' | 'project';
  progress?: number;
  sessionId?: string;
  isRealTime?: boolean;
}

interface ProgressData {
  type: string;
  message: string;
  currentFile?: number;
  totalFiles?: number;
  progress?: number;
  fileInfo?: {
    path: string;
    type: string;
    description?: string;
    size?: string;
    duration?: string;
  };
}

export function LoadingSpinner({ 
  stage = 'plan', 
  progress = 0, 
  sessionId, 
  isRealTime = false 
}: LoadingSpinnerProps) {
  const [realTimeProgress, setRealTimeProgress] = useState<ProgressData | null>(null);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  // Real-time progress updates via SSE
  useEffect(() => {
    if (!isRealTime || !sessionId) return;

    const getBaseUrl = () => {
      if (import.meta.env.PROD) {
        return '';
      }
      return import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
    };

    const baseUrl = getBaseUrl();
    const eventSource = new EventSource(`${baseUrl}/api/code/generate/progress/${sessionId}`);
    
    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressData = JSON.parse(event.data);
        setRealTimeProgress(data);
        
        if (data.fileInfo?.path) {
          setCurrentFile(data.fileInfo.path);
        }
      } catch (error) {
        console.error('Error parsing progress data:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId, isRealTime]);

  const getStageInfo = () => {
    if (isRealTime && realTimeProgress) {
      return {
        title: realTimeProgress.message || 'Generating Complete Project',
        description: currentFile ? `Creating ${currentFile}...` : 'Creating folder structure, Python files, documentation, and packaging as ZIP...',
        icon: FileText
      };
    }

    switch (stage) {
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

  // Use real-time progress if available, otherwise use prop progress
  const currentProgress = realTimeProgress?.progress ?? progress;

  const getSteps = () => {
    if (isRealTime && realTimeProgress) {
      // Real-time steps based on actual progress
      return [
        { name: 'Analyzing Project Structure', completed: currentProgress > 5 },
        { name: 'Generating Python Files', completed: currentProgress > 20 },
        { name: 'Creating Configuration Files', completed: currentProgress > 60 },
        { name: 'Building Documentation', completed: currentProgress > 80 },
        { name: 'Packaging ZIP File', completed: currentProgress > 95 }
      ];
    }

    // Original static steps
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

        {/* Real-time file info */}
        {isRealTime && realTimeProgress?.fileInfo && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm text-blue-700">{realTimeProgress.fileInfo.path}</p>
                <p className="text-xs text-blue-600">{realTimeProgress.fileInfo.description}</p>
              </div>
              {realTimeProgress.fileInfo.size && (
                <div className="text-right text-xs text-blue-600">
                  <p>{realTimeProgress.fileInfo.size}</p>
                  {realTimeProgress.fileInfo.duration && <p>{realTimeProgress.fileInfo.duration}</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Progress</span>
            <span>{Math.round(currentProgress)}%</span>
            {isRealTime && realTimeProgress?.currentFile && realTimeProgress?.totalFiles && (
              <span>({realTimeProgress.currentFile}/{realTimeProgress.totalFiles} files)</span>
            )}
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
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                step.completed 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {step.completed ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <div className="w-2 h-2 bg-current rounded-full" />
                )}
              </div>
              <span className={`text-sm ${
                step.completed ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step.name}
              </span>
            </div>
          ))}
        </div>

        {/* Connection Status & Estimated Time */}
        <div className="mt-6 text-center">
          {isRealTime && (
            <div className={`inline-flex items-center text-xs px-2 py-1 rounded mb-2 ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
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