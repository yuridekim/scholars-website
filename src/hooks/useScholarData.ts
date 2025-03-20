'use client';

import { useState, useEffect } from 'react';
import { AuthState } from '@/hooks/useFoundryAuth';

interface Scholar {
  methods?: string;
  method?: string;
  researchMethods?: string;
  focus?: string;
  Focus?: string;
  [key: string]: any;
}

export interface ScholarDataState {
  scholars: Scholar[];
  loading: boolean;
  error: Error | null;
}

export function useScholarData(auth: AuthState): ScholarDataState {
  const [state, setState] = useState<ScholarDataState>({
    scholars: [],
    loading: false,
    error: null
  });

  const { isAuthenticated, accessToken } = auth;

  useEffect(() => {
    const fetchScholars = async () => {
      if (!isAuthenticated || !accessToken || typeof window === 'undefined') {
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
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
              pageSize: 290
            }
          })
        });
        
        if (!proxyResponse.ok) {
          const errorText = await proxyResponse.text();
          throw new Error(`API request failed: ${proxyResponse.status} ${proxyResponse.statusText}. Details: ${errorText}`);
        }
        
        const responseData = await proxyResponse.json();
        
        if (responseData.data && Array.isArray(responseData.data)) {
          setState({
            scholars: responseData.data,
            loading: false,
            error: null
          });
        } else {
          throw new Error('Unexpected response structure from API');
        }
      } catch (err) {
        console.error('Error fetching scholars:', err);
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err))
        }));
      }
    };

    fetchScholars();
  }, [isAuthenticated, accessToken]);

  return state;
}
