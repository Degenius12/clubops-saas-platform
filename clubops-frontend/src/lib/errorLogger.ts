export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  type: 'AUTH_ERROR' | 'NETWORK_ERROR' | 'REACT_ERROR' | 'API_ERROR' | 'VALIDATION_ERROR';
  message: string;
  details?: any;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorLogger {
  private sessionId: string;
  private maxEntries = 100;
  private storageKey = 'clubops_error_log';

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
    console.log('🔧 ErrorLogger initialized with session:', this.sessionId);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Capture unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'REACT_ERROR',
        message: event.message,
        details: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error?.stack
        },
        severity: 'high'
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'REACT_ERROR',
        message: 'Unhandled Promise Rejection',
        details: {
          reason: event.reason,
          promise: event.promise
        },
        severity: 'high'
      });
    });

    // Override console.error to capture all console errors
    const originalError = console.error;
    console.error = (...args) => {
      originalError.apply(console, args);
      
      // Log console errors that might contain authentication issues
      const errorMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      if (errorMessage.toLowerCase().includes('auth') || 
          errorMessage.toLowerCase().includes('login') ||
          errorMessage.toLowerCase().includes('token')) {
        this.logError({
          type: 'AUTH_ERROR',
          message: errorMessage,
          details: { consoleArgs: args },
          severity: 'high'
        });
      }
    };
  }

  logError(error: Partial<ErrorLogEntry>): void {
    const entry: ErrorLogEntry = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent.substring(0, 100),
      sessionId: this.sessionId,
      severity: 'medium',
      ...error,
      type: error.type || 'API_ERROR',
      message: error.message || 'Unknown error'
    };

    // Log to console with special formatting
    console.group(`🚨 [${entry.severity.toUpperCase()}] ${entry.type}: ${entry.message}`);
    console.log('⏰ Timestamp:', entry.timestamp);
    console.log('🔗 URL:', entry.url);
    console.log('📝 Details:', entry.details);
    if (entry.stack) console.log('📋 Stack:', entry.stack);
    console.log('🆔 Session:', entry.sessionId);
    console.groupEnd();

    // Store in localStorage with rotation
    try {
      const existingErrors = this.getStoredErrors();
      existingErrors.push(entry);
      
      // Keep only the most recent errors
      if (existingErrors.length > this.maxEntries) {
        existingErrors.splice(0, existingErrors.length - this.maxEntries);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(existingErrors));
    } catch (storageError) {
      console.warn('Failed to store error log:', storageError);
    }

    // Notify debug helper if available
    if (typeof window !== 'undefined' && (window as any).clubopsDebug) {
      (window as any).clubopsDebug.onNewError?.(entry);
    }

    // For critical errors, show immediate notification
    if (entry.severity === 'critical') {
      this.showCriticalErrorNotification(entry);
    }
  }

  private showCriticalErrorNotification(error: ErrorLogEntry): void {
    // Create a persistent error notification for critical issues
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-md';
    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium">Critical Error</h3>
          <p class="mt-1 text-xs">${error.message}</p>
          <p class="mt-1 text-xs opacity-75">Error ID: ${error.id}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-auto flex-shrink-0 text-white hover:text-gray-200">
          <span class="sr-only">Close</span>
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  getStoredErrors(): ErrorLogEntry[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  getErrorsByType(type: ErrorLogEntry['type']): ErrorLogEntry[] {
    return this.getStoredErrors().filter(error => error.type === type);
  }

  getErrorsBySession(sessionId?: string): ErrorLogEntry[] {
    const targetSession = sessionId || this.sessionId;
    return this.getStoredErrors().filter(error => error.sessionId === targetSession);
  }

  getRecentErrors(count: number = 10): ErrorLogEntry[] {
    return this.getStoredErrors().slice(-count);
  }

  clearErrorLog(): void {
    localStorage.removeItem(this.storageKey);
    console.log('🧹 Error log cleared');
  }

  exportErrorLog(): void {
    const errors = this.getStoredErrors();
    const exportData = {
      exportDate: new Date().toISOString(),
      sessionId: this.sessionId,
      errorCount: errors.length,
      errors
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clubops-error-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Authentication-specific error logging
  logAuthError(message: string, details?: any): void {
    this.logError({
      type: 'AUTH_ERROR',
      message,
      details,
      severity: 'high'
    });
  }

  logNetworkError(message: string, details?: any): void {
    this.logError({
      type: 'NETWORK_ERROR',
      message,
      details,
      severity: 'high'
    });
  }

  logApiError(message: string, details?: any): void {
    this.logError({
      type: 'API_ERROR',
      message,
      details,
      severity: 'medium'
    });
  }

  // Get authentication-specific errors
  getAuthErrors(): ErrorLogEntry[] {
    return this.getErrorsByType('AUTH_ERROR');
  }

  // Summary for debugging
  getErrorSummary(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recentAuthErrors: ErrorLogEntry[];
  } {
    const errors = this.getStoredErrors();
    
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    
    errors.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    });

    return {
      total: errors.length,
      byType,
      bySeverity,
      recentAuthErrors: this.getAuthErrors().slice(-5)
    };
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger();

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).clubopsErrorLogger = errorLogger;
}

export default errorLogger;