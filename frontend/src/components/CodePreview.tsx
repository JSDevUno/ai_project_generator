import { useState } from 'react';
import { FileText, Download, Eye, EyeOff, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export interface PreviewFile {
    filename: string;
    content: string;
    language: string;
    status: 'pending' | 'generating' | 'complete' | 'error';
    size?: number;
}

interface CodePreviewProps {
    files: PreviewFile[];
    onDownloadAll: () => void;
    isGenerating: boolean;
}

export function CodePreview({ files, onDownloadAll, isGenerating }: CodePreviewProps) {
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(true);

    const getStatusIcon = (status: PreviewFile['status']) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4 text-gray-400" />;
            case 'generating':
                return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
            case 'complete':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
        }
    };

    const getLanguageFromFilename = (filename: string): string => {
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
    };

    const completedFiles = files.filter(f => f.status === 'complete');
    const generatingFiles = files.filter(f => f.status === 'generating');

    return (
        <div className="max-w-7xl mx-auto">
            <div className="rounded-sm border-2 border-black shadow-[4px_4px_0_0_#000] transition-shadow duration-300" style={{ backgroundColor: '#FFFFFF' }}>
                {/* Header */}
                <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base sm:text-lg md:text-xl font-bold flex items-center" style={{ color: '#0F172A' }}>
                                <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 sm:mr-3" style={{ color: '#2563EB' }} />
                                <span className="text-sm sm:text-base md:text-xl">Real-Time Code Preview</span>
                            </h2>
                            <p className="text-xs sm:text-sm md:text-base mt-1 sm:mt-2" style={{ color: '#475569' }}>
                                {completedFiles.length} of {files.length} files generated
                                {files.filter(f => f.status === 'pending').length > 0 &&
                                    ` • ${files.filter(f => f.status === 'pending').length} pending`}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 ml-0 sm:ml-4">
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="flex items-center justify-center px-2 sm:px-3 md:px-4 py-2 text-xs sm:text-sm md:text-base rounded-sm transition-all duration-200 border-2 border-black shadow-[2px_2px_0_0_#000]"
                                style={{ backgroundColor: '#E5E7EB', color: '#475569' }}
                                onMouseEnter={(e) => {
                                    const target = e.target as HTMLButtonElement;
                                    target.style.backgroundColor = '#D1D5DB';
                                    target.style.color = '#0F172A';
                                }}
                                onMouseLeave={(e) => {
                                    const target = e.target as HTMLButtonElement;
                                    target.style.backgroundColor = '#E5E7EB';
                                    target.style.color = '#475569';
                                }}
                            >
                                {showPreview ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2" />}
                                <span className="text-xs sm:text-sm">{showPreview ? 'Hide' : 'Show'}</span>
                            </button>
                            <button
                                onClick={onDownloadAll}
                                disabled={completedFiles.length === 0}
                                className="flex items-center justify-center px-3 sm:px-4 md:px-6 py-2 sm:py-2 md:py-3 text-white rounded-sm transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 text-xs sm:text-sm md:text-base font-semibold border-2 border-black shadow-[2px_2px_0_0_#000]"
                                style={{ backgroundColor: '#2563EB' }}
                                onMouseEnter={(e) => {
                                    const target = e.target as HTMLButtonElement;
                                    if (!target.disabled) {
                                        target.style.backgroundColor = '#1D4ED8';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    const target = e.target as HTMLButtonElement;
                                    if (!target.disabled) {
                                        target.style.backgroundColor = '#2563EB';
                                    }
                                }}
                            >
                                <Download className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2" />
                                <span>ZIP ({completedFiles.length})</span>
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 sm:mt-4 md:mt-6">
                        <div className="flex justify-between text-xs sm:text-sm md:text-base mb-2 sm:mb-3" style={{ color: '#475569' }}>
                            <span className="font-medium">Generation Progress</span>
                            <span className="font-semibold">{Math.round((completedFiles.length / files.length) * 100)}%</span>
                        </div>
                        <div className="w-full rounded-full h-2 sm:h-2 md:h-3 shadow-inner border border-gray-300" style={{ backgroundColor: '#E5E7EB' }}>
                            <div
                                className="h-2 sm:h-2 md:h-3 rounded-full transition-all duration-500 shadow-sm"
                                style={{
                                    width: `${(completedFiles.length / files.length) * 100}%`,
                                    backgroundColor: '#2563EB'
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row min-h-[300px] sm:min-h-[400px] lg:h-96">
                    {/* File List */}
                    <div className="w-full lg:w-1/3 h-40 sm:h-48 lg:h-full border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto" style={{ background: 'linear-gradient(to bottom right, #F7F9FC, #E5E7EB)' }}>
                        <div className="p-3 sm:p-4 lg:p-6">
                            <h3 className="text-sm sm:text-base font-bold mb-3 sm:mb-4" style={{ color: '#0F172A' }}>Generated Files</h3>
                            <div className="space-y-1 sm:space-y-2">
                                {files.map((file, index) => (
                                    <button
                                        key={index}
                                        onClick={() => file.status === 'complete' && setSelectedFile(file.filename)}
                                        disabled={file.status !== 'complete'}
                                        className={`w-full text-left px-2 sm:px-3 lg:px-4 py-2 sm:py-2 lg:py-3 rounded-sm text-xs sm:text-sm lg:text-base transition-all duration-200 border ${selectedFile === file.filename
                                            ? 'border-2 shadow-md'
                                            : file.status === 'complete'
                                                ? 'border border-gray-200 shadow-sm'
                                                : 'border border-gray-200 cursor-not-allowed'
                                            }`}
                                        style={{
                                            backgroundColor: selectedFile === file.filename ? '#DBEAFE' :
                                                file.status === 'complete' ? '#FFFFFF' : '#F3F4F6',
                                            color: selectedFile === file.filename ? '#1E40AF' :
                                                file.status === 'complete' ? '#0F172A' : '#9CA3AF',
                                            borderColor: selectedFile === file.filename ? '#2563EB' : '#E5E7EB'
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="truncate font-medium text-xs sm:text-sm">{file.filename}</span>
                                            {getStatusIcon(file.status)}
                                        </div>
                                        {file.status === 'generating' && (
                                            <div className="text-xs sm:text-sm mt-1 font-medium" style={{ color: '#2563EB' }}>Generating...</div>
                                        )}
                                        {file.status === 'complete' && file.size && (
                                            <div className="text-xs mt-1" style={{ color: '#475569' }}>
                                                {file.size > 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${file.size} B`}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Code Preview */}
                    <div className="flex-1 overflow-hidden h-60 sm:h-80 lg:h-full">
                        {showPreview && selectedFile ? (
                            <div className="h-full flex flex-col">
                                <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 border-b border-gray-200" style={{ background: 'linear-gradient(to right, #F7F9FC, #E5E7EB)' }}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs sm:text-sm lg:text-base font-bold truncate" style={{ color: '#0F172A' }}>{selectedFile}</span>
                                        <span className="text-xs sm:text-sm ml-3 font-medium" style={{ color: '#475569' }}>
                                            {getLanguageFromFilename(selectedFile)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto" style={{ backgroundColor: '#FFFFFF' }}>
                                    <pre className="p-3 sm:p-4 lg:p-6 text-xs sm:text-sm lg:text-base font-mono leading-relaxed whitespace-pre-wrap break-words" style={{ color: '#0F172A' }}>
                                        <code>{files.find(f => f.filename === selectedFile)?.content || ''}</code>
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #F7F9FC, #E5E7EB)', color: '#475569' }}>
                                {!showPreview ? (
                                    <div className="text-center p-4 sm:p-6">
                                        <Eye className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 mx-auto mb-2 sm:mb-3" style={{ color: '#9CA3AF' }} />
                                        <p className="text-sm sm:text-base font-medium">Preview hidden</p>
                                    </div>
                                ) : !selectedFile ? (
                                    <div className="text-center p-4 sm:p-6">
                                        <FileText className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 mx-auto mb-2 sm:mb-3" style={{ color: '#9CA3AF' }} />
                                        <p className="text-sm sm:text-base font-medium">Select a completed file to preview</p>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>

                {/* Generation Status */}
                {isGenerating && (
                    <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-t-2 border-black rounded-b-sm shadow-[1px_1px_0_0_#000]" style={{ backgroundColor: '#DBEAFE' }}>
                        <div className="flex items-center text-sm sm:text-base" style={{ color: '#1E40AF' }}>
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-t-transparent rounded-full animate-spin mr-2 sm:mr-3" style={{ borderColor: '#2563EB' }} />
                            <span className="font-medium text-xs sm:text-sm lg:text-base">
                                Generating files... {generatingFiles.length > 0 && `Currently: ${generatingFiles[0]?.filename}`}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}