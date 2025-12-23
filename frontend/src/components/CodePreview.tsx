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
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                {/* Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                                <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                                Real-Time Code Preview
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                {completedFiles.length} of {files.length} files generated
                                {files.filter(f => f.status === 'pending').length > 0 &&
                                    ` • ${files.filter(f => f.status === 'pending').length} pending`}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="flex items-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
                            >
                                {showPreview ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                                <span className="hidden sm:inline">{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                                <span className="sm:hidden">{showPreview ? 'Hide' : 'Show'}</span>
                            </button>
                            <button
                                onClick={onDownloadAll}
                                disabled={completedFiles.length === 0}
                                className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
                            >
                                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Download ZIP ({completedFiles.length})</span>
                                <span className="sm:hidden">ZIP ({completedFiles.length})</span>
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 sm:mt-4">
                        <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
                            <span>Generation Progress</span>
                            <span>{Math.round((completedFiles.length / files.length) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                            <div
                                className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(completedFiles.length / files.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row h-96">
                    {/* File List */}
                    <div className="w-full sm:w-1/3 h-32 sm:h-full border-b sm:border-b-0 sm:border-r border-gray-200 overflow-y-auto">
                        <div className="p-2 sm:p-4">
                            <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 sm:mb-3">Generated Files</h3>
                            <div className="space-y-1">
                                {files.map((file, index) => (
                                    <button
                                        key={index}
                                        onClick={() => file.status === 'complete' && setSelectedFile(file.filename)}
                                        disabled={file.status !== 'complete'}
                                        className={`w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm transition-colors ${selectedFile === file.filename
                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                : file.status === 'complete'
                                                    ? 'hover:bg-gray-50 text-gray-700'
                                                    : 'text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="truncate">{file.filename}</span>
                                            {getStatusIcon(file.status)}
                                        </div>
                                        {file.status === 'generating' && (
                                            <div className="text-xs text-blue-600 mt-1">Generating...</div>
                                        )}
                                        {file.status === 'complete' && file.size && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {file.size > 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${file.size} B`}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Code Preview */}
                    <div className="flex-1 overflow-hidden h-64 sm:h-full">
                        {showPreview && selectedFile ? (
                            <div className="h-full flex flex-col">
                                <div className="px-2 sm:px-4 py-2 bg-gray-50 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">{selectedFile}</span>
                                        <span className="text-xs text-gray-500 ml-2">
                                            {getLanguageFromFilename(selectedFile)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto">
                                    <pre className="p-2 sm:p-4 text-xs sm:text-sm text-gray-800 font-mono leading-relaxed">
                                        <code>{files.find(f => f.filename === selectedFile)?.content || ''}</code>
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                {!showPreview ? (
                                    <div className="text-center p-4">
                                        <Eye className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-400" />
                                        <p className="text-sm">Preview hidden</p>
                                    </div>
                                ) : !selectedFile ? (
                                    <div className="text-center p-4">
                                        <FileText className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-400" />
                                        <p className="text-sm">Select a completed file to preview</p>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>

                {/* Generation Status */}
                {isGenerating && (
                    <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
                        <div className="flex items-center text-sm text-blue-800">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                            <span>
                                Generating files... {generatingFiles.length > 0 && `Currently: ${generatingFiles[0]?.filename}`}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}