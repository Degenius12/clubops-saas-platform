import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, User } from '../lib/api';
import { errorLogger } from '../lib/errorLogger';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastLoginAttempt: Date | null;
  loginAttempts: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UseAuthReturn extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  refreshAuth: () => Promise<void>;
  getAuthDiagnostics: () => any;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    lastLoginAttempt: null,
    loginAttempts: 0
  });

  const initializationRef = useRef(false);
  const lastErrorRef = useRef<string | null>(null);

  // Enhanced error handling with persistence
  const handleError = useCallback((error: any, context: string) => {
    const errorMessage = error?.message || error?.toString() || 'Unknown authentication error';
    
    // Prevent duplicate error logging
    if (lastErrorRef.current === errorMessage) {
      return errorMessage;
    }
    lastErrorRef.current = errorMessage;

    console.error(`🔐 Auth Error [${context}]:`, error);

    // Log to error logger with detailed context
    errorLogger.logAuthError(`Authentication failed in ${context}: ${errorMessage}`, {
      error: error?.message,
      stack: error?.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      tokenExists: !!localStorage.getItem('auth_token'),
      apiClientState: {
        hasToken: !!apiClient.getToken(),
        tokenLength: apiClient.getToken()?.length
      }
    });

    setState(prev => ({
      ...prev,
      error: errorMessage,
      isLoading: false
    }));

    return errorMessage;
  }, []);

  // Enhanced login with comprehensive error capture
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    console.log('🔐 Starting enhanced login process...', {
      email: credentials.email,
      timestamp: new Date().toISOString(),
      attempt: state.loginAttempts + 1
    });

    // Check rate limiting
    if (state.loginAttempts >= MAX_LOGIN_ATTEMPTS && state.lastLoginAttempt) {
      const timeSinceLastAttempt = Date.now() - state.lastLoginAttempt.getTime();
      if (timeSinceLastAttempt < LOGIN_COOLDOWN_MS) {
        const remainingTime = Math.ceil((LOGIN_COOLDOWN_MS - timeSinceLastAttempt) / 1000 / 60);
        const errorMsg = `Too many login attempts. Please wait ${remainingTime} minutes.`;
        handleError(new Error(errorMsg), 'rate_limiting');
        return false;
      }
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      loginAttempts: prev.loginAttempts + 1,
      lastLoginAttempt: new Date()
    }));

    try {
      // Clear any existing authentication state
      apiClient.clearToken();
      localStorage.removeItem('auth_token');
      
      console.log('🌐 Calling API login...');
      const startTime = Date.now();
      
      const response = await apiClient.login(credentials.email, credentials.password);
      
      const endTime = Date.now();
      console.log(`✅ Login API call completed in ${endTime - startTime}ms`);

      if (!response) {
        throw new Error('No response received from login API');
      }

      if (!response.token) {
        throw new Error('No authentication token received');
      }

      if (!response.user) {
        throw new Error('No user data received');
      }

      // Store token and update state
      apiClient.setToken(response.token);
      console.log('✅ Token stored successfully');

      setState(prev => ({
        ...prev,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        loginAttempts: 0 // Reset attempts on successful login
      }));

      // Log successful authentication
      errorLogger.logError({
        type: 'AUTH_ERROR',
        message: 'Login successful',
        details: {
          email: credentials.email,
          userId: response.user.id,
          clubsCount: response.user.clubs?.length,
          tokenLength: response.token.length,
          loginAttempts: state.loginAttempts + 1,
          duration: endTime - startTime
        },
        severity: 'low'
      });

      return true;

    } catch (error) {
      console.error('💥 Login failed:', error);
      
      const errorMessage = handleError(error, 'login_attempt');
      
      // Additional debugging for common issues
      if (errorMessage.includes('fetch')) {
        errorLogger.logNetworkError('Login network failure', {
          error: errorMessage,
          credentials: { email: credentials.email, hasPassword: !!credentials.password },
          networkState: {
            online: navigator.onLine,
            userAgent: navigator.userAgent.substring(0, 100)
          }
        });
      }

      return false;
    }
  }, [state.loginAttempts, state.lastLoginAttempt, handleError]);

  // Enhanced logout with cleanup
  const logout = useCallback(() => {
    console.log('🚪 Logging out...');
    
    apiClient.clearToken();
    localStorage.removeItem('auth_token');
    
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastLoginAttempt: null,
      loginAttempts: 0
    });

    errorLogger.logError({
      type: 'AUTH_ERROR',
      message: 'User logged out',
      details: { timestamp: new Date().toISOString() },
      severity: 'low'
    });
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
    lastErrorRef.current = null;
  }, []);

  // Enhanced refresh authentication with error handling
  const refreshAuth = useCallback(async (): Promise<void> => {
    const token = apiClient.getToken();
    
    if (!token) {
      console.log('📝 No token found, user not authenticated');
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        user: null
      }));
      return;
    }

    console.log('🔄 Refreshing authentication...');
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const startTime = Date.now();
      const response = await apiClient.getMe();
      const endTime = Date.now();

      console.log(`✅ Auth refresh completed in ${endTime - startTime}ms`);

      setState(prev => ({
        ...prev,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }));

    } catch (error) {
      console.error('💥 Auth refresh failed:', error);
      
      // If token is invalid, clear it and log out
      if (error instanceof Error && error.message.includes('401')) {
        console.log('🔑 Token expired or invalid, logging out');
        logout();
      } else {
        handleError(error, 'auth_refresh');
      }
    }
  }, [logout, handleError]);

  // Initialize authentication on mount
  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    console.log('🚀 Initializing authentication...');
    refreshAuth();
  }, [refreshAuth]);

  // Get comprehensive diagnostics for debugging
  const getAuthDiagnostics = useCallback(() => {
    const token = apiClient.getToken();
    return {
      state: {
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        hasError: !!state.error,
        errorMessage: state.error,
        hasUser: !!state.user,
        userEmail: state.user?.email,
        loginAttempts: state.loginAttempts,
        lastLoginAttempt: state.lastLoginAttempt?.toISOString()
      },
      token: {
        exists: !!token,
        length: token?.length,
        storedInLocalStorage: !!localStorage.getItem('auth_token'),
        apiClientHasToken: !!apiClient.getToken()
      },
      environment: {
        url: window.location.href,
        userAgent: navigator.userAgent.substring(0, 100),
        online: navigator.onLine,
        timestamp: new Date().toISOString()
      },
      errorHistory: errorLogger.getAuthErrors().slice(-5),
      errorSummary: errorLogger.getErrorSummary()
    };
  }, [state]);

  return {
    ...state,
    login,
    logout,
    clearError,
    refreshAuth,
    getAuthDiagnostics
  };
}