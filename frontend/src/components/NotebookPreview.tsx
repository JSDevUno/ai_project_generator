import { Download, FileCode, CheckCircle } from 'lucide-react';

interface NotebookPreviewProps {
    notebookJSON: any;
    notebookTitle: string;
    onDownload: () => void;
    onStartOver: () => void;
    isGenerating?: boolean;
}

export function NotebookPreview({ notebookJSON, notebookTitle, onDownload, onStartOver, isGenerating = false }: NotebookPreviewProps) {
    const cellCount = notebookJSON?.cells?.length || 0;
    const codeCount = notebookJSON?.cells?.filter((c: any) => c.cell_type === 'code').length || 0;
    const markdownCount = notebookJSON?.cells?.filter((c: any) => c.cell_type === 'markdown').length || 0;

    if (isGenerating) {
        return (
            <div className="max-w-6xl mx-auto">
                <div className="rounded-sm border-2 border-black shadow-[4px_4px_0_0_#000]" style={{ backgroundColor: '#FFFFFF' }}>
                    {/* Generating Header */}
                    <div className="px-8 py-6 border-b border-gray-200" style={{ background: 'linear-gradient(to right, #DBEAFE, #BFDBFE)' }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center mb-2" style={{ color: '#1E40AF' }}>
                                    <FileCode className="w-8 h-8 mr-3 animate-pulse" style={{ color: '#2563EB' }} />
                                    Generating Notebook...
                                </h2>
                                <p className="text-base" style={{ color: '#1E40AF' }}>
                                    Creating your Jupyter notebook with all cells and content
                                </p>
                            </div>
                            <div className="hidden sm:block">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-black animate-pulse">
                                    <FileCode className="w-8 h-8" style={{ color: '#2563EB' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Loading Content */}
                    <div className="px-8 py-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
                        <p className="text-lg font-semibold" style={{ color: '#475569' }}>
                            Please wait while we generate your notebook...
                        </p>
                        <p className="text-sm mt-2" style={{ color: '#64748B' }}>
                            This usually takes 10-30 seconds
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="rounded-sm border-2 border-black shadow-[4px_4px_0_0_#000]" style={{ backgroundColor: '#FFFFFF' }}>
                {/* Success Header */}
                <div className="px-8 py-6 border-b border-gray-200" style={{ background: 'linear-gradient(to right, #D1FAE5, #A7F3D0)' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center mb-2" style={{ color: '#065F46' }}>
                                <CheckCircle className="w-8 h-8 mr-3" style={{ color: '#10B981' }} />
                                Notebook Generated Successfully!
                            </h2>
                            <p className="text-base" style={{ color: '#047857' }}>
                                Your Jupyter notebook is ready to download
                            </p>
                        </div>
                        <div className="hidden sm:block">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center border-2 border-black">
                                <FileCode className="w-8 h-8" style={{ color: '#10B981' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="px-8 py-6 border-b border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-sm border-2 border-black shadow-[2px_2px_0_0_#000]" style={{ backgroundColor: '#DBEAFE' }}>
                            <div className="text-3xl font-bold mb-1" style={{ color: '#1E40AF' }}>{cellCount}</div>
                            <div className="text-sm font-semibold" style={{ color: '#1E40AF' }}>Total Cells</div>
                        </div>
                        <div className="p-4 rounded-sm border-2 border-black shadow-[2px_2px_0_0_#000]" style={{ backgroundColor: '#DBEAFE' }}>
                            <div className="text-3xl font-bold mb-1" style={{ color: '#1E40AF' }}>{codeCount}</div>
                            <div className="text-sm font-semibold" style={{ color: '#1E40AF' }}>Code Cells</div>
                        </div>
                        <div className="p-4 rounded-sm border-2 border-black shadow-[2px_2px_0_0_#000]" style={{ backgroundColor: '#FEF3C7' }}>
                            <div className="text-3xl font-bold mb-1" style={{ color: '#92400E' }}>{markdownCount}</div>
                            <div className="text-sm font-semibold" style={{ color: '#92400E' }}>Markdown Cells</div>
                        </div>
                    </div>
                </div>

                {/* JSON Preview */}
                <div className="px-8 py-6 border-b border-gray-200">
                    <h3 className="text-lg font-bold mb-4" style={{ color: '#0F172A' }}>
                        Notebook Preview
                    </h3>
                    <div className="rounded-sm border-2 border-black shadow-[2px_2px_0_0_#000] overflow-hidden">
                        <div className="px-4 py-2 border-b-2 border-black" style={{ backgroundColor: '#F7F9FC' }}>
                            <span className="text-sm font-semibold" style={{ color: '#475569' }}>
                                {notebookTitle}.ipynb
                            </span>
                        </div>
                        <div className="p-4 overflow-auto max-h-96" style={{ backgroundColor: '#1E293B' }}>
                            <pre className="text-sm font-mono" style={{ color: '#E2E8F0' }}>
                                {JSON.stringify(notebookJSON, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="px-8 py-6 border-b border-gray-200">
                    <div className="p-6 rounded-sm border-2 border-black shadow-[2px_2px_0_0_#000]" style={{ background: 'linear-gradient(to bottom right, #DCFCE7, #BBF7D0)' }}>
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-6 w-6" style={{ color: '#10B981' }} />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold mb-2" style={{ color: '#15803D' }}>
                                    Ready to Use
                                </h3>
                                <div className="text-base leading-relaxed" style={{ color: '#166534' }}>
                                    <p className="mb-2">
                                        Your Jupyter notebook has been generated with valid JSON structure. Download it and open in:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Jupyter Notebook</li>
                                        <li>JupyterLab</li>
                                        <li>VS Code with Jupyter extension</li>
                                        <li>Google Colab</li>
                                        <li>Any Jupyter-compatible environment</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-8 py-6" style={{ background: 'linear-gradient(to right, #F7F9FC, #E5E7EB)' }}>
                    <div className="flex gap-4">
                        <button
                            onClick={onDownload}
                            className="flex-1 inline-flex justify-center items-center px-6 py-4 border-2 border-black text-lg font-bold rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-[3px_3px_0_0_#000] transform hover:-translate-y-0.5 transition-all duration-200"
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
                            <Download className="w-6 h-6 mr-2" />
                            Download Notebook (.ipynb)
                        </button>
                        <button
                            onClick={onStartOver}
                            className="px-6 py-4 border-2 border-black text-lg font-bold rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-[3px_3px_0_0_#000] transform hover:-translate-y-0.5 transition-all duration-200"
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
                            Generate Another Notebook
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
