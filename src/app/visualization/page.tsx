'use client'
import { useEffect, useState } from 'react';
import type { Scholar } from '@/lib/types';
import ScholarDashboard from '@/components/visualizations/ScholarDashboard';

export default function VisualizationPage() {
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [selectedScholar, setSelectedScholar] = useState<Scholar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all scholars for the dropdown
  useEffect(() => {
    const fetchScholars = async () => {
      try {
        const response = await fetch('/api/scholars');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setScholars(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching scholars:', error);
        setError('Failed to load scholars');
        setLoading(false);
      }
    };

    fetchScholars();
  }, []);

  // Fetch selected scholar data
  useEffect(() => {
    if (!selectedScholar?.id) return;

    const fetchScholarData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/scholars/${selectedScholar.id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSelectedScholar(data);
      } catch (error) {
        console.error('Error fetching scholar data:', error);
        setError('Failed to load scholar details');
      } finally {
        setLoading(false);
      }
    };

    fetchScholarData();
  }, [selectedScholar?.id]);

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <label htmlFor="scholar-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Scholar
        </label>
        <select
          id="scholar-select"
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={selectedScholar?.id || ''}
          onChange={(e) => {
            const selected = scholars.find(s => s.id === Number(e.target.value));
            setSelectedScholar(selected || null);
          }}
        >
          <option value="">Choose a scholar...</option>
          {scholars.map((scholar) => (
            <option key={scholar.id} value={scholar.id}>
              {scholar.name} {scholar.affiliation ? `- ${scholar.affiliation}` : ''}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {!loading && selectedScholar && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedScholar.fullName || selectedScholar.name}
            </h2>
            {selectedScholar.affiliation && (
              <p className="text-gray-600">{selectedScholar.affiliation}</p>
            )}
            {selectedScholar.interests && (
              <p className="text-sm text-gray-500 mt-2">
                Interests: {selectedScholar.interests}
              </p>
            )}
          </div>
          <ScholarDashboard scholar={selectedScholar} />
        </div>
      )}

      {!loading && !selectedScholar && (
        <div className="text-center py-8 text-gray-500">
          Please select a scholar to view their dashboard
        </div>
      )}
    </div>
  );
}