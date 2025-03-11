'use client';

import { randomBytes } from 'crypto';

export function generateRandomString(length: number = 64): string {
  if (typeof window !== 'undefined') {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < array.length; i++) {
      result += chars.charAt(array[i] % chars.length);
    }
    return result;
  }
  
  return randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .slice(0, length);
}

export async function createCodeChallenge(codeVerifier: string): Promise<string> {
  if (typeof window !== 'undefined') {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    
    const bytes = new Uint8Array(digest);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    const base64 = btoa(binary);
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  
  throw new Error('createCodeChallenge requires browser environment');
}

export async function initiateAuthFlow() {
  if (typeof window === 'undefined') {
    throw new Error('Authentication requires a browser environment');
  }
  
  const state = generateRandomString(32);
  const codeVerifier = generateRandomString(64);
  
  console.log("Generated state and code_verifier");
  
  sessionStorage.setItem('auth_state', state);
  sessionStorage.setItem('code_verifier', codeVerifier);
  
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI;
  const foundryUrl = process.env.NEXT_PUBLIC_FOUNDRY_URL;
  
  if (!clientId || !redirectUri || !foundryUrl) {
    throw new Error('Missing required environment variables for authentication');
  }
  
  try {
    const codeChallenge = await createCodeChallenge(codeVerifier);
  
    // authorization
    // https://www.palantir.com/docs/foundry/platform-security-third-party/writing-oauth2-clients#authorization-code-grant
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'offline_access api:ontologies-read api:ontologies-write',
      state: state,
      // optional for confidential client but included anyway
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    
    // auth endpoint
    const authUrl = `${foundryUrl}/multipass/api/oauth2/authorize?${params.toString()}`;
    
    window.location.href = authUrl;
  } catch (error) {
    console.error("Error in auth flow:", error);
    throw error;
  }
}