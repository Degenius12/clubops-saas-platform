import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DebugConsole } from './components/DebugConsole';
import { useAuth } from './hooks/useAuthEnhanced';
import { errorLogger } from './lib/errorLogger';
import './index.css';

// Import your existing pages/components
const LoginPage = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const LoadingSpinner = React.lazy(() => import('./components/LoadingSpinner'));

// Enable debug mode in development
const isDevelopment = process.env.NODE_ENV === 'development';
const DEBUG_MODE = isDevelopment || localStorage.getItem('clubops_debug_mode') === 'true';

function App() {
  const auth = useAuth();
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  // Initialize error logging and debug mode
  useEffect(() => {
    console.log('🚀 ClubOps App initializing...', {
      environment: process.env.NODE_ENV,
      debugMode: DEBUG_MODE,
      timestamp: new Date().toISOString()
    });

    // Log app initialization
    errorLogger.logError({
      type: 'API_ERROR',
      message: 'ClubOps application initialized',
      details: {
        environment: process.env.NODE_ENV,
        debugMode: DEBUG_MODE,
        userAgent: navigator.userAgent.substring(0, 100),
        url: window.location.href
      },
      severity: 'low'
    });

    // Enable debug console in development or when explicitly enabled
    if (DEBUG_MODE) {
      console.log('🔧 Debug mode enabled');
      
      // Add global debug helpers
      if (typeof window !== 'undefined') {
        (window as any).clubopsApp = {
          auth: auth,
          errorLogger: errorLogger,
          showDebugConsole: () => setShowDebugConsole(true),
          hideDebugConsole: () => setShowDebugConsole(false),
          toggleDebugConsole: () => setShowDebugConsole(prev => !prev),
          getDiagnostics: () => auth.getAuthDiagnostics(),
          clearErrors: () => errorLogger.clearErrorLog(),
          exportErrors: () => errorLogger.exportErrorLog()
        };
      }
    }

    // Enable debug console with keyboard shortcut (Ctrl+Shift+D)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setShowDebugConsole(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [auth]);

  // Global error handler for critical app errors
  const handleAppError = (error: Error, errorInfo?: any) => {
    console.error('🔥 Critical App Error:', error);
    
    errorLogger.logError({
      type: 'REACT_ERROR',
      message: `Critical app error: ${error.message}`,
      details: {
        error: error.message,
        stack: error.stack,
        errorInfo,
        authState: auth.getAuthDiagnostics()
      },
      severity: 'critical'
    });

    setAppError(error.message);
  };

  // Protected Route Component with Enhanced Error Handling
  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (auth.isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <React.Suspense fallback={<div>Loading...</div>}>
            <LoadingSpinner />
          </React.Suspense>
        </div>
      );
    }

    if (!auth.isAuthenticated) {
      console.log('🔒 User not authenticated, redirecting to login');
      return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
  };

  // Public Route Component (for login page)
  const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (auth.isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <React.Suspense fallback={<div>Loading...</div>}>
            <LoadingSpinner />
          </React.Suspense>
        </div>
      );
    }

    if (auth.isAuthenticated) {
      console.log('✅ User authenticated, redirecting to dashboard');
      return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
  };

  // Critical app error fallback
  if (appError) {
    return (
      <div className="min-h-screen bg-red-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-medium text-gray-900">Critical Application Error</h2>
              <p className="mt-2 text-sm text-gray-500">The application encountered a critical error and needs to be restarted.</p>
              
              <div className="mt-4 p-3 bg-red-50 rounded-md">
                <p className="text-xs text-red-800 font-mono">{appError}</p>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Restart Application
                </button>
                
                <button
                  onClick={() => setShowDebugConsole(true)}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Show Debug Console
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Application Error</h1>
            <p className="text-gray-600 mb-6">The application encountered an error and has been reset.</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Reload Application
            </button>
          </div>
        </div>
      }
    >
      <Router>
        <div className="App">
          <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          }>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } />

              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />

              {/* Default redirect */}
              <Route path="/" element={
                <Navigate to={auth.isAuthenticated ? "/dashboard" : "/login"} replace />
              } />

              {/* Catch all route */}
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                    <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
                    <Navigate to="/" replace />
                  </div>
                </div>
              } />
            </Routes>
          </React.Suspense>

          {/* Debug Console - Always available but hidden by default */}
          {DEBUG_MODE && (
            <DebugConsole 
              isVisible={showDebugConsole}
              onToggle={() => setShowDebugConsole(prev => !prev)}
            />
          )}

          {/* Debug mode indicator */}
          {DEBUG_MODE && (
            <div className="fixed top-0 left-0 bg-yellow-400 text-black px-2 py-1 text-xs z-40">
              DEBUG MODE - Press Ctrl+Shift+D for console
            </div>
          )}
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;