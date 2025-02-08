'use client'

import React, { useState, useEffect } from 'react';
import { Search, Filter, List, X, Grid, Layers } from 'lucide-react';
import { Scholar } from '@/lib/types';
import { useRouter } from 'next/navigation';
import DualVisualization from '@/components/visualizations/MainViz';

interface FilterState {
  affiliation: string;
  emailDomain: string;
  citationRange: string;
  hIndexRange: string;
}

interface TopicInfo {
  topic_id: string;
  topic_name: string;
  topic_description: string;
  general_class14: number;
  topic_popularity: number;
  w1: number;
  w2: number;
}

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [filteredScholars, setFilteredScholars] = useState<Scholar[]>([]);
  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'cluster' | 'grid'>('cluster');
  const [filters, setFilters] = useState<FilterState>({
    affiliation: '',
    emailDomain: '',
    citationRange: '',
    hIndexRange: '',
  });
  const [uniqueAffiliations, setUniqueAffiliations] = useState<string[]>([]);
  const [uniqueEmailDomains, setUniqueEmailDomains] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/scholars').then(res => res.json()) as Promise<Scholar[]>,
      fetch('/api/topics').then(res => res.json()) as Promise<TopicInfo[]>
    ])
      .then(([scholarData, topicData]) => {
        setScholars(scholarData);
        setFilteredScholars(scholarData);
        setTopics(topicData);
        
        const affiliations = Array.from(
          new Set(
            scholarData
              .map(s => s.affiliation)
              .filter((aff): aff is string => !!aff)
          )
        ).sort() as string[];
  
        const domains = Array.from(
          new Set(
            scholarData
              .map(s => s.emailDomain)
              .filter((domain): domain is string => !!domain)
          )
        ).sort() as string[];
        
        setUniqueAffiliations(affiliations);
        setUniqueEmailDomains(domains);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const filtered = scholars.filter(scholar => {
      const matchesSearch = scholar.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAffiliation = !filters.affiliation || scholar.affiliation === filters.affiliation;
      const matchesEmailDomain = !filters.emailDomain || scholar.emailDomain === filters.emailDomain;
      
      let matchesCitations = true;
      if (filters.citationRange) {
        const [min, max] = filters.citationRange.split('-').map(Number);
        const citations = scholar.citedby ?? 0;
        matchesCitations = citations >= min && (!max || citations <= max);
      }

      let matchesHIndex = true;
      if (filters.hIndexRange) {
        const [min, max] = filters.hIndexRange.split('-').map(Number);
        const hIndex = scholar.hindex ?? 0;
        matchesHIndex = hIndex >= min && (!max || hIndex <= max);
      }

      return matchesSearch && matchesAffiliation && matchesEmailDomain && matchesCitations && matchesHIndex;
    });

    setFilteredScholars(filtered);
  }, [searchQuery, filters, scholars]);

  const resetFilters = () => {
    setFilters({
      affiliation: '',
      emailDomain: '',
      citationRange: '',
      hIndexRange: '',
    });
    setShowFilters(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Research Topics & Scholar Tracker</h1>
          <div className="flex gap-4">
            <button 
              onClick={() => router.push('/scholars')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <List size={20} />
              View All Scholars
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-lg shadow mb-8">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search scholars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${showFilters ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <Filter size={20} />
              Filters
              {Object.values(filters).some(f => f) && (
                <span className="ml-2 px-2 py-0.5 text-sm bg-blue-100 text-blue-800 rounded-full">
                  {Object.values(filters).filter(f => f).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'cluster' ? 'grid' : 'cluster')}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              {viewMode === 'cluster' ? <Grid size={20} /> : <Layers size={20} />}
              {viewMode === 'cluster' ? 'Grid View' : 'Cluster View'}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Affiliation</label>
                  <select
                    value={filters.affiliation}
                    onChange={(e) => setFilters(prev => ({ ...prev, affiliation: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">All Affiliations</option>
                    {uniqueAffiliations.map(aff => (
                      <option key={aff} value={aff}>{aff}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Domain</label>
                  <select
                    value={filters.emailDomain}
                    onChange={(e) => setFilters(prev => ({ ...prev, emailDomain: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">All Domains</option>
                    {uniqueEmailDomains.map(domain => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Citations Range</label>
                  <select
                    value={filters.citationRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, citationRange: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Any Citations</option>
                    <option value="0-100">0-100</option>
                    <option value="101-500">101-500</option>
                    <option value="501-1000">501-1,000</option>
                    <option value="1001-5000">1,001-5,000</option>
                    <option value="5001-">5,001+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">h-index Range</label>
                  <select
                    value={filters.hIndexRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, hIndexRange: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Any h-index</option>
                    <option value="0-10">0-10</option>
                    <option value="11-20">11-20</option>
                    <option value="21-30">21-30</option>
                    <option value="31-50">31-50</option>
                    <option value="51-">51+</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  <X size={16} />
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Topic Visualization */}
        <div className="mb-8">
        <DualVisualization topicData={topics} />;
        </div>
      </div>
    </div>
  );
}