'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { initiateAuthFlow } from '@/hooks/auth-utils';

interface DataItem {
  name: string;
  value: number;
  color?: string;
}

interface ApiError extends Error {
  status?: number;
  response?: any;
  requestInfo?: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

export const useFoundryAuth = () => {
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
};

const PieResearchMethods: React.FC = () => {
  const { 
    isAuthenticated, 
    accessToken, 
    loading: authLoading, 
    error: authError,
    login 
  } = useFoundryAuth();
  
  const [data, setData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    
    const fetchScholars = async () => {
      try {
        if (typeof window === 'undefined') {
          return;
        }
        
        const FOUNDRY_URL = process.env.NEXT_PUBLIC_FOUNDRY_URL;
        const ONTOLOGY_RID = process.env.NEXT_PUBLIC_ONTOLOGY_RID;
        
        if (!FOUNDRY_URL || !ONTOLOGY_RID) {
          throw new Error(`Missing required environment variables: ${!FOUNDRY_URL ? 'FOUNDRY_URL ' : ''}${!ONTOLOGY_RID ? 'ONTOLOGY_RID ' : ''}`);
        }
        
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
      } catch (error) {
        console.error('Error fetching scholars:', error);
        
        const err = error as Error;
        const enhancedError: ApiError = new Error(
          err instanceof Error ? err.message : String(err)
        );
        
        if (err instanceof Error) {
          enhancedError.stack = err.stack;
          
          Object.keys(err).forEach(key => {
            (enhancedError as any)[key] = (err as any)[key];
          });
        }
        
        setError(enhancedError);
      } finally {
        setLoading(false);
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
    return <div>Checking authentication...</div>;
  }

  if (authError) {
    return (
      <div className="error-container">
        <h3>Authentication Error</h3>
        <p>{authError.message}</p>
        <button onClick={login} className="login-button">
          Try Again
        </button>
      </div>
    );
  }

  if (!isAuthenticated || !accessToken) {
    return (
      <div className="login-container">
        <h3>Authentication Required</h3>
        <p>Please log in to view the scholar data</p>
        <button onClick={login} className="login-button">
          Log in with Foundry
        </button>
      </div>
    );
  }

  if (loading) {
    return <div>Loading scholar data...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error Loading Data</h3>
        <p>{error.message}</p>
        
        {error.status && (
          <p>Status Code: {error.status}</p>
        )}
      </div>
    );
  }

  if (data.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div className="chart-container">
      <h2>Scholars by Research Methods</h2>
      <PieChart width={500} height={400}>
        <Pie
          data={data}
          cx={250}
          cy={180}
          labelLine={true}
          outerRadius={120}
          innerRadius={60}
          fill="#8884d8"
          dataKey="value"
          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} scholars`, 'Count']} />
        <Legend layout="vertical" verticalAlign="bottom" align="center" />
      </PieChart>
    </div>
  );
};

export default PieResearchMethods;