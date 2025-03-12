'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { initiateAuthFlow } from '@/hooks/auth-utils';

interface DataItem {
  name: string;
  value: number;
  color?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: Error | null;
  login: () => Promise<void>;
  logout: () => void;
}

function useFoundryAuth(): AuthState {
  const [tokenState, setTokenState] = useState({
    accessToken: null as string | null,
    refreshToken: null as string | null,
    expiresAt: null as number | null,
    isAuthenticated: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading auth state:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    };

    loadStoredToken();
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
  };

  return {
    ...tokenState,
    loading,
    error,
    login,
    logout
  };
}

interface ApiError extends Error {
  statusCode?: number;
  apiMessage?: string;
}

function PieResearchMethods(): JSX.Element {
  const [data, setData] = useState<DataItem[]>([]);
  
  const { 
    isAuthenticated, 
    accessToken, 
    loading: authLoading, 
    error: authError,
    login,
    logout 
  } = useFoundryAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchScholars = async () => {
      if (isAuthenticated && accessToken) {
        try {
          setLoading(true);
          
          if (typeof window === 'undefined') {
            return;
          }
          
          const FOUNDRY_URL = process.env.NEXT_PUBLIC_FOUNDRY_URL;
          const ONTOLOGY_RID = process.env.NEXT_PUBLIC_ONTOLOGY_RID;
          
          if (!FOUNDRY_URL || !ONTOLOGY_RID) {
            throw new Error(`Missing required environment variables: ${!FOUNDRY_URL ? 'FOUNDRY_URL ' : ''}${!ONTOLOGY_RID ? 'ONTOLOGY_RID ' : ''}`);
          }
          
          // Get Object Spec
          // https://www.palantir.com/docs/foundry/api/v2/ontologies-v2-resources/ontology-objects/list-objects/
          const proxyResponse = await fetch('/api/foundry-proxy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              endpoint: `/api/v2/ontologies/${ONTOLOGY_RID}/objects/Scholar`, 
              token: accessToken,
              method: 'GET',
              requestBody: {
                pageSize: 100
              }
            })
          });
          
          if (!proxyResponse.ok) {
            let errorMessage = `API request failed: ${proxyResponse.status} ${proxyResponse.statusText}`;
            
            try {
              const errorData = await proxyResponse.json();
              errorMessage += `. Details: ${JSON.stringify(errorData)}`;
            } catch (e) {
            }
            
            throw new Error(errorMessage);
          }
          
          const responseData = await proxyResponse.json();
          
          if (responseData.data && Array.isArray(responseData.data)) {
            processScholarsData(responseData.data);
          } else {
            console.error('Unexpected response structure:', responseData);
            throw new Error('Unexpected response structure from API');
          }
        } catch (err) {
          console.error('Error fetching scholars:', err);
          
          const error = err as Error;
          setError(error instanceof Error ? error : new Error(String(error)));
        } finally {
          setLoading(false);
        }
      }
    };

    const processScholarsData = (scholars: any[]) => {
      if (scholars.length > 0) {
        const methodsMap: Record<string, number> = {};
        
        for (const scholar of scholars) {
          const method = scholar.methods || scholar.method || scholar.researchMethods || 'Not Specified';
          
          if (!methodsMap[method]) {
            methodsMap[method] = 0;
          }
          methodsMap[method] += 1;
        }
        
        const chartData = Object.entries(methodsMap)
          .map(([name, value], index) => ({
            name,
            value,
            color: COLORS[index % COLORS.length]
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 7);
        
        setData(chartData);
      }
    };

    fetchScholars();
  }, [isAuthenticated, accessToken]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64 w-full bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h3 className="text-xl font-semibold text-red-600 mb-3">Authentication Error</h3>
        <p className="text-gray-700 mb-4">{authError.message}</p>
        <button 
          onClick={login} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!isAuthenticated || !accessToken) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h3 className="text-xl font-semibold mb-3">Authentication Required</h3>
        <p className="text-gray-700 mb-4">Please log in to view the scholar data</p>
        <button 
          onClick={login} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
        >
          Log in with Foundry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scholar data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-red-600 mb-3">Error Loading Data</h3>
        <p className="text-gray-700 mb-2">{error.message}</p>
        
        <div className="flex justify-center mt-4">
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200 mr-3"
          >
            Retry
          </button>
          <button 
            onClick={logout} 
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-700">No data available</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200 mt-4"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Scholars by Research Methods</h2>
        <button 
          onClick={logout} 
          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition duration-200"
        >
          Logout
        </button>
      </div>
      
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={120}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} scholars`, 'Count']}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: '4px', 
                padding: '8px', 
                boxShadow: '0 2px 5px rgba(0,0,0,0.15)', 
                border: '1px solid #e2e8f0' 
              }}
            />
            <Legend 
              layout="vertical" 
              align="right"
              verticalAlign="middle" 
              iconType="circle"
              wrapperStyle={{ 
                paddingLeft: '20px',
                fontSize: '12px'
              }}
              formatter={(value) => (
                <span style={{ color: 'rgba(0, 0, 0, 0.85)', fontWeight: 'normal' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default PieResearchMethods;