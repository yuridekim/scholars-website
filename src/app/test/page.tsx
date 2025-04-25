'use client'
import { useState, useEffect } from 'react';
import { fetchScholarsFromPalantir, PalantirScholar } from '@/components/palantir/palantirScholars';
import { useFoundryAuth } from '@/hooks/useFoundryAuth';

export default function TestScholarsPage() {
  const [scholars, setScholars] = useState<PalantirScholar[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useFoundryAuth();

  const handleFetchScholars = async () => {
    if (!auth.accessToken) {
      setError('Not authenticated. Please log in to Foundry first.');
      return;
    }

    setLoading(true);
    setError(null);
    setScholars([]);

    try {
      const result = await fetchScholarsFromPalantir(auth.accessToken);
      setScholars(result.data);
      console.log('Fetched scholars:', result.data);
    } catch (err) {
      console.error('Error fetching scholars:', err);
      setError(`Error fetching scholars: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.accessToken) {
      handleFetchScholars();
    }
  }, [auth.accessToken]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Scholar Profiles Fetch</h1>
      
      {!auth.accessToken ? (
        <div className="bg-amber-100 p-4 rounded border border-amber-300 mb-4">
          <p>Not authenticated. Please log in to Foundry first.</p>
          {auth.login && (
            <button 
              onClick={auth.login}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Log in to Foundry
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4">
            <button 
              onClick={handleFetchScholars} 
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {loading ? 'Loading...' : 'Refresh Scholars'}
            </button>
          </div>

          {loading && (
            <div className="text-gray-500">Loading scholars...</div>
          )}
          
          {error && (
            <div className="bg-red-100 p-4 rounded border border-red-300 mb-4 text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && scholars.length === 0 && (
            <div className="bg-gray-100 p-4 rounded">
              No scholars found. The object type may not exist in your Palantir instance or has no data.
            </div>
          )}

          {scholars.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Scholar Profiles ({scholars.length})</h2>
              <div className="bg-gray-100 p-4 rounded overflow-auto max-h-[600px]">
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(scholars, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}