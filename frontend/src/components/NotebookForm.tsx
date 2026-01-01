import { useState } from 'react';
import { FileCode } from 'lucide-react';
import type { ModelType } from './MLScriptGenerator';

interface NotebookFormProps {
    onSubmit: (instruction: string, model: ModelType) => void;
}

export function NotebookForm({ onSubmit }: NotebookFormProps) {
    const [instruction, setInstruction] = useState('');
    const [selectedModel, setSelectedModel] = useState<ModelType>('kwaipilot/kat-coder-pro:free');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (instruction.trim()) {
            onSubmit(instruction, selectedModel);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="rounded-sm border-2 border-black shadow-[4px_4px_0_0_#000]" style={{ backgroundColor: '#FFFFFF' }}>
                <div className="px-8 py-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold flex items-center" style={{ color: '#0F172A' }}>
                        <FileCode className="w-7 h-7 mr-3" style={{ color: '#2563EB' }} />
                        Jupyter Notebook Generator
                    </h2>
                    <p className="mt-2 text-base" style={{ color: '#475569' }}>
                        Describe your notebook and we'll create a detailed plan for your approval
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label htmlFor="instruction" className="block text-base font-semibold mb-3" style={{ color: '#0F172A' }}>
                            Notebook Instructions
                        </label>
                        <textarea
                            id="instruction"
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            placeholder="Example: Create a data analysis notebook for exploring sales data with pandas, including visualizations and statistical analysis"
                            rows={6}
                            className="w-full px-4 py-3 border-2 border-black rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-[2px_2px_0_0_#000]"
                            style={{ 
                                backgroundColor: '#FFFFFF',
                                color: '#0F172A',
                                resize: 'vertical'
                            }}
                            required
                        />
                        <p className="mt-2 text-sm" style={{ color: '#475569' }}>
                            Be specific about what you want in your notebook (data analysis, machine learning, web scraping, etc.)
                        </p>
                    </div>

                    <div>
                        <label htmlFor="model" className="block text-base font-semibold mb-3" style={{ color: '#0F172A' }}>
                            AI Model
                        </label>
                        <select
                            id="model"
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                            className="w-full px-4 py-3 border-2 border-black rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-[2px_2px_0_0_#000]"
                            style={{ 
                                backgroundColor: '#FFFFFF',
                                color: '#0F172A'
                            }}
                        >
                            <option value="kwaipilot/kat-coder-pro:free">KAT Coder Pro (Recommended)</option>
                            <option value="mistralai/devstral-2512:free">Devstral 2512</option>
                            <option value="xiaomi/mimo-v2-flash:free">Mimo V2 Flash</option>
                            <option value="nvidia/nemotron-3-nano-30b-a3b:free">Nemotron 3 Nano</option>
                            <option value="qwen/qwen3-coder:free">Qwen3 Coder</option>
                            <option value="deepseek/deepseek-r1-0528:free">DeepSeek R1</option>
                            <option value="mistralai/mistral-small-3.1-24b-instruct:free">Mistral Small 3.1</option>
                            <option value="mistralai/mistral-7b-instruct:free">Mistral 7B</option>
                            <option value="meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B</option>
                            <option value="google/gemma-3-27b-it:free">Gemma 3 27B</option>
                            <option value="z-ai/glm-4.5-air:free">GLM 4.5 Air</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full inline-flex justify-center items-center px-6 py-4 border-2 border-black text-lg font-bold rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-[3px_3px_0_0_#000] transform hover:-translate-y-0.5 transition-all duration-200"
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
                        Generate Notebook Plan
                    </button>
                </form>
            </div>
        </div>
    );
}
