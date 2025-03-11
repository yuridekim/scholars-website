import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, token, method = 'GET', requestBody } = body;
    
    const FOUNDRY_URL = process.env.FOUNDRY_URL || process.env.NEXT_PUBLIC_FOUNDRY_URL;

    if (!FOUNDRY_URL) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing Foundry URL' },
        { status: 500 }
      );
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Missing required parameter: token' },
        { status: 400 }
      );
    }
    
    const url = `${FOUNDRY_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    let fetchUrl = url;
    if (method === 'GET' && requestBody) {
      const queryParams = new URLSearchParams();
      Object.entries(requestBody).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      if (queryString) {
        fetchUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }
    
    const fetchOptions: RequestInit = {
      method,
      headers,
      body: method !== 'GET' && requestBody ? JSON.stringify(requestBody) : undefined,
    };
    
    const response = await fetch(fetchUrl, fetchOptions);
    console.log("Response status:", response.status);
    
    try {
      const data = await response.json();
      
      if (!response.ok) {
        console.log("Error response body:", data);
        return NextResponse.json(
          data,
          { status: response.status }
        );
      }
      
      return NextResponse.json(data);
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      
      return NextResponse.json(
        { error: `Failed to parse response: ${response.statusText}` },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Foundry proxy error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}