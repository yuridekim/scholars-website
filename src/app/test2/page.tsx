'use client'
import React, { useState, useEffect } from 'react';
import { 
  fetchPubMedFromPalantir, 
  fetchPubMedByIdFromPalantir,
  fetchPubMedScholars
} from '@/components/palantir/pubMed';
import { PalantirPubMed, PalantirScholar, FetchResponse } from '@/components/palantir/types';
import { useFoundryAuth } from '@/hooks/useFoundryAuth';

// Add interface for debugging info
interface DebugInfo {
  requestUrl?: string;
  requestHeaders?: Record<string, string>;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  error?: any;
}

const PubMedFetchTest = (): React.ReactElement => {
  // Use the Foundry auth hook
  const auth = useFoundryAuth();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pubMedList, setPubMedList] = useState<PalantirPubMed[]>([]);
  const [selectedPubId, setSelectedPubId] = useState<string>('');
  const [selectedPub, setSelectedPub] = useState<PalantirPubMed | null>(null);
  const [scholars, setScholars] = useState<PalantirScholar[]>([]);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [showDebug, setShowDebug] = useState<boolean>(false);

  // Direct fetch test to help identify issues
  const testDirectFetch = async () => {
    if (!auth.isAuthenticated) {
      setError('Not authenticated. Please log in first.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setDebugInfo(null);
    
    const debug: DebugInfo = {};
    
    try {
      console.log('Testing direct fetch using service functions');
      console.log('Authentication status:', auth.isAuthenticated ? 'Authenticated' : 'Not authenticated');
      console.log('Using accessToken:', auth.accessToken ? `${auth.accessToken.substring(0, 10)}...` : 'None available');
      
      // Try a simpler version of the fetch to identify what's happening
      const response = await fetchPubMedFromPalantir(auth.accessToken);
      
      debug.responseStatus = 200; // If we get here, we succeeded
      
      console.log('Direct test succeeded! Response:', response);
      setError('Direct test successful - see console for details');
    } catch (err) {
      console.error('Direct test failed:', err);
      
      // Capture error details for debugging
      debug.error = err instanceof Error ? err.message : 'Unknown error';
      setError(`Direct test failed: ${debug.error}`);
    } finally {
      setDebugInfo(debug);
      setLoading(false);
    }
  };

  // Fetch all PubMed entities with better error handling
  const handleFetchAll = async () => {
    if (!auth.isAuthenticated) {
      setError('Not authenticated. Please log in first.');
      return;
    }
  
    setLoading(true);
    setError(null);
    setDebugInfo(null);
    
    try {
      console.log('Fetching all PubMed entities');
      console.log('Authentication status:', auth.isAuthenticated ? 'Authenticated' : 'Not authenticated');
      
      const response = await fetchPubMedFromPalantir(auth.accessToken);
      
      // Check if response is valid
      if (!response) {
        throw new Error('No response received from server');
      }
      
      // Check if data exists and is an array
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('Response has unexpected format:', response);
        setPubMedList([]);
        throw new Error('Invalid response format: data property missing or not an array');
      }
      
      setPubMedList(response.data);
      console.log('Fetched PubMed entities:', response);
    } catch (err) {
      console.error('Error fetching PubMed entities:', err);
      
      // Capture and display the error
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      
      // Log detailed error info to console for debugging
      console.error('Detailed error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a specific PubMed entity by ID with better error handling
  const handleFetchById = async () => {
    if (!auth.isAuthenticated) {
      setError('Not authenticated. Please log in first.');
      return;
    }
  
    if (!selectedPubId) {
      setError('Please enter a PubMed ID');
      return;
    }

    setLoading(true);
    setError(null);
    setDebugInfo(null);
    
    try {
      console.log(`Fetching PubMed by ID ${selectedPubId}`);
      
      const response = await fetchPubMedByIdFromPalantir(selectedPubId, auth.accessToken);
      
      // Check if response is valid
      if (!response) {
        throw new Error('No response received from server');
      }
      
      setSelectedPub(response);
      console.log('Fetched PubMed by ID:', response);
    } catch (err) {
      console.error('Error fetching PubMed by ID:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch scholars linked to a PubMed entity with better error handling
  const handleFetchScholars = async () => {
    if (!auth.isAuthenticated) {
      setError('Not authenticated. Please log in first.');
      return;
    }
  
    if (!selectedPubId) {
      setError('Please enter a PubMed ID');
      return;
    }

    setLoading(true);
    setError(null);
    setDebugInfo(null);
    
    try {
      console.log(`Fetching scholars for PubMed ID ${selectedPubId}`);
      
      const response = await fetchPubMedScholars(
        selectedPubId,
        'ScholarProfiles',
        auth.accessToken
      );
      
      // Check if response is valid
      if (!response) {
        throw new Error('No response received from server');
      }
      
      // Check if data exists and is an array
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('Response has unexpected format:', response);
        setScholars([]);
        throw new Error('Invalid response format: data property missing or not an array');
      }
      
      setScholars(response.data);
      console.log('Fetched linked scholars:', response);
    } catch (err) {
      console.error('Error fetching linked scholars:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pubmed-fetch-test">
      <h2>PubMed Fetch Test</h2>

      {error && (
        <div className="error-message" style={{ color: 'red', margin: '10px 0', padding: '10px', backgroundColor: '#fff0f0', borderRadius: '4px', border: '1px solid #ffb0b0' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="test-controls" style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleFetchAll}
          disabled={loading}
          className="fetch-button"
          style={{ 
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Fetch All PubMed Entities'}
        </button>

        <div style={{ margin: '15px 0' }}>
          <input
            type="text"
            value={selectedPubId}
            onChange={(e) => setSelectedPubId(e.target.value)}
            placeholder="Enter PubMed ID"
            style={{ 
              padding: '8px',
              marginRight: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              width: '200px'
            }}
          />
          <button
            onClick={handleFetchById}
            disabled={loading}
            style={{ 
              padding: '8px 16px',
              marginRight: '10px',
              backgroundColor: '#48bb78',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Fetch by ID
          </button>
          <button
            onClick={handleFetchScholars}
            disabled={loading}
            style={{ 
              padding: '8px 16px',
              backgroundColor: '#805ad5',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Fetch Linked Scholars
          </button>
        </div>
        
        {/* Add debug test button */}
        <div style={{ marginTop: '15px' }}>
          <button
            onClick={testDirectFetch}
            disabled={loading}
            style={{ 
              padding: '8px 16px',
              backgroundColor: '#f6ad55',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Debug API Connection
          </button>
          
          <button
            onClick={() => setShowDebug(!showDebug)}
            style={{ 
              padding: '8px 16px',
              marginLeft: '10px',
              backgroundColor: '#a0aec0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showDebug ? 'Hide Debugging Info' : 'Show Debugging Info'}
          </button>
        </div>
        
        {/* Display debugging info */}
                    {showDebug && (
          <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ marginTop: 0 }}>Debugging Information</h4>
            <p style={{ margin: '5px 0' }}>
              <strong>Authentication Status:</strong> {auth.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </p>
            <p style={{ margin: '5px 0' }}>
              <strong>Access Token (first 10 chars):</strong> {auth.accessToken ? `${auth.accessToken.substring(0, 10)}...` : 'Not available'}
            </p>
            
            {debugInfo && (
              <div>
                <p style={{ margin: '5px 0' }}><strong>Request URL:</strong> {debugInfo.requestUrl}</p>
                {debugInfo.requestHeaders && (
                  <div>
                    <p style={{ margin: '5px 0' }}><strong>Request Headers:</strong></p>
                    <pre style={{ backgroundColor: '#edf2f7', padding: '8px', borderRadius: '4px', overflow: 'auto' }}>
                      {JSON.stringify(debugInfo.requestHeaders, null, 2)}
                    </pre>
                  </div>
                )}
                {debugInfo.responseStatus !== undefined && (
                  <p style={{ margin: '5px 0' }}><strong>Response Status:</strong> {debugInfo.responseStatus}</p>
                )}
                {debugInfo.responseHeaders && (
                  <div>
                    <p style={{ margin: '5px 0' }}><strong>Response Headers:</strong></p>
                    <pre style={{ backgroundColor: '#edf2f7', padding: '8px', borderRadius: '4px', overflow: 'auto' }}>
                      {JSON.stringify(debugInfo.responseHeaders, null, 2)}
                    </pre>
                  </div>
                )}
                {debugInfo.error && (
                  <div>
                    <p style={{ margin: '5px 0', color: 'red' }}><strong>Error:</strong> {debugInfo.error}</p>
                  </div>
                )}
              </div>
            )}
            
            <div style={{ marginTop: '10px' }}>
              <h4 style={{ marginBottom: '5px' }}>Troubleshooting Tips:</h4>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                <li>Check browser console for detailed error messages</li>
                <li>Ensure your API is properly handling the requests</li>
                <li>Check for CORS errors in Network tab of browser developer tools</li>
                <li>Try inspecting the response in browser developer tools' Network tab</li>
                <li>Verify that your API service has proper error handling</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Display results */}
      {pubMedList.length > 0 && (
        <div className="results-section">
          <h3>All PubMed Entities ({pubMedList.length})</h3>
          <div className="results-list" style={{ maxHeight: '300px', overflow: 'auto' }}>
            {pubMedList.map((pub, index) => (
              <div 
                key={pub.id || index} 
                className="result-item"
                style={{ 
                  padding: '10px', 
                  margin: '5px 0', 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedPubId(pub.id?.toString() || '')}
              >
                <div><strong>ID:</strong> {pub.id}</div>
                <div><strong>Title:</strong> {pub.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedPub && (
        <div className="single-result" style={{ margin: '20px 0', padding: '15px', backgroundColor: '#e6f7ff', borderRadius: '4px' }}>
          <h3>Selected PubMed Entity</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(selectedPub, null, 2)}
          </pre>
        </div>
      )}

      {scholars.length > 0 && (
        <div className="scholars-section">
          <h3>Linked Scholars ({scholars.length})</h3>
          <div className="scholars-list" style={{ maxHeight: '300px', overflow: 'auto' }}>
            {scholars.map((scholar, index) => (
              <div 
                key={scholar.id || index} 
                className="scholar-item"
                style={{ 
                  padding: '10px', 
                  margin: '5px 0', 
                  backgroundColor: '#f0fff4', 
                  borderRadius: '4px'
                }}
              >
                <div><strong>ID:</strong> {scholar.id}</div>
                <div><strong>Name:</strong> {scholar.name}</div>
                <div><strong>Institution:</strong> {scholar.institution}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-indicator" style={{ textAlign: 'center', margin: '20px 0' }}>
          Loading data...
        </div>
      )}
    </div>
  );
};

export default PubMedFetchTest;