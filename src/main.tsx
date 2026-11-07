import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class RootErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App render error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center justify-center font-sans">
          <div className="max-w-md w-full bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl mx-auto flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <h2 className="text-lg font-bold text-rose-300">เกิดข้อผิดพลาดในการแสดงผล</h2>
            <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl font-mono text-left overflow-auto max-h-36">
              {this.state.error?.message || 'Unknown Error'}
            </p>
            <button
              onClick={this.handleReload}
              className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm rounded-2xl shadow-lg transition-all"
            >
              โหลดหน้าเว็บใหม่ (Reload Page)
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </React.StrictMode>
  );
}
