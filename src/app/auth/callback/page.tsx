// src/app/auth/callback/page.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState<string>('/palantir');
  const codeProcessed = useRef(false);
  const finalRedirectPathRef = useRef<string>('/palantir');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (typeof window === 'undefined') {
          return;
        }
        if (codeProcessed.current) {
          return;
        }

        const storedRedirectPath = sessionStorage.getItem('auth_redirect');
        if (storedRedirectPath) {
          setRedirectPath(storedRedirectPath);
          finalRedirectPathRef.current = storedRedirectPath;
        }

        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        
        const error = params.get('error');
        if (error) {
          const errorDescription = params.get('error_description') || 'Unknown error';
          throw new Error(`Authentication error: ${error} - ${errorDescription}`);
        }
        
        if (!code) {
          throw new Error('No authorization code received');
        }

        codeProcessed.current = true;
        
        const savedState = sessionStorage.getItem('auth_state');
        if (state !== savedState) {
          console.error('State mismatch', { received: state, saved: savedState });
          throw new Error('Security error: Invalid state parameter');
        }
        
        const codeVerifier = sessionStorage.getItem('code_verifier');
        if (!codeVerifier) {
          console.warn('Code verifier not found - this is okay for confidential clients');
        } else {
          console.log('Code verifier retrieved successfully');
        }
        
        const response = await fetch('/api/auth/token-exchange', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code,
            code_verifier: codeVerifier,
          })
        });
        if (!response.ok) {
          let errorText = 'Failed to exchange token';
          try {
            const errorData = await response.json();
            errorText = errorData.error || errorText;
            console.error('Token exchange error details:', errorData);
          } catch (parseError) {
            try {
              errorText = await response.text();
              console.error('Token exchange error text:', errorText);
            } catch {
            }
          }
          throw new Error(errorText);
        }
        
        const tokens = await response.json();
        
        localStorage.setItem('foundry_access_token', tokens.access_token);
        
        if (tokens.refresh_token) {
          localStorage.setItem('foundry_refresh_token', tokens.refresh_token);
        }
        
        if (tokens.expires_in) {
          const expiresInMs = parseInt(tokens.expires_in, 10) * 1000;
          const expirationTime = Date.now() + expiresInMs;
          localStorage.setItem('foundry_token_expires', expirationTime.toString());
        }
        
        setStatus('success');
        
        sessionStorage.removeItem('auth_state');
        sessionStorage.removeItem('code_verifier');
        
        const finalPath = finalRedirectPathRef.current;
        
        setTimeout(() => {
          router.push(finalPath);
          sessionStorage.removeItem('auth_redirect');
        }, 1500);
        
      } catch (error) {
        console.error('Error in auth callback:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : String(error));
      }
    };
    
    handleCallback();
  }, [router]);

  if (status === 'processing') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Processing Authentication...</h2>
          <p className="text-gray-600">Please wait while we complete the authentication process.</p>
        </div>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-2">There was a problem completing the authentication process:</p>
          <p className="text-red-500 mb-4 p-2 bg-red-50 rounded">{errorMessage}</p>
          <button 
            onClick={() => router.push('/')} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="text-green-600 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Authentication Successful!</h2>
        <p className="text-gray-600">You have been successfully authenticated.</p>
      </div>
    </div>
  );
}