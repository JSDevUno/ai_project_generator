import { useState } from 'react';
import { FileCode, CheckCircle, Edit, X } from 'lucide-react';

export interface NotebookCell {
    cellNumber: number;
    type: 'markdown' | 'code';
    purpose: string;
    content: string;
}

export interface NotebookPlan {
    title: string;
    totalCells: number;
    cells: NotebookCell[];
}

interface NotebookPlanDisplayProps {
    plan: NotebookPlan;
    onApprove: () => void;
    onRevise: (feedback: string) => void;
    onCancel: () => void;
}

export function NotebookPlanDisplay({ plan, onApprove, onRevise, onCancel }: NotebookPlanDisplayProps) {
    const [isRevising, setIsRevising] = useState(false);
    const [feedback, setFeedback] = useState('');

    const handleRevise = () => {
        if (feedback.trim()) {
            onRevise(feedback);
            setFeedback('');
            setIsRevising(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="rounded-sm border-2 border-black shadow-[4px_4px_0_0_#000]" style={{ backgroundColor: '#FFFFFF' }}>
                <div className="px-8 py-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold flex items-center" style={{ color: '#0F172A' }}>
                        <FileCode className="w-7 h-7 mr-3" style={{ color: '#2563EB' }} />
                        Notebook Plan
                    </h2>
                    <p className="mt-2 text-base" style={{ color: '#475569' }}>
                        Review the notebook structure before generation
                    </p>
                </div>

                <div className="p-8">
                    {/* Plan Header */}
                    <div className="mb-6 p-6 rounded-sm border-2 border-black shadow-[2px_2px_0_0_#000]" style={{ background: 'linear-gradient(to bottom right, #DBEAFE, #BFDBFE)' }}>
                        <h3 className="text-xl font-bold mb-2" style={{ color: '#1E40AF' }}>
                            {plan.title}
                        </h3>
                        <p className="text-base font-semibold" style={{ color: '#1E40AF' }}>
                            Total Cells: {plan.cells.length}
                        </p>
                    </div>

                    {/* Cells List */}
                    <div className="space-y-4 mb-8">
                        {plan.cells.map((cell) => (
                            <div
                                key={cell.cellNumber}
                                className="p-5 rounded-sm border-2 border-black shadow-[2px_2px_0_0_#000]"
                                style={{ backgroundColor: cell.type === 'code' ? '#F0F9FF' : '#FEF3C7' }}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center">
                                        <span className="text-lg font-bold mr-3" style={{ color: '#0F172A' }}>
                                            Cell {cell.cellNumber}
                                        </span>
                                        <span
                                            className="px-3 py-1 rounded-sm text-sm font-semibold border-2 border-black"
                                            style={{
                                                backgroundColor: cell.type === 'code' ? '#2563EB' : '#F59E0B',
                                                color: '#FFFFFF'
                                            }}
                                        >
                                            {cell.type}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <span className="font-semibold" style={{ color: '#0F172A' }}>Purpose: </span>
                                        <span style={{ color: '#475569' }}>{cell.purpose}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold" style={{ color: '#0F172A' }}>Content: </span>
                                        <span style={{ color: '#475569' }}>{cell.content}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Revision Section */}
                    {isRevising && (
                        <div className="mb-6 p-6 rounded-sm border-2 border-black shadow-[2px_2px_0_0_#000]" style={{ backgroundColor: '#FEF3C7' }}>
                            <label className="block text-base font-semibold mb-3" style={{ color: '#0F172A' }}>
                                Revision Feedback
                            </label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Example: Add more cells for data visualization, make it simpler, add error handling..."
                                rows={4}
                                className="w-full px-4 py-3 border-2 border-black rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-[2px_2px_0_0_#000]"
                                style={{ 
                                    backgroundColor: '#FFFFFF',
                                    color: '#0F172A',
                                    resize: 'vertical'
                                }}
                            />
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={handleRevise}
                                    disabled={!feedback.trim()}
                                    className="flex-1 inline-flex justify-center items-center px-6 py-3 border-2 border-black text-base font-semibold rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-[2px_2px_0_0_#000] transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    style={{ backgroundColor: '#F59E0B' }}
                                    onMouseEnter={(e) => {
                                        const target = e.target as HTMLButtonElement;
                                        if (!target.disabled) target.style.backgroundColor = '#D97706';
                                    }}
                                    onMouseLeave={(e) => {
                                        const target = e.target as HTMLButtonElement;
                                        if (!target.disabled) target.style.backgroundColor = '#F59E0B';
                                    }}
                                >
                                    Submit Revision
                                </button>
                                <button
                                    onClick={() => {
                                        setIsRevising(false);
                                        setFeedback('');
                                    }}
                                    className="px-6 py-3 border-2 border-black text-base font-semibold rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-[2px_2px_0_0_#000] transform hover:-translate-y-0.5 transition-all duration-200"
                                    style={{ backgroundColor: '#E5E7EB', color: '#475569' }}
                                    onMouseEnter={(e) => {
                                        const target = e.target as HTMLButtonElement;
                                        target.style.backgroundColor = '#D1D5DB';
                                    }}
                                    onMouseLeave={(e) => {
                                        const target = e.target as HTMLButtonElement;
                                        target.style.backgroundColor = '#E5E7EB';
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {!isRevising && (
                        <div className="flex gap-4">
                            <button
                                onClick={onApprove}
                                className="flex-1 inline-flex justify-center items-center px-6 py-4 border-2 border-black text-lg font-bold rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-[3px_3px_0_0_#000] transform hover:-translate-y-0.5 transition-all duration-200"
                                style={{ backgroundColor: '#10B981' }}
                                onMouseEnter={(e) => {
                                    const target = e.target as HTMLButtonElement;
                                    target.style.backgroundColor = '#059669';
                                }}
                                onMouseLeave={(e) => {
                                    const target = e.target as HTMLButtonElement;
                                    target.style.backgroundColor = '#10B981';
                                }}
                            >
                                <CheckCircle className="w-6 h-6 mr-2" />
                                Approve & Generate Notebook
                            </button>
                            <button
                                onClick={() => setIsRevising(true)}
                                className="px-6 py-4 border-2 border-black text-lg font-bold rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-[3px_3px_0_0_#000] transform hover:-translate-y-0.5 transition-all duration-200"
                                style={{ backgroundColor: '#F59E0B', color: '#FFFFFF' }}
                                onMouseEnter={(e) => {
                                    const target = e.target as HTMLButtonElement;
                                    target.style.backgroundColor = '#D97706';
                                }}
                                onMouseLeave={(e) => {
                                    const target = e.target as HTMLButtonElement;
                                    target.style.backgroundColor = '#F59E0B';
                                }}
                            >
                                <Edit className="w-6 h-6 mr-2 inline" />
                                Revise Plan
                            </button>
                            <button
                                onClick={onCancel}
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
                                <X className="w-6 h-6 mr-2 inline" />
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
