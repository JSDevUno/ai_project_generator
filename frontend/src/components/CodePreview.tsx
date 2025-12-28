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
            <div className="rounded-sm border-2 border-black shadow-[4px_4px_0_0_#000] transition-shadow duration-300" style={{backgroundColor: '#FFFFFF'}}>
                {/* Header */}
                <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                                <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-3 text-blue-600" />
                                Real-Time Code Preview
                            </h2>
                            <p className="text-sm sm:text-base text-gray-600 mt-2">
                                {completedFiles.length} of {files.length} files generated
                                {files.filter(f => f.status === 'pending').length > 0 &&
                                    ` • ${files.filter(f => f.status === 'pending').length} pending`}
                            </p>
                        </div>
                        <div className="flex items-center space-x-3 ml-4">
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="flex items-center px-3 sm:px-4 py-2 text-sm sm:text-base rounded-sm transition-all duration-200 whitespace-nowrap border-2 border-black shadow-[2px_2px_0_0_#000]"
                                style={{backgroundColor: '#E5E7EB', color: '#475569'}}
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
                                {showPreview ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />}
                                <span className="hidden sm:inline">{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                                <span className="sm:hidden">{showPreview ? 'Hide' : 'Show'}</span>
                            </button>
                            <button
                                onClick={onDownloadAll}
                                disabled={completedFiles.length === 0}
                                className="flex items-center px-4 sm:px-6 py-2 sm:py-3 text-white rounded-sm transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 text-sm sm:text-base font-semibold border-2 border-black shadow-[2px_2px_0_0_#000]"
                                style={{backgroundColor: '#2563EB'}}
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
                                <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                <span className="hidden sm:inline">Download ZIP ({completedFiles.length})</span>
                                <span className="sm:hidden">ZIP ({completedFiles.length})</span>
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 sm:mt-6">
                        <div className="flex justify-between text-sm sm:text-base text-gray-600 mb-3">
                            <span className="font-medium">Generation Progress</span>
                            <span className="font-semibold">{Math.round((completedFiles.length / files.length) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 shadow-inner">
                            <div
                                className="bg-gradient-to-r from-blue-600 to-blue-700 h-2 sm:h-3 rounded-full transition-all duration-500 shadow-sm"
                                style={{ width: `${(completedFiles.length / files.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row h-96">
                    {/* File List */}
                    <div className="w-full sm:w-1/3 h-32 sm:h-full border-b sm:border-b-0 sm:border-r border-gray-200 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
                        <div className="p-3 sm:p-6">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 sm:mb-4">Generated Files</h3>
                            <div className="space-y-2">
                                {files.map((file, index) => (
                                    <button
                                        key={index}
                                        onClick={() => file.status === 'complete' && setSelectedFile(file.filename)}
                                        disabled={file.status !== 'complete'}
                                        className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-sm sm:text-base transition-all duration-200 ${selectedFile === file.filename
                                                ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-md'
                                                : file.status === 'complete'
                                                    ? 'hover:bg-white hover:shadow-md text-gray-700 bg-white border border-gray-200'
                                                    : 'text-gray-400 cursor-not-allowed bg-gray-100 border border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="truncate font-medium">{file.filename}</span>
                                            {getStatusIcon(file.status)}
                                        </div>
                                        {file.status === 'generating' && (
                                            <div className="text-sm text-blue-600 mt-1 font-medium">Generating...</div>
                                        )}
                                        {file.status === 'complete' && file.size && (
                                            <div className="text-sm text-gray-500 mt-1">
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
                                <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm sm:text-base font-bold text-gray-900 truncate">{selectedFile}</span>
                                        <span className="text-sm text-gray-500 ml-3 font-medium">
                                            {getLanguageFromFilename(selectedFile)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto bg-white">
                                    <pre className="p-4 sm:p-6 text-sm sm:text-base text-gray-800 font-mono leading-relaxed">
                                        <code>{files.find(f => f.filename === selectedFile)?.content || ''}</code>
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100">
                                {!showPreview ? (
                                    <div className="text-center p-6">
                                        <Eye className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 text-gray-400" />
                                        <p className="text-base font-medium">Preview hidden</p>
                                    </div>
                                ) : !selectedFile ? (
                                    <div className="text-center p-6">
                                        <FileText className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 text-gray-400" />
                                        <p className="text-base font-medium">Select a completed file to preview</p>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>

                {/* Generation Status */}
                {isGenerating && (
                    <div className="px-6 sm:px-8 py-4 bg-blue-50 border-t-2 border-black rounded-b-sm shadow-[1px_1px_0_0_#000]">
                        <div className="flex items-center text-base text-blue-800">
                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
                            <span className="font-medium">
                                Generating files... {generatingFiles.length > 0 && `Currently: ${generatingFiles[0]?.filename}`}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}