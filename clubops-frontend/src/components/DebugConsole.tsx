import React, { useState, useEffect, useRef } from 'react';
import { errorLogger, ErrorLogEntry } from '../lib/errorLogger';

interface DebugConsoleProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

export const DebugConsole: React.FC<DebugConsoleProps> = ({ 
  isVisible = false, 
  onToggle 
}) => {
  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'auth' | 'network' | 'critical'>('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const errorListRef = useRef<HTMLDivElement>(null);

  // Update errors when error logger receives new entries
  useEffect(() => {
    const updateErrors = () => {
      setErrors(errorLogger.getStoredErrors());
    };

    // Initial load
    updateErrors();

    // Set up error logger callback
    if (typeof window !== 'undefined') {
      (window as any).clubopsErrorLogger.onNewError = (error: ErrorLogEntry) => {
        updateErrors();
        
        // Auto-scroll to bottom if enabled
        if (autoScroll && errorListRef.current) {
          setTimeout(() => {
            if (errorListRef.current) {
              errorListRef.current.scrollTop = errorListRef.current.scrollHeight;
            }
          }, 100);
        }
      };
    }

    // Refresh every 5 seconds to catch any missed errors
    const interval = setInterval(updateErrors, 5000);

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined' && (window as any).clubopsErrorLogger) {
        (window as any).clubopsErrorLogger.onNewError = null;
      }
    };
  }, [autoScroll]);

  // Filter errors based on selected filter
  const filteredErrors = errors.filter(error => {
    switch (filter) {
      case 'auth':
        return error.type === 'AUTH_ERROR';
      case 'network':
        return error.type === 'NETWORK_ERROR';
      case 'critical':
        return error.severity === 'critical' || error.severity === 'high';
      default:
        return true;
    }
  }).slice(-50); // Show only last 50 errors

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'AUTH_ERROR':
        return '🔐';
      case 'NETWORK_ERROR':
        return '🌐';
      case 'API_ERROR':
        return '⚠️';
      case 'REACT_ERROR':
        return '⚛️';
      default:
        return '❌';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const copyErrorToClipboard = (error: ErrorLogEntry) => {
    const errorText = JSON.stringify(error, null, 2);
    navigator.clipboard.writeText(errorText).then(() => {
      alert('Error copied to clipboard');
    });
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onToggle}
          className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Open Debug Console"
        >
          🐛 {errors.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {errors.length > 99 ? '99+' : errors.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-full max-w-4xl bg-white border-l border-t border-gray-300 shadow-2xl z-50">
      {/* Header */}
      <div className="bg-gray-800 text-white p-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="font-semibold">ClubOps Debug Console</h3>
          <span className="text-sm bg-red-600 px-2 py-1 rounded">
            {filteredErrors.length} errors
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Filter buttons */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-black px-2 py-1 rounded text-xs"
          >
            <option value="all">All Errors</option>
            <option value="auth">Auth Only</option>
            <option value="network">Network Only</option>
            <option value="critical">Critical Only</option>
          </select>

          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 text-xs rounded ${
              autoScroll ? 'bg-green-600' : 'bg-gray-600'
            }`}
          >
            Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
          </button>

          {/* Expand/collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 text-xs bg-blue-600 rounded"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>

          {/* Clear errors */}
          <button
            onClick={() => {
              errorLogger.clearErrorLog();
              setErrors([]);
            }}
            className="px-2 py-1 text-xs bg-yellow-600 rounded"
          >
            Clear
          </button>

          {/* Export errors */}
          <button
            onClick={() => errorLogger.exportErrorLog()}
            className="px-2 py-1 text-xs bg-purple-600 rounded"
          >
            Export
          </button>

          {/* Close */}
          <button
            onClick={onToggle}
            className="px-2 py-1 text-xs bg-red-600 rounded"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Error List */}
      <div 
        ref={errorListRef}
        className={`overflow-y-auto bg-gray-50 ${isExpanded ? 'h-96' : 'h-48'}`}
      >
        {filteredErrors.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No errors found for current filter
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredErrors.map((error, index) => (
              <div key={error.id} className="p-3 hover:bg-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getTypeIcon(error.type)}</span>
                      <span className={`px-2 py-1 text-xs rounded font-medium ${getSeverityColor(error.severity)}`}>
                        {error.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(error.timestamp)}
                      </span>
                      <span className="text-xs text-gray-400">
                        [{error.type}]
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-800 mb-1">
                      {error.message}
                    </div>
                    
                    {error.details && (
                      <details className="text-xs text-gray-600">
                        <summary className="cursor-pointer hover:text-gray-800">
                          Show details
                        </summary>
                        <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(error.details, null, 2)}
                        </pre>
                      </details>
                    )}
                    
                    {error.stack && (
                      <details className="text-xs text-gray-600 mt-1">
                        <summary className="cursor-pointer hover:text-gray-800">
                          Show stack trace
                        </summary>
                        <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                  
                  <button
                    onClick={() => copyErrorToClipboard(error)}
                    className="ml-2 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded"
                    title="Copy error to clipboard"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with quick actions */}
      <div className="bg-gray-100 p-2 text-xs text-gray-600 flex justify-between items-center">
        <div>
          Session: {errorLogger.getStoredErrors()[0]?.sessionId?.slice(-8) || 'N/A'}
        </div>
        <div className="flex space-x-4">
          <span>Total: {errors.length}</span>
          <span>Auth: {errors.filter(e => e.type === 'AUTH_ERROR').length}</span>
          <span>Network: {errors.filter(e => e.type === 'NETWORK_ERROR').length}</span>
          <span>Critical: {errors.filter(e => e.severity === 'critical').length}</span>
        </div>
      </div>
    </div>
  );
};

export default DebugConsole;