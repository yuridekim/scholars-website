'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

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

const ScholarMethodsPieChart: React.FC = () => {
  const [data, setData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const initializeAndFetch = async () => {
      try {
        if (typeof window === 'undefined') {
          return;
        }
        
        const FOUNDRY_URL = process.env.NEXT_PUBLIC_FOUNDRY_URL;
        const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;
        const ONTOLOGY_RID = process.env.NEXT_PUBLIC_ONTOLOGY_RID;
        const CLIENT_SECRET = process.env.NEXT_PUBLIC_CLIENT_SECRET;

        const SCOPES = [
          "api:ontologies-read",
          "api:ontologies-write",
          "api:mediasets-read",
          "api:mediasets-write"
        ];

        if (!FOUNDRY_URL || !CLIENT_ID || !ONTOLOGY_RID || !CLIENT_SECRET) {
            throw new Error(`Missing required environment variables: ${!FOUNDRY_URL ? 'FOUNDRY_URL ' : ''}${!CLIENT_ID ? 'CLIENT_ID ' : ''}${!ONTOLOGY_RID ? 'ONTOLOGY_RID ' : ''}${!CLIENT_SECRET ? 'CLIENT_SECRET' : ''}`);
        }

        const osdkOauth = await import('@osdk/oauth');
        const osdkClient = await import('@osdk/client');
        const scholarsSdk = await import('@scholars-website/sdk');
        
        const auth = osdkOauth.createConfidentialOauthClient(CLIENT_ID, CLIENT_SECRET, FOUNDRY_URL, SCOPES);
        const client = osdkClient.createClient(FOUNDRY_URL, ONTOLOGY_RID, auth);

        const allScholars: any[] = [];
        let nextPageToken: string | undefined = undefined;
        let hasMorePages = true;
        
        const Scholar = scholarsSdk.Scholar;
        
        while (hasMorePages) {
          const fetchArgs: any = { $pageSize: 100 };
          if (nextPageToken) {
            fetchArgs.$nextPageToken = nextPageToken;
          }
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
          });
          
          const clientScholar = client(Scholar);
          
          if (!clientScholar.fetchPage) {
            throw new Error('fetchPage method not found on client(Scholar) object');
          }
          
          const fetchPagePromise = clientScholar.fetchPage(fetchArgs);
          const response = await Promise.race([fetchPagePromise, timeoutPromise]) as any;
          
          if (response.data) {
            allScholars.push(...response.data);
          }
          
          if (response.nextPageToken) {
            nextPageToken = response.nextPageToken;
          } else {
            hasMorePages = false;
          }
          
        }

        processScholarsData(allScholars);
        
      } catch (error) {
        const err = error as Error;
        
        console.error('Error in initializeAndFetch:', err);
        
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
        setLoading(false);
      }
    };

    const processScholarsData = (scholars: any[]) => {
      if (scholars.length > 0) {
        const methodsMap: Record<string, number> = {};
        
        for (const scholar of scholars) {
          const method = scholar.methods || 'Not Specified';
          
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
      
      setLoading(false);
    };
    
    initializeAndFetch();
  }, []);

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

export default ScholarMethodsPieChart;