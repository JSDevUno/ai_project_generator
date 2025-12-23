import { useState } from 'react';
import { ProjectForm } from './ProjectForm.js';
import { PlanDisplay } from './PlanDisplay.js';
import { CodePreview, type PreviewFile } from './CodePreview.js';
import { LoadingSpinner } from './LoadingSpinner.js';
import { apiService } from '../services/api.js';
import { Brain } from 'lucide-react';

export type WorkflowState = 'input' | 'plan' | 'generating' | 'preview' | 'complete';
export type ModelType = 'kwaipilot/kat-coder-pro:free' | 'meta-llama/llama-4-maverick:free' | 'qwen/qwen3-coder:free' | 'openai/gpt-oss-120b:free' | 'openai/gpt-oss-20b:free' | 'meta-llama/llama-3-8b-instruct:free' | 'mistralai/mixtral-8x7b-instruct:free' | 'mistralai/mistral-7b-instruct:free' | 'openai/gpt-oss-120b';

export interface ProjectConfig {
    projectName: string;
    instruction: string;
    model?: ModelType;
}

export interface GeneratedPlan {
    content: string;
    projectName: string;
    instruction: string;
}

export function MLScriptGenerator() {
    const [workflowState, setWorkflowState] = useState<WorkflowState>('input');
    const [projectConfig, setProjectConfig] = useState<ProjectConfig>({
        projectName: '',
        instruction: '',
        model: 'kwaipilot/kat-coder-pro:free'
    });
    const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
    const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState<'plan' | 'project'>('plan');
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [progressSessionId, setProgressSessionId] = useState<string>('');

    const handleGeneratePlan = async (config: ProjectConfig) => {
        setIsLoading(true);
        setError(null);
        setLoadingStage('plan');
        setLoadingProgress(0);

        // Simple progress animation to show activity
        const progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
                const newProgress = prev + Math.random() * 8 + 3;
                return Math.min(95, newProgress); // Cap at 95%
            });
        }, 500);

        try {
            console.log('Calling API with config:', config);
            const plan = await apiService.generatePlan(config);
            console.log('Plan generated successfully:', plan);

            // Complete the progress
            clearInterval(progressInterval);
            setLoadingProgress(100);

            // Small delay to show completion
            await new Promise(resolve => setTimeout(resolve, 300));

            setProjectConfig(config);
            setGeneratedPlan(plan);
            setWorkflowState('plan');
        } catch (err) {
            clearInterval(progressInterval);
            console.error('Plan generation failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate plan');
        } finally {
            setIsLoading(false);
            setLoadingProgress(0);
        }
    };

    const handleRethinkPlan = async (feedback?: string) => {
        if (!generatedPlan) return;

        setIsLoading(true);
        setError(null);
        setLoadingStage('plan');
        setLoadingProgress(0);

        // Simple progress animation to show activity
        const progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
                const newProgress = prev + Math.random() * 8 + 3;
                return Math.min(95, newProgress); // Cap at 95%
            });
        }, 500);

        try {
            console.log('Rethinking plan with feedback:', feedback);
            const improvedPlan = await apiService.rethinkPlan(projectConfig, feedback);
            console.log('Plan rethought successfully:', improvedPlan);

            // Complete the progress
            clearInterval(progressInterval);
            setLoadingProgress(100);

            // Small delay to show completion
            await new Promise(resolve => setTimeout(resolve, 300));

            setGeneratedPlan(improvedPlan);
        } catch (err) {
            clearInterval(progressInterval);
            console.error('Plan rethinking failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to rethink plan');
        } finally {
            setIsLoading(false);
            setLoadingProgress(0);
        }
    };

    const handleApprovePlan = async () => {
        console.log('🚀 handleApprovePlan called');
        console.log('📋 generatedPlan:', generatedPlan);

        if (!generatedPlan) {
            console.error('❌ No generated plan found');
            setError('No plan available to generate code from');
            return;
        }

        try {
            console.log('✅ Starting real-time code generation...');
            await startRealTimeGeneration(generatedPlan.content);
        } catch (error) {
            console.error('❌ Error in handleApprovePlan:', error);
            setError(error instanceof Error ? error.message : 'Failed to start code generation');
        }
    };

    const startRealTimeGeneration = async (plan: string) => {
        console.log('startRealTimeGeneration called with plan:', plan.substring(0, 100) + '...');

        setWorkflowState('generating');
        setIsLoading(true);
        setError(null);

        // Generate unique session ID for progress tracking
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setProgressSessionId(sessionId);

        console.log('Session ID:', sessionId);
        console.log('Workflow state set to generating');

        try {
            // Initialize preview files based on plan
            console.log('Extracting expected files from plan...');
            const expectedFiles = extractExpectedFiles(plan);
            console.log('Expected files:', expectedFiles);

            const initialPreviewFiles: PreviewFile[] = expectedFiles.map(filename => ({
                filename,
                content: '',
                language: getLanguageFromFilename(filename),
                status: 'pending'
            }));

            setPreviewFiles(initialPreviewFiles);
            setWorkflowState('preview');

            console.log('Preview files initialized:', initialPreviewFiles);
            console.log('Starting real project generation...');

            // REAL implementation: Generate project with progress tracking
            await generateProjectWithRealTimeUpdates(plan, sessionId);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate project');
            setWorkflowState('plan');
        } finally {
            setIsLoading(false);
            setLoadingProgress(0);
        }
    };

    const generateProjectWithRealTimeUpdates = async (plan: string, sessionId: string) => {
        console.log('🔄 generateProjectWithRealTimeUpdates called');
        console.log('📝 Plan length:', plan.length);
        console.log('🆔 Session ID:', sessionId);
        console.log('⚙️ Project config:', projectConfig);

        try {
            console.log('📡 Making request to streaming API...');

            // Get the correct API base URL for the environment
            const apiBaseUrl = import.meta.env.PROD ? '/api' : 'http://localhost:3002/api';
            
            // Call the real API to generate project files
            const response = await fetch(`${apiBaseUrl}/stream/generate-stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectName: projectConfig.projectName,
                    instruction: projectConfig.instruction,
                    plan: plan,
                    model: projectConfig.model,
                    sessionId: sessionId
                })
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error:', errorText);
                throw new Error(`Generation failed: ${response.status} - ${errorText}`);
            }

            console.log('✅ Starting to read streaming response...');

            // Handle streaming response for real-time updates
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No response stream available');
            }

            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    console.log('✅ Streaming completed');
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim() && line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            handleStreamUpdate(data);
                        } catch (e) {
                            console.warn('Failed to parse stream data:', line);
                        }
                    }
                }
            }

            setWorkflowState('complete');
            setIsLoading(false);

        } catch (error) {
            console.error('Real-time generation error:', error);
            throw error;
        }
    };

    const handleStreamUpdate = (data: any) => {
        if (data.type === 'file_start') {
            // File generation started
            setPreviewFiles(prev => prev.map(f =>
                f.filename === data.filename
                    ? { ...f, status: 'generating' }
                    : f
            ));
        } else if (data.type === 'file_complete') {
            // File generation completed
            setPreviewFiles(prev => prev.map(f =>
                f.filename === data.filename
                    ? {
                        ...f,
                        content: data.content,
                        status: 'complete',
                        size: data.content.length
                    }
                    : f
            ));
        } else if (data.type === 'progress') {
            // Update overall progress
            setLoadingProgress(data.progress);
        } else if (data.type === 'error') {
            // Handle file generation error
            setPreviewFiles(prev => prev.map(f =>
                f.filename === data.filename
                    ? { ...f, status: 'error' }
                    : f
            ));
        }
    };

    const handleDownloadAll = async () => {
        try {
            console.log('🔽 Starting download...', { projectName: projectConfig.projectName, sessionId: progressSessionId });

            // Check if generation is complete
            if (workflowState !== 'complete') {
                setError('Please wait for code generation to complete before downloading.');
                return;
            }

            // Get the correct API base URL for the environment
            const apiBaseUrl = import.meta.env.PROD ? '/api' : 'http://localhost:3002/api';

            // Generate and download actual ZIP file
            const response = await fetch(`${apiBaseUrl}/stream/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectName: projectConfig.projectName,
                    sessionId: progressSessionId
                })
            });

            console.log('📡 Download response:', response.status, response.statusText);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || `Download failed: ${response.status}`;

                if (response.status === 404) {
                    throw new Error('Project not ready yet. Please wait for generation to complete.');
                } else {
                    throw new Error(errorMessage);
                }
            }

            // Download the ZIP file
            const blob = await response.blob();
            console.log('📦 ZIP blob size:', blob.size, 'bytes');

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectConfig.projectName}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            console.log('✅ Download completed successfully');
        } catch (err) {
            console.error('❌ Download failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to download files');
        }
    };

    const handleStartOver = () => {
        setWorkflowState('input');
        setProjectConfig({
            projectName: '',
            instruction: '',
            model: 'kwaipilot/kat-coder-pro:free'
        });
        setGeneratedPlan(null);
        setPreviewFiles([]);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="border-b border-gray-200 bg-white">
                <div className="flex items-center px-4 sm:px-6 py-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                            AI Project Generator
                        </h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="py-4 sm:py-8 px-2 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    {error && (
                        <div className="mb-4 sm:mb-8 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-2 sm:ml-3">
                                    <p className="text-xs sm:text-sm text-red-800">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {isLoading && workflowState !== 'preview' && workflowState !== 'complete' && (
                        <LoadingSpinner
                            stage={loadingStage}
                            progress={loadingProgress}
                            sessionId={progressSessionId}
                            isRealTime={loadingStage === 'project'}
                        />
                    )}

                    {workflowState === 'input' && !isLoading && (
                        <ProjectForm onSubmit={handleGeneratePlan} />
                    )}

                    {workflowState === 'plan' && generatedPlan && !isLoading && (
                        <PlanDisplay
                            plan={generatedPlan}
                            onApprove={handleApprovePlan}
                            onRethink={handleRethinkPlan}
                        />
                    )}

                    {(workflowState === 'preview' || workflowState === 'complete') && (
                        <CodePreview
                            files={previewFiles}
                            onDownloadAll={handleDownloadAll}
                            isGenerating={workflowState === 'preview' && isLoading}
                        />
                    )}

                    {workflowState === 'complete' && !isLoading && (
                        <div className="max-w-6xl mx-auto">
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                Project Generated Successfully!
                                            </h2>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Your complete AI project has been downloaded as a ZIP file
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-6">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-green-800">
                                                    Complete AI Project Generated
                                                </h3>
                                                <div className="mt-2 text-sm text-green-700">
                                                    <p>
                                                        Your project has been generated successfully. Download the ZIP file to get your complete project with all the files and structure as planned.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                    <button
                                        onClick={handleStartOver}
                                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Generate Another Project
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

// Helper functions
function extractExpectedFiles(plan: string): string[] {
    const files = new Set<string>();

    // Extract files from plan using more precise patterns
    const lines = plan.split('\n');

    for (const line of lines) {
        // Match tree structure patterns like "├── filename.ext" or "└── filename.ext"
        const treeMatch = line.match(/^[\s│├└─]*([a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+)(?:\s*#.*)?$/);
        if (treeMatch) {
            const filename = treeMatch[1].trim();
            if (filename && filename.includes('.')) {
                files.add(filename);
            }
        }

        // Match files mentioned in text like "train.py" or "`train.py`"
        const fileMatches = line.match(/`?([a-zA-Z0-9_-]+\.(py|js|ts|json|md|txt|yml|yaml|dockerfile|sh))`?/g);
        if (fileMatches) {
            fileMatches.forEach(match => {
                const cleanFile = match.replace(/[`]/g, '').trim();
                if (cleanFile && cleanFile.includes('.')) {
                    files.add(cleanFile);
                }
            });
        }
    }

    const extractedFiles = Array.from(files);
    console.log('📄 Frontend extracted files from plan:', extractedFiles);

    return extractedFiles;
}

function getLanguageFromFilename(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
        'py': 'python',
        'js': 'javascript',
        'ts': 'typescript',
        'json': 'json',
        'yaml': 'yaml',
        'yml': 'yaml',
        'md': 'markdown',
        'txt': 'text',
        'sh': 'bash',
        'dockerfile': 'dockerfile'
    };
    return langMap[ext || ''] || 'text';
}