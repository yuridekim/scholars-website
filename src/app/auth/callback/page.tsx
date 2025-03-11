// src/app/auth/callback/page.tsx

// redirect uri should be open for callback page in Palantir
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (typeof window === 'undefined') {
          return;
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
            code_verifier: codeVerifier
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
        
        setTimeout(() => {
          router.push('/palantir');
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
      <div className="auth-processing">
        <h2>Processing Authentication...</h2>
        <p>Please wait while we complete the authentication process.</p>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="auth-error">
        <h2>Authentication Error</h2>
        <p>There was a problem completing the authentication process:</p>
        <p className="error-message">{errorMessage}</p>
        <button onClick={() => router.push('/')}>Return to Home</button>
      </div>
    );
  }
  
  return (
    <div className="auth-success">
      <h2>Authentication Successful!</h2>
      <p>You have been successfully authenticated.</p>
      <p>Redirecting you to the application...</p>
    </div>
  );
}