import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#F7F9FC'}}>
                    <div className="max-w-md mx-auto rounded-sm border-2 border-black shadow-[4px_4px_0_0_#000] p-6" style={{backgroundColor: '#FFFFFF'}}>
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-8 h-8 rounded-sm flex items-center justify-center border-2 border-black shadow-[1px_1px_0_0_#000]" style={{backgroundColor: '#FEE2E2'}}>
                                <AlertCircle className="w-5 h-5" style={{color: '#DC2626'}} />
                            </div>
                            <h2 className="text-lg font-semibold" style={{color: '#0F172A'}}>
                                Something went wrong
                            </h2>
                        </div>

                        <p className="text-sm mb-4" style={{color: '#475569'}}>
                            The application encountered an unexpected error. Please refresh the page and try again.
                        </p>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full px-4 py-2 text-white text-sm font-medium rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-2 border-black shadow-[1px_1px_0_0_#000]"
                            style={{backgroundColor: '#2563EB'}}
                            onMouseEnter={(e) => {
                              const target = e.target as HTMLButtonElement;
                              target.style.backgroundColor = '#1D4ED8';
                            }}
                            onMouseLeave={(e) => {
                              const target = e.target as HTMLButtonElement;
                              target.style.backgroundColor = '#2563EB';
                            }}
                        >
                            Refresh Page
                        </button>

                        {import.meta.env.DEV && this.state.error && (
                            <details className="mt-4">
                                <summary className="text-sm text-gray-500 cursor-pointer">
                                    Error Details (Development)
                                </summary>
                                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-sm overflow-auto border-2 border-black shadow-[1px_1px_0_0_#000]">
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}