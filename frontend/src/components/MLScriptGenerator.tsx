import { useState } from 'react';
import { ProjectForm } from './ProjectForm.js';
import { PlanDisplay } from './PlanDisplay.js';
import { CodePreview, type PreviewFile } from './CodePreview.js';
import { LoadingSpinner } from './LoadingSpinner.js';
import { apiService } from '../services/api.js';

export type WorkflowState = 'input' | 'plan' | 'generating' | 'preview' | 'complete';
export type ModelType =
    | 'kwaipilot/kat-coder-pro:free'
    | 'mistralai/devstral-2512:free'
    | 'xiaomi/mimo-v2-flash:free'
    | 'nvidia/nemotron-3-nano-30b-a3b:free'
    | 'qwen/qwen3-coder:free'
    | 'deepseek/deepseek-r1-0528:free'
    | 'mistralai/mistral-small-3.1-24b-instruct:free'
    | 'mistralai/mistral-7b-instruct:free'
    | 'meta-llama/llama-3.3-70b-instruct:free'
    | 'google/gemma-3-27b-it:free'
    | 'z-ai/glm-4.5-air:free';

export interface ProjectConfig {
    projectName: string;
    instruction: string;
    model?: ModelType;
    enableGitHubSearch?: boolean;
}

export interface Repository {
    name: string;
    fullName: string;
    description: string;
    url: string;
    stars: number;
    forks: number;
    language: string;
    topics: string[];
    keyFeatures: string[];
    architecture: string;
    techStack: string[];
    relevanceScore: number;
    rank: number;
    reasoning: string;
}

export interface GeneratedPlan {
    content: string;
    projectName: string;
    instruction: string;
    repositories?: Repository[];
    searchEnabled?: boolean;
}

export function MLScriptGenerator() {
    const [workflowState, setWorkflowState] = useState<WorkflowState>('input');
    const [projectConfig, setProjectConfig] = useState<ProjectConfig>({
        projectName: '',
        instruction: '',
        model: 'kwaipilot/kat-coder-pro:free',
        enableGitHubSearch: false
    });
    const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
    const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState<'plan' | 'github-search' | 'github-analysis' | 'project'>('plan');
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [progressSessionId, setProgressSessionId] = useState<string>('');

    const handleGeneratePlan = async (config: ProjectConfig) => {
        setIsLoading(true);
        setError(null);
        setLoadingStage('plan');
        setLoadingProgress(0);

        // Enhanced progress animation for GitHub search
        const progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
                const newProgress = prev + Math.random() * 8 + 3;
                return Math.min(95, newProgress); // Cap at 95%
            });
        }, 500);

        // Update loading stage if GitHub search is enabled
        if (config.enableGitHubSearch) {
            setTimeout(() => setLoadingStage('github-search'), 1000);
            setTimeout(() => setLoadingStage('github-analysis'), 3000);
            setTimeout(() => setLoadingStage('plan'), 5000);
        }

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

        // Enhanced progress animation for GitHub search
        const progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
                const newProgress = prev + Math.random() * 8 + 3;
                return Math.min(95, newProgress); // Cap at 95%
            });
        }, 500);

        // Update loading stage if GitHub search is enabled
        if (projectConfig.enableGitHubSearch) {
            setTimeout(() => setLoadingStage('github-search'), 1000);
            setTimeout(() => setLoadingStage('github-analysis'), 3000);
            setTimeout(() => setLoadingStage('plan'), 5000);
        }

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

            console.log('📋 Initialized preview files:', initialPreviewFiles.map(f => f.filename));
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
            // Get the correct API base URL for the environment
            const apiBaseUrl = import.meta.env.PROD ? '/api' : 'http://localhost:3002/api';

            console.log('📡 Making request to streaming API...');
            console.log('📡 Request URL:', `${apiBaseUrl}/stream/generate-stream`);
            console.log('📡 Request body:', {
                projectName: projectConfig.projectName,
                instruction: projectConfig.instruction,
                plan: plan.substring(0, 100) + '...',
                model: projectConfig.model,
                sessionId: sessionId
            });

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
            let lastActivity = Date.now();
            const TIMEOUT_MS = 10000; // Increased to 10 second timeout
            let eventCount = 0;
            let maxEvents = 1000; // Prevent infinite loops

            // Set up a timeout to detect if streaming stops
            const timeoutCheck = setInterval(() => {
                const now = Date.now();
                if (now - lastActivity > TIMEOUT_MS) {
                    console.warn('⚠️ Streaming timeout detected, no data received for 10 seconds');
                    clearInterval(timeoutCheck);
                    // Don't throw error, just log and continue
                }
            }, 2000); // Check every 2 seconds

            try {
                while (true) {
                    // Safety check to prevent infinite loops
                    if (eventCount > maxEvents) {
                        console.warn('⚠️ Maximum event count reached, stopping stream processing');
                        break;
                    }

                    const { done, value } = await reader.read();

                    if (done) {
                        console.log('✅ Streaming completed');
                        clearInterval(timeoutCheck);
                        break;
                    }

                    lastActivity = Date.now();
                    eventCount++;

                    const chunk = decoder.decode(value, { stream: true });
                    console.log('📦 Received chunk:', chunk.substring(0, 100) + (chunk.length > 100 ? '...' : ''));

                    buffer += chunk;
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.trim() && line.startsWith('data: ')) {
                            try {
                                const jsonData = line.slice(6);
                                const data = JSON.parse(jsonData);
                                console.log('📨 Received stream data:', data.type, data.filename || '');

                                // Handle different message types
                                if (data.type === 'heartbeat') {
                                    console.log('💓 Heartbeat received');
                                } else if (data.type === 'connected') {
                                    console.log('🔗 Stream connected');
                                } else {
                                    // Add small delay to prevent race conditions
                                    setTimeout(() => handleStreamUpdate(data), 10);
                                }
                            } catch (e) {
                                console.warn('Failed to parse stream data:', line.substring(0, 50), 'Error:', e);
                                // Continue processing other lines instead of failing
                            }
                        }
                    }
                }
            } catch (streamError) {
                console.error('Stream processing error:', streamError);
                clearInterval(timeoutCheck);
                // Don't re-throw, handle gracefully
                setError('Streaming connection interrupted. Generation may be incomplete.');
            } finally {
                clearInterval(timeoutCheck);
            }

            setWorkflowState('complete');
            setIsLoading(false);

        } catch (error) {
            console.error('Real-time generation error:', error);
            throw error;
        }
    };

    const handleStreamUpdate = (data: any) => {
        console.log('🔄 Processing stream update:', data);

        if (data.type === 'file_start') {
            console.log('📄 File generation started:', data.filename);

            setPreviewFiles(prev => {
                const updated = [...prev];
                const matchIndex = findFileMatch(updated, data.filename);

                if (matchIndex !== -1) {
                    updated[matchIndex] = { ...updated[matchIndex], status: 'generating' as const };
                    console.log('✅ Found matching file, setting to generating:', updated[matchIndex].filename);
                } else {
                    // Add new file if not found
                    updated.push({
                        filename: data.filename,
                        content: '',
                        language: getLanguageFromFilename(data.filename),
                        status: 'generating' as const
                    });
                    console.log('➕ Added new file to preview list:', data.filename);
                }

                return updated;
            });
        } else if (data.type === 'file_complete') {
            console.log('✅ File generation completed:', data.filename);

            setPreviewFiles(prev => {
                const updated = [...prev];
                const matchIndex = findFileMatch(updated, data.filename);

                if (matchIndex !== -1) {
                    updated[matchIndex] = {
                        ...updated[matchIndex],
                        content: data.content || '',
                        status: 'complete' as const,
                        size: data.content?.length || 0
                    };
                    console.log('✅ Found matching file, setting to complete:', updated[matchIndex].filename);
                } else {
                    // Add completed file if not found
                    updated.push({
                        filename: data.filename,
                        content: data.content || '',
                        language: getLanguageFromFilename(data.filename),
                        status: 'complete' as const,
                        size: data.content?.length || 0
                    });
                    console.log('➕ Added completed file to preview list:', data.filename);
                }

                return updated;
            });
        } else if (data.type === 'progress') {
            console.log('📊 Progress update:', data.progress);
            if (typeof data.progress === 'number' && data.progress >= 0 && data.progress <= 100) {
                setLoadingProgress(data.progress);
            }
        } else if (data.type === 'error') {
            console.error('❌ Stream error:', data);
            setPreviewFiles(prev => {
                const updated = [...prev];
                const matchIndex = findFileMatch(updated, data.filename);

                if (matchIndex !== -1) {
                    updated[matchIndex] = { ...updated[matchIndex], status: 'error' as const };
                }

                return updated;
            });
        } else {
            console.log('📨 Unknown stream update type:', data.type, data);
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
            model: 'kwaipilot/kat-coder-pro:free',
            enableGitHubSearch: false
        });
        setGeneratedPlan(null);
        setPreviewFiles([]);
        setError(null);
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#F7F9FC' }}>
            {/* Main Content */}
            <main className="py-6 sm:py-12 px-4 sm:px-8 lg:px-12">
                <div className="max-w-5xl mx-auto">
                    {error && (
                        <div className="mb-6 sm:mb-10 p-6 sm:p-8 bg-red-50 border-2 border-black rounded-sm shadow-[4px_4px_0_0_#000] transition-shadow duration-300 backdrop-blur-sm">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-4 sm:ml-5">
                                    <p className="text-sm sm:text-base text-red-800 font-semibold">
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
                            <div className="bg-white rounded-sm border-2 border-black shadow-[4px_4px_0_0_#000] backdrop-blur-md overflow-hidden">
                                <div className="px-6 sm:px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                                                Project Generated Successfully!
                                            </h2>
                                            <p className="text-sm sm:text-base text-gray-600">
                                                Your complete AI project has been downloaded as a ZIP file
                                            </p>
                                        </div>
                                        <div className="hidden sm:block">
                                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 sm:px-8 py-8">
                                    <div className="border-2 border-black rounded-sm p-6 shadow-[3px_3px_0_0_#000]" style={{ background: 'linear-gradient(to bottom right, #DCFCE7, #BBF7D0)' }}>
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-4">
                                                <h3 className="text-lg font-semibold mb-2" style={{ color: '#15803D' }}>
                                                    Complete AI Project Generated
                                                </h3>
                                                <div className="text-sm sm:text-base leading-relaxed" style={{ color: '#166534' }}>
                                                    <p>
                                                        Your project has been generated successfully. Download the ZIP file to get your complete project with all the files and structure as planned.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 sm:px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-100">
                                    <button
                                        onClick={handleStartOver}
                                        className="w-full inline-flex justify-center items-center px-6 py-3 border-2 border-black text-base font-medium rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-[2px_2px_0_0_#000] transform hover:-translate-y-0.5 transition-all duration-200"
                                        style={{ backgroundColor: '#2563EB' }}
                                        onMouseEnter={(e) => {
                                            const target = e.target as HTMLButtonElement;
                                            target.style.backgroundColor = '#1D4ED8';
                                        }}
                                        onMouseLeave={(e) => {
                                            const target = e.target as HTMLButtonElement;
                                            target.style.backgroundColor = '#2563EB';
                                        }}
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
function findFileMatch(files: PreviewFile[], targetFilename: string): number {
    if (!targetFilename) return -1;

    // 1. Try exact match first
    for (let i = 0; i < files.length; i++) {
        if (files[i].filename === targetFilename) {
            return i;
        }
    }

    // 2. Try basename match (ignore paths)
    const targetBasename = targetFilename.split('/').pop() || '';
    for (let i = 0; i < files.length; i++) {
        const fileBasename = files[i].filename.split('/').pop() || '';
        if (fileBasename === targetBasename && fileBasename) {
            return i;
        }
    }

    // 3. Try cleaned filename match
    const cleanTarget = cleanFileName(targetFilename);
    for (let i = 0; i < files.length; i++) {
        const cleanFile = cleanFileName(files[i].filename);
        if (cleanFile === cleanTarget && cleanTarget) {
            return i;
        }
    }

    return -1; // No match found
}

function extractExpectedFiles(plan: string): string[] {
    const files = new Set<string>();

    // Extract files from plan using comprehensive patterns
    const lines = plan.split('\n');

    for (const line of lines) {
        // Skip empty lines and obvious headers
        if (!line.trim() || line.trim().startsWith('#') || line.includes('Project Structure') || line.includes('Overview')) {
            continue;
        }

        // Pattern 1: Tree structure patterns like "├── path/filename.ext" or "└── filename.ext"
        const treeMatch = line.match(/^[\s│├└─]*([a-zA-Z0-9_./\-]+\.[a-zA-Z0-9]+)(?:\s*[#(].*)?$/);
        if (treeMatch) {
            let filePath = treeMatch[1].trim();
            filePath = cleanFileName(filePath);
            if (filePath && filePath.includes('.') && isValidFileExtension(filePath)) {
                files.add(filePath);
                continue;
            }
        }

        // Pattern 2: Bullet points like "- src/train.py" or "* model.py"
        const bulletMatch = line.match(/^[\s]*[-*•]\s+([a-zA-Z0-9_./\-]+\.[a-zA-Z0-9]+)(?:\s*[#(].*)?$/);
        if (bulletMatch) {
            let filePath = bulletMatch[1].trim();
            filePath = cleanFileName(filePath);
            if (filePath && filePath.includes('.') && isValidFileExtension(filePath)) {
                files.add(filePath);
                continue;
            }
        }

        // Pattern 3: Numbered lists like "1. train.py" or "2) model.py"
        const numberedMatch = line.match(/^[\s]*\d+[.)]\s+([a-zA-Z0-9_./\-]+\.[a-zA-Z0-9]+)(?:\s*[#(].*)?$/);
        if (numberedMatch) {
            let filePath = numberedMatch[1].trim();
            filePath = cleanFileName(filePath);
            if (filePath && filePath.includes('.') && isValidFileExtension(filePath)) {
                files.add(filePath);
                continue;
            }
        }

        // Pattern 4: Files mentioned in backticks like "`src/train.py`"
        const backtickMatches = line.match(/`([a-zA-Z0-9_./\-]+\.[a-zA-Z0-9]+)`/g);
        if (backtickMatches && !line.match(/^[\s│├└─]/)) { // Only if not a tree structure line
            backtickMatches.forEach(match => {
                let cleanFile = match.replace(/[`]/g, '').trim();
                cleanFile = cleanFileName(cleanFile);
                if (cleanFile && cleanFile.includes('.') && isValidFileExtension(cleanFile)) {
                    files.add(cleanFile);
                }
            });
            continue;
        }

        // Pattern 5: Files mentioned in quotes like "train.py" or 'model.py'
        const quotedMatches = line.match(/["']([a-zA-Z0-9_./\-]+\.[a-zA-Z0-9]+)["']/g);
        if (quotedMatches) {
            quotedMatches.forEach(match => {
                let cleanFile = match.replace(/["']/g, '').trim();
                cleanFile = cleanFileName(cleanFile);
                if (cleanFile && cleanFile.includes('.') && isValidFileExtension(cleanFile)) {
                    files.add(cleanFile);
                }
            });
            continue;
        }

        // Pattern 6: Files mentioned with common extensions (more permissive)
        const extensionMatches = line.match(/([a-zA-Z0-9_./\-]+\.(py|js|ts|json|md|txt|yml|yaml|dockerfile|sh|html|css|jsx|tsx|vue|php|rb|go|rs|java|cpp|c|h))/g);
        if (extensionMatches && !line.match(/^[\s│├└─*-]/) && !line.includes('http')) { // Avoid URLs and structured lists
            extensionMatches.forEach(match => {
                let cleanFile = match.trim();
                cleanFile = cleanFileName(cleanFile);
                if (cleanFile && cleanFile.includes('.') && isValidFileExtension(cleanFile)) {
                    files.add(cleanFile);
                }
            });
        }
    }

    // Simple deduplication: prefer files with paths over bare filenames
    const extractedFiles = Array.from(files);
    const finalFiles = new Map<string, string>();

    extractedFiles.forEach(file => {
        const basename = file.split('/').pop() || '';
        if (!finalFiles.has(basename) || file.includes('/')) {
            finalFiles.set(basename, file);
        }
    });

    const result = Array.from(finalFiles.values());
    console.log('📄 Frontend extracted files from plan:', result);
    return result;
}

function isValidFileExtension(fileName: string): boolean {
    if (!fileName || !fileName.includes('.')) return false;

    const ext = fileName.split('.').pop()?.toLowerCase();
    const validExtensions = [
        'py', 'js', 'ts', 'jsx', 'tsx', 'vue', 'php', 'rb', 'go', 'rs', 'java', 'cpp', 'c', 'h',
        'json', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf',
        'md', 'txt', 'rst', 'html', 'css', 'scss', 'sass',
        'dockerfile', 'sh', 'bat', 'ps1',
        'sql', 'graphql', 'proto'
    ];

    return validExtensions.includes(ext || '');
}

function cleanFileName(fileName: string): string {
    if (!fileName) return '';

    // Remove comments after # symbol
    let cleaned = fileName.split('#')[0].trim();

    // Remove parenthetical descriptions like "(single file containing...)"
    cleaned = cleaned.replace(/\s*\([^)]*\)\s*$/g, '');

    // Remove leading slashes
    cleaned = cleaned.replace(/^\/+/, '');

    // Remove extra whitespace
    cleaned = cleaned.trim();

    // Ensure we have a valid file extension
    if (cleaned && !cleaned.includes('.')) {
        // If no extension, skip this file as it's likely not a real file
        return '';
    }

    return cleaned;
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