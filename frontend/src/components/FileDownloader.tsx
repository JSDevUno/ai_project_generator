import { FileText, BookOpen, FileCode, Download, CheckCircle } from 'lucide-react';

export interface GeneratedFile {
    filename: string;
    content: string;
    type: 'python' | 'notebook' | 'markdown' | 'text';
}

interface FileDownloaderProps {
    files: GeneratedFile[];
    projectName: string;
}

export function FileDownloader({ files, projectName }: FileDownloaderProps) {
    const downloadFile = (file: GeneratedFile) => {
        const blob = new Blob([file.content], {
            type: file.type === 'notebook' ? 'application/json' : 'text/plain'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadAll = () => {
        files.forEach(file => {
            setTimeout(() => downloadFile(file), 100);
        });
    };

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'python':
                return <FileCode className="w-6 h-6 text-blue-600" />;
            case 'notebook':
                return <BookOpen className="w-6 h-6 text-orange-600" />;
            case 'markdown':
                return <FileText className="w-6 h-6 text-green-600" />;
            default:
                return <FileText className="w-6 h-6 text-gray-600" />;
        }
    };

    const getFileSize = (content: string) => {
        const bytes = new Blob([content]).size;
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Generated Files: {projectName}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {files.length} files ready for download
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Complete
                            </span>
                        </div>
                    </div>
                </div>

                {/* Files List */}
                <div className="divide-y divide-gray-200">
                    {files.map((file, index) => (
                        <div key={index} className="px-6 py-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    {getFileIcon(file.type)}
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {file.filename}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {file.type} • {getFileSize(file.content)}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => downloadFile(file)}
                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Download className="w-4 h-4 mr-1.5" />
                                    Download
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Download ZIP Button */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <button
                        onClick={downloadAll}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download ZIP
                    </button>
                </div>
            </div>

            {/* Success Message */}
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                            Project Generated Successfully!
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                            <p>
                                Your AI project files have been generated and are ready for download.
                                Check the project structure documentation for setup and usage instructions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}