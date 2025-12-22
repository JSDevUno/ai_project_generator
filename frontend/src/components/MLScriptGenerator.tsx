import { useState } from 'react';
import { ProjectForm } from './ProjectForm.js';
import { PlanDisplay } from './PlanDisplay.js';
import { LoadingSpinner } from './LoadingSpinner.js';
import { apiService } from '../services/api.js';
import { Brain } from 'lucide-react';

export type WorkflowState = 'input' | 'plan' | 'approved' | 'complete';
export type ModelType = 'kwaipilot/kat-coder-pro:free' | 'openai/gpt-oss-120b:free' | 'openai/gpt-oss-20b:free' | 'meta-llama/llama-3-8b-instruct:free' | 'mistralai/mixtral-8x7b-instruct:free' | 'mistralai/mistral-7b-instruct:free' | 'openai/gpt-oss-120b';

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
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState<'plan' | 'project'>('plan');
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [progressSessionId, setProgressSessionId] = useState<string>('');

    const simulateProgress = (stage: 'plan' | 'project', duration: number) => {
        setLoadingStage(stage);
        setLoadingProgress(0);
        
        const steps = stage === 'plan' ? [30, 60, 90, 100] : [20, 40, 60, 80, 95, 100];
        const stepDuration = duration / steps.length;
        
        steps.forEach((progress, index) => {
            setTimeout(() => {
                setLoadingProgress(progress);
            }, stepDuration * (index + 1));
        });
    };

    const handleGeneratePlan = async (config: ProjectConfig) => {
        setIsLoading(true);
        setError(null);
        simulateProgress('plan', 4000); // 4 second simulation

        try {
            const plan = await apiService.generatePlan(config);
            setProjectConfig(config);
            setGeneratedPlan(plan);
            setWorkflowState('plan');
        } catch (err) {
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
        simulateProgress('plan', 4000);

        try {
            const improvedPlan = await apiService.rethinkPlan(projectConfig, feedback);
            setGeneratedPlan(improvedPlan);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to rethink plan');
        } finally {
            setIsLoading(false);
            setLoadingProgress(0);
        }
    };

    const handleApprovePlan = async () => {
        if (!generatedPlan) return;

        // Generate unique session ID for progress tracking
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setProgressSessionId(sessionId);
        setIsLoading(true);
        setLoadingStage('project');
        setError(null);

        try {
            await apiService.generateProjectWithProgress(projectConfig, generatedPlan.content, sessionId);
            setWorkflowState('complete');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate project');
        } finally {
            setIsLoading(false);
            setLoadingProgress(0);
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
        setError(null);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-semibold text-gray-900">
                            Universal AI Project Generator
                        </h1>
                    </div>

                    {workflowState !== 'input' && (
                        <button
                            onClick={handleStartOver}
                            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Start Over
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="py-8 px-6">
                <div className="max-w-4xl mx-auto">
                {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-800">
                                    {error}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {isLoading && (
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
                                                    Your project includes a complete folder structure with training scripts, 
                                                    inference code, configuration files, and documentation. Extract the ZIP 
                                                    file and follow the README instructions to get started.
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