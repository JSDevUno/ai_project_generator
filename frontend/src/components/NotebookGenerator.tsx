import { useState } from 'react';
import { NotebookForm } from './NotebookForm.js';
import { NotebookPlanDisplay, type NotebookPlan } from './NotebookPlanDisplay.js';
import { NotebookPreview } from './NotebookPreview.js';
import { LoadingSpinner } from './LoadingSpinner.js';
import type { ModelType } from './MLScriptGenerator.js';

type NotebookWorkflowState = 'input' | 'plan' | 'generating' | 'preview';

export function NotebookGenerator() {
    const [workflowState, setWorkflowState] = useState<NotebookWorkflowState>('input');
    const [, setInstruction] = useState('');
    const [selectedModel, setSelectedModel] = useState<ModelType>('kwaipilot/kat-coder-pro:free');
    const [notebookPlan, setNotebookPlan] = useState<NotebookPlan | null>(null);
    const [notebookJSON, setNotebookJSON] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleGeneratePlan = async (inst: string, model: ModelType) => {
        setIsLoading(true);
        setError(null);
        setLoadingProgress(0);
        setInstruction(inst);
        setSelectedModel(model);

        // Animated progress
        const progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
                const newProgress = prev + Math.random() * 8 + 3;
                return Math.min(95, newProgress);
            });
        }, 500);

        try {
            const apiBaseUrl = import.meta.env.PROD ? '/api' : 'http://localhost:3002/api';

            const response = await fetch(`${apiBaseUrl}/notebook/plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    instruction: inst,
                    model
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();

            // Complete the progress
            clearInterval(progressInterval);
            setLoadingProgress(100);

            // Small delay to show completion
            await new Promise(resolve => setTimeout(resolve, 300));

            setNotebookPlan(data.plan);
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

    const handleRevisePlan = async (feedback: string) => {
        if (!notebookPlan) return;

        setIsLoading(true);
        setError(null);
        setLoadingProgress(0);

        // Animated progress
        const progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
                const newProgress = prev + Math.random() * 8 + 3;
                return Math.min(95, newProgress);
            });
        }, 500);

        try {
            const apiBaseUrl = import.meta.env.PROD ? '/api' : 'http://localhost:3002/api';

            const response = await fetch(`${apiBaseUrl}/notebook/revise`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan: notebookPlan,
                    feedback,
                    model: selectedModel
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();

            // Complete the progress
            clearInterval(progressInterval);
            setLoadingProgress(100);

            // Small delay to show completion
            await new Promise(resolve => setTimeout(resolve, 300));

            setNotebookPlan(data.plan);
        } catch (err) {
            clearInterval(progressInterval);
            console.error('Plan revision failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to revise plan');
        } finally {
            setIsLoading(false);
            setLoadingProgress(0);
        }
    };

    const handleApprovePlan = async () => {
        if (!notebookPlan) return;

        // Immediately transition to preview state with loading
        setWorkflowState('generating');
        setIsLoading(true);
        setError(null);
        setLoadingProgress(0);

        // Animated progress
        const progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
                const newProgress = prev + Math.random() * 8 + 3;
                return Math.min(95, newProgress);
            });
        }, 500);

        try {
            const apiBaseUrl = import.meta.env.PROD ? '/api' : 'http://localhost:3002/api';

            const response = await fetch(`${apiBaseUrl}/notebook/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan: notebookPlan,
                    model: selectedModel
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();

            // Complete the progress
            clearInterval(progressInterval);
            setLoadingProgress(100);

            // Small delay to show completion
            await new Promise(resolve => setTimeout(resolve, 300));

            setNotebookJSON(data.notebook);
            setWorkflowState('preview');
        } catch (err) {
            clearInterval(progressInterval);
            console.error('Notebook generation failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate notebook');
            setWorkflowState('plan'); // Go back to plan on error
        } finally {
            setIsLoading(false);
            setLoadingProgress(0);
        }
    };

    const handleDownload = () => {
        if (!notebookJSON || !notebookPlan) return;

        const jsonString = JSON.stringify(notebookJSON, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${notebookPlan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ipynb`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const handleStartOver = () => {
        setWorkflowState('input');
        setInstruction('');
        setNotebookPlan(null);
        setNotebookJSON(null);
        setError(null);
    };

    const handleCancelPlan = () => {
        setWorkflowState('input');
        setNotebookPlan(null);
        setError(null);
    };

    return (
        <div className="py-6 sm:py-8 px-4 sm:px-8 lg:px-12">
            {error && (
                <div className="max-w-4xl mx-auto mb-6 p-6 bg-red-50 border-2 border-black rounded-sm shadow-[4px_4px_0_0_#000]">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-red-800 font-semibold">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {isLoading && workflowState !== 'generating' && (
                <LoadingSpinner
                    stage="plan"
                    progress={loadingProgress}
                    sessionId=""
                    isRealTime={false}
                />
            )}

            {!isLoading && workflowState === 'input' && (
                <NotebookForm onSubmit={handleGeneratePlan} />
            )}

            {!isLoading && workflowState === 'plan' && notebookPlan && (
                <NotebookPlanDisplay
                    plan={notebookPlan}
                    onApprove={handleApprovePlan}
                    onRevise={handleRevisePlan}
                    onCancel={handleCancelPlan}
                />
            )}

            {(workflowState === 'generating' || workflowState === 'preview') && notebookPlan && (
                <NotebookPreview
                    notebookJSON={notebookJSON}
                    notebookTitle={notebookPlan.title}
                    onDownload={handleDownload}
                    onStartOver={handleStartOver}
                    isGenerating={workflowState === 'generating'}
                />
            )}
        </div>
    );
}
