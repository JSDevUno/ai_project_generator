import { useState } from 'react';
import { Zap, FileCode } from 'lucide-react';
import { MLScriptGenerator } from './MLScriptGenerator';
import { NotebookGenerator } from './NotebookGenerator';

export type GenerationMode = 'project' | 'notebook';

export function ModeSelector() {
    const [mode, setMode] = useState<GenerationMode>('project');

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#F7F9FC' }}>
            {/* Header with Mode Toggle */}
            <header className="border-b-2 border-black" style={{ backgroundColor: '#FFFFFF' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: '#0F172A' }}>
                                Universal AI Project Generator
                            </h1>
                        </div>

                        {/* Mode Toggle */}
                        <div className="flex gap-2 border-2 border-black rounded-sm p-1 shadow-[2px_2px_0_0_#000] flex-shrink-0" style={{ backgroundColor: '#E5E7EB' }}>
                            <button
                                onClick={() => setMode('project')}
                                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-sm font-semibold transition-all duration-200 text-sm ${
                                    mode === 'project' 
                                        ? 'border-2 border-black shadow-[2px_2px_0_0_#000]' 
                                        : 'border-2 border-transparent'
                                }`}
                                style={{
                                    backgroundColor: mode === 'project' ? '#2563EB' : 'transparent',
                                    color: mode === 'project' ? '#FFFFFF' : '#475569'
                                }}
                            >
                                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="hidden sm:inline">Project</span>
                            </button>
                            <button
                                onClick={() => setMode('notebook')}
                                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-sm font-semibold transition-all duration-200 text-sm ${
                                    mode === 'notebook' 
                                        ? 'border-2 border-black shadow-[2px_2px_0_0_#000]' 
                                        : 'border-2 border-transparent'
                                }`}
                                style={{
                                    backgroundColor: mode === 'notebook' ? '#F59E0B' : 'transparent',
                                    color: mode === 'notebook' ? '#FFFFFF' : '#475569'
                                }}
                            >
                                <FileCode className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="hidden sm:inline">Notebook</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content - Conditional Rendering */}
            <main>
                {mode === 'project' ? (
                    // Existing project workflow (UNCHANGED)
                    <MLScriptGenerator />
                ) : (
                    // New notebook workflow (SEPARATE)
                    <NotebookGenerator />
                )}
            </main>
        </div>
    );
}
