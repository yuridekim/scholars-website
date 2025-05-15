'use client';

import { useState, useEffect } from 'react';
import { AuthState } from '@/hooks/useFoundryAuth';
import { Publication, Scholar } from '@/components/palantir/palantirService';
export interface PalantirDataState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  nextPageToken?: string;
  hasMore: boolean;
}

interface UsePalantirDataOptions {
  objectType: string;
  pageSize?: number;
  initialFilter?: string;
}

export function usePalantirData<T>(
  auth: AuthState,
  options: UsePalantirDataOptions
): PalantirDataState<T> & { loadMore: () => Promise<void> } {
  const { objectType, pageSize = 100, initialFilter } = options;
  
  const [state, setState] = useState<PalantirDataState<T>>({
    data: [],
    loading: false,
    error: null,
    hasMore: true
  });

  const { isAuthenticated, accessToken } = auth;

  const fetchData = async (pageToken?: string) => {
    if (!isAuthenticated || !accessToken || typeof window === 'undefined') {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const FOUNDRY_URL = process.env.NEXT_PUBLIC_FOUNDRY_URL;
      const ONTOLOGY_RID = process.env.NEXT_PUBLIC_ONTOLOGY_RID;
      
      if (!FOUNDRY_URL || !ONTOLOGY_RID) {
        throw new Error(`Missing required values: ${!FOUNDRY_URL ? 'FOUNDRY_URL ' : ''}${!ONTOLOGY_RID ? 'NEXT_PUBLIC_ONTOLOGY_RID ' : ''}`);
      }
      
      const requestBody: Record<string, any> = {
        pageSize: pageSize
      };
      
      if (pageToken) {
        requestBody.pageToken = pageToken;
      }
      
      if (initialFilter) {
        requestBody.filter = initialFilter;
      }
      
      const proxyResponse = await fetch('/api/foundry-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: `/api/v2/ontologies/${ONTOLOGY_RID}/objects/${objectType}`, 
          token: accessToken,
          method: 'GET',
          requestBody
        })
      });
      
      if (!proxyResponse.ok) {
        const errorText = await proxyResponse.text();
        throw new Error(`API request failed: ${proxyResponse.status} ${proxyResponse.statusText}. Details: ${errorText}`);
      }
      
      const responseData = await proxyResponse.json();
      
      if (responseData.data && Array.isArray(responseData.data)) {
        if (pageToken) {
          setState(prev => ({
            data: [...prev.data, ...responseData.data],
            loading: false,
            error: null,
            nextPageToken: responseData.nextPageToken,
            hasMore: !!responseData.nextPageToken
          }));
        } else {
          setState({
            data: responseData.data,
            loading: false,
            error: null,
            nextPageToken: responseData.nextPageToken,
            hasMore: !!responseData.nextPageToken
          });
        }
      } else {
        throw new Error('Unexpected response structure from API');
      }
    } catch (err) {
      console.error(`Error fetching ${objectType}:`, err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err))
      }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated, accessToken]);

  const loadMore = async () => {
    if (state.loading || !state.hasMore || !state.nextPageToken) {
      return;
    }
    
    await fetchData(state.nextPageToken);
  };

  return {
    ...state,
    loadMore
  };
}

export function useScholarData(
  auth: AuthState, 
  pageSize = 290
): PalantirDataState<Scholar> & { loadMore: () => Promise<void> } {
  return usePalantirData<Scholar>(auth, {
    objectType: 'Scholar',
    pageSize
  });
}

export function usePublicationData(
  auth: AuthState, 
  pageSize = 100
): PalantirDataState<Publication> & { loadMore: () => Promise<void> } {
  return usePalantirData<Publication>(auth, {
    objectType: 'Publications',
    pageSize
  });
}