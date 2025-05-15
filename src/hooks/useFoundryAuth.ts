'use client';

import { useState, useEffect } from 'react';
import { initiateAuthFlow } from '@/hooks/auth-utils';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: Error | null;
  login: () => Promise<void>;
  logout: () => void;
}

const globalAuthState = {
  isAuthenticated: false,
  listeners: new Set<() => void>()
};

export function useFoundryAuth(): AuthState {
  const [tokenState, setTokenState] = useState({
    accessToken: null as string | null,
    refreshToken: null as string | null,
    expiresAt: null as number | null,
    isAuthenticated: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [, setForceUpdate] = useState({});
  
  useEffect(() => {
    const loadStoredToken = () => {
      try {
        console.log("Checking for authentication...");
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }
        
        const token = localStorage.getItem('foundry_access_token');
        const refreshToken = localStorage.getItem('foundry_refresh_token');
        const expiresAtStr = localStorage.getItem('foundry_token_expires');
        
        if (token) {
          const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : null;
          const isValid = expiresAt ? Date.now() < expiresAt : false;
          console.log("Token is valid:", isValid);
          
          setTokenState({
            accessToken: token,
            refreshToken,
            expiresAt,
            isAuthenticated: isValid
          });
          
          globalAuthState.isAuthenticated = isValid;
        } else {
          setTokenState({
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            isAuthenticated: false
          });
          
          // Update global state
          globalAuthState.isAuthenticated = false;
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading auth state:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    };

    loadStoredToken();
    
    const listener = () => {
      setForceUpdate({});
      setTokenState(prev => ({
        ...prev,
        isAuthenticated: globalAuthState.isAuthenticated
      }));
    };
    
    globalAuthState.listeners.add(listener);
    
    return () => {
      globalAuthState.listeners.delete(listener);
    };
  }, []);

  const login = async () => {
    try {
      console.log("Initiating auth flow...");
      await initiateAuthFlow();
    } catch (err) {
      console.error('Error initiating auth flow:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      alert(`Authentication error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const logout = () => {
    localStorage.removeItem('foundry_access_token');
    localStorage.removeItem('foundry_refresh_token');
    localStorage.removeItem('foundry_token_expires');
    
    setTokenState({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false
    });
    
    globalAuthState.isAuthenticated = false;
    globalAuthState.listeners.forEach(listener => listener());
  };

  return {
    ...tokenState,
    loading,
    error,
    login,
    logout
  };
}