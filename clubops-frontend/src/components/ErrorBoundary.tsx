import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorHistory: Array<{
    error: Error;
    errorInfo: ErrorInfo;
    timestamp: string;
  }>;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorHistory: []
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorHistory: []
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console with persistence
    console.error('🔥 ERROR BOUNDARY CAUGHT ERROR:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    // Store error in localStorage for persistence
    const errorData = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    try {
      const existingErrors = localStorage.getItem('clubops_error_log');
      const errorLog = existingErrors ? JSON.parse(existingErrors) : [];
      errorLog.push(errorData);
      
      // Keep only last 50 errors to prevent localStorage bloat
      if (errorLog.length > 50) {
        errorLog.splice(0, errorLog.length - 50);
      }
      
      localStorage.setItem('clubops_error_log', JSON.stringify(errorLog));
    } catch (storageError) {
      console.error('Failed to store error in localStorage:', storageError);
    }

    this.setState({
      error,
      errorInfo,
      errorHistory: [
        ...this.state.errorHistory,
        { error, errorInfo, timestamp: new Date().toISOString() }
      ]
    });

    // Send error to debug helper if available
    if (typeof window !== 'undefined' && (window as any).clubopsDebug) {
      (window as any).clubopsDebug.logError({
        type: 'REACT_ERROR_BOUNDARY',
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="mt-4 text-lg font-medium text-gray-900">
                  Application Error
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Something went wrong. The error has been logged for debugging.
                </p>
                
                <div className="mt-4 p-3 bg-red-50 rounded-md">
                  <p className="text-xs text-red-800 font-mono">
                    {this.state.error?.message}
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Reload Page
                  </button>
                  
                  <button
                    onClick={() => {
                      // Clear error state to retry
                      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
                    }}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Retry
                  </button>

                  <button
                    onClick={() => {
                      const errorLog = localStorage.getItem('clubops_error_log');
                      if (errorLog) {
                        const blob = new Blob([errorLog], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `clubops-error-log-${Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    }}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100"
                  >
                    Download Error Log
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;