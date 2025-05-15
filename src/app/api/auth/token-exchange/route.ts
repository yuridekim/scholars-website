// src/app/api/auth/token-exchange/route.ts
import { NextRequest, NextResponse } from 'next/server';
const processedCodes = new Set<string>();

// docs for error codes
// https://www.palantir.com/docs/foundry/api/v2/general/overview/errors/?productId=foundry&slug=general&slug=overview&slug=errors

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, code_verifier } = body;
    
    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    }
    
    if (processedCodes.has(code)) {
      return NextResponse.json({ 
        error: 'Authorization code already used',
        details: 'OAuth authorization codes can only be used once'
      }, { status: 400 });
    }
    
    const FOUNDRY_URL = process.env.FOUNDRY_URL;
    const CLIENT_ID = process.env.CLIENT_ID;
    const CLIENT_SECRET = process.env.CLIENT_SECRET;
    const REDIRECT_URI = process.env.REDIRECT_URI;
    
    if (!FOUNDRY_URL || !CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      console.error('Missing environment variables', {
        foundryUrl: !!FOUNDRY_URL,
        clientId: !!CLIENT_ID,
        clientSecret: !!CLIENT_SECRET,
        redirectUri: !!REDIRECT_URI
      });
      return NextResponse.json(
        { error: 'Server configuration error: Missing required environment variables' },
        { status: 500 }
      );
    }
    
    const tokenUrl = `${FOUNDRY_URL}/multipass/api/oauth2/token`;
    const authHeader = `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`;
    
    const requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID, 
    });
    
    if (code_verifier) {
      requestBody.append('code_verifier', code_verifier);
    }
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader
      },
      body: requestBody
    });
    
    if (!response.ok) {
      let errorText = await response.text();
      const errorJson = JSON.parse(errorText);
      errorText = errorJson.error_description || errorJson.error || errorText;
      console.error('Token exchange failed', {
        status: response.status,
        error: errorText
      });
      return NextResponse.json(
        { error: `Token exchange failed: ${errorText}` },
        { status: response.status }
      );
    }
    
    const tokens = await response.json();
    
    processedCodes.add(code);
    
    return NextResponse.json({
      access_token: tokens.access_token,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      refresh_token: tokens.refresh_token
    });
  } catch (error) {
    console.error('Error in token exchange API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}