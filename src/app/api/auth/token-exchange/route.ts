import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, code_verifier } = body;
    
    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    }
    
    const FOUNDRY_URL = process.env.FOUNDRY_URL || process.env.NEXT_PUBLIC_FOUNDRY_URL;
    const CLIENT_ID = process.env.CLIENT_ID || process.env.NEXT_PUBLIC_CLIENT_ID;
    const CLIENT_SECRET = process.env.CLIENT_SECRET;
    
    const REDIRECT_URI = process.env.REDIRECT_URI || process.env.NEXT_PUBLIC_REDIRECT_URI;
    
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
      try {
        const errorJson = JSON.parse(errorText);
        errorText = errorJson.error_description || errorJson.error || errorText;
      } catch {
      }
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