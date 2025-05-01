'use client';

import React, { useState, useEffect } from 'react';
import { fetchScholarByIdFromPalantir, fetchScholarGooglePubs, fetchScholarPubMed } from '@/components/palantir/palantirScholars';
import { PalantirScholar, PalantirGooglePub, PalantirPubMed } from '@/components/palantir/types';
import { useFoundryAuth } from '@/hooks/useFoundryAuth';

const TestScholarAllPubs: React.FC = () => {
  const auth = useFoundryAuth();
  const [scholarId, setScholarId] = useState<string>('');
  const [scholar, setScholar] = useState<PalantirScholar | null>(null);
  const [googlePubs, setGooglePubs] = useState<PalantirGooglePub[]>([]);
  const [pubmedPubs, setPubmedPubs] = useState<PalantirPubMed[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Auth status updated:', { 
      isAuthenticated: auth.isAuthenticated, 
      hasToken: !!auth.accessToken 
    });
  }, [auth.isAuthenticated, auth.accessToken]);

  const handleScholarIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScholarId(e.target.value);
  };

  const fetchData = async () => {
    if (!auth.accessToken) {
      setError('Please login first to get an access token');
      return;
    }

    if (!scholarId) {
      setError('Please provide a scholar ID');
      return;
    }

    setLoading(true);
    setError(null);
    setGooglePubs([]);
    setPubmedPubs([]);

    try {
      // First fetch the scholar to verify it exists
      const scholarData = await fetchScholarByIdFromPalantir(scholarId, auth.accessToken);
      setScholar(scholarData);

      if (!scholarData) {
        setError(`Scholar with ID ${scholarId} not found`);
        setLoading(false);
        return;
      }

      // Fetch Google publications
      try {
        const googleResponse = await fetchScholarGooglePubs(scholarId, auth.accessToken);
        setGooglePubs(googleResponse.data);
      } catch (googleErr) {
        console.error('Error fetching Google publications:', googleErr);
        setError(prev => prev ? `${prev}. Failed to fetch Google publications` : 'Failed to fetch Google publications');
      }

      // Fetch PubMed publications
      try {
        const pubmedResponse = await fetchScholarPubMed(scholarId, auth.accessToken);
        setPubmedPubs(pubmedResponse.data);
      } catch (pubmedErr) {
        console.error('Error fetching PubMed publications:', pubmedErr);
        setError(prev => prev ? `${prev}. Failed to fetch PubMed publications` : 'Failed to fetch PubMed publications');
      }
    } catch (scholarErr) {
      setError(`Error fetching scholar: ${scholarErr instanceof Error ? scholarErr.message : String(scholarErr)}`);
      console.error('Error fetching scholar data:', scholarErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Scholar Publications</h1>
      
      <div className="mb-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Authentication Status</h2>
          <p>
            {auth.isAuthenticated 
              ? `Authenticated ✅ (Token available: ${auth.accessToken ? 'Yes' : 'No'})` 
              : 'Not authenticated ❌'}
          </p>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">
          Scholar ID:
          <input
            type="text"
            value={scholarId}
            onChange={handleScholarIdChange}
            className="w-full p-2 border rounded"
            placeholder="Enter scholar ID"
          />
        </label>
      </div>
      
      <button
        onClick={fetchData}
        disabled={loading || !auth.accessToken}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-blue-300"
      >
        {loading ? 'Loading...' : 'Fetch All Publications'}
      </button>
      
      {!auth.isAuthenticated && (
        <div className="mt-4 p-4 bg-yellow-100 text-yellow-700 rounded">
          Please log in first to use this feature.
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {scholar && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <h2 className="text-xl font-semibold">{scholar.name}</h2>
          <p>Affiliation: {scholar.affiliation || 'N/A'}</p>
          <p>Scholar ID: {scholar.scholarId || 'N/A'}</p>
        </div>
      )}
      
      {/* Google Publications */}
      {googlePubs.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Google Scholar Publications ({googlePubs.length})</h2>
          <div className="space-y-4">
            {googlePubs.map((pub) => (
              <div key={pub.id} className="p-4 border rounded">
                <h3 className="font-medium">{pub.title}</h3>
                {pub.author && <p>Authors: {pub.author}</p>}
                {pub.journal && <p>Journal: {pub.journal}</p>}
                {pub.pubYear && <p>Year: {pub.pubYear}</p>}
                {pub.numCitations !== undefined && <p>Citations: {pub.numCitations}</p>}
                {pub.pubUrl && (
                  <a 
                    href={pub.pubUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View Publication
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* PubMed Publications */}
      {pubmedPubs.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">PubMed Publications ({pubmedPubs.length})</h2>
          <div className="space-y-4">
            {pubmedPubs.map((pub, index) => (
              <div key={pub.id || `pubmed-${index}`} className="p-4 border rounded">
                <h3 className="font-medium">{pub.title}</h3>
                {pub.authors && <p>Authors: {pub.authors}</p>}
                {pub.abstract && <p>Abstract: {pub.abstract.substring(0, 200)}...</p>}
                {pub.pmid && <p>PMID: {pub.pmid}</p>}
                {pub.publicationType && <p>Type: {pub.publicationType}</p>}
                {pub.doi && (
                  <a 
                    href={`https://doi.org/${pub.doi}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline mr-4"
                  >
                    View DOI
                  </a>
                )}
                {pub.pmid && (
                  <a 
                    href={`https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View on PubMed
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {scholar && googlePubs.length === 0 && pubmedPubs.length === 0 && !loading && (
        <div className="mt-4 p-4 bg-yellow-100 text-yellow-700 rounded">
          No publications found for this scholar.
        </div>
      )}
    </div>
  );
};

export default TestScholarAllPubs;