import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PulseBeat ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-2">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-playfair font-black text-txt">Something went wrong</h2>
          <p className="text-sm text-txt-sec max-w-md">
            An unexpected error occurred while loading this view.
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-space font-bold bg-sidebar border border-brd hover:bg-elevated transition-colors shadow-sm"
          >
            <RotateCcw size={14} /> Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
