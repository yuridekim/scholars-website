'use client';

import { useState, useEffect } from 'react';
import { Scholar, FilterState, DashboardStats } from '@/lib/types';
import { useFoundryAuth } from '@/hooks/useFoundryAuth';

interface UseScholarsResult {
    scholars: Scholar[];
    filteredScholars: Scholar[];
    loading: boolean;
    error: string | null;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filters: FilterState;
    setFilters: (filters: FilterState) => void;
    uniqueAffiliations: string[];
    uniqueEmailDomains: string[];
    stats: DashboardStats;
    refreshScholars: () => Promise<void>;
}

export const useScholars = (): UseScholarsResult => {
    const auth = useFoundryAuth();
    const [scholars, setScholars] = useState<Scholar[]>([]);
    const [filteredScholars, setFilteredScholars] = useState<Scholar[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<FilterState>({
        affiliation: '',
        emailDomain: '',
        citationRange: '',
        hIndexRange: '',
    });
    const [uniqueAffiliations, setUniqueAffiliations] = useState<string[]>([]);
    const [uniqueEmailDomains, setUniqueEmailDomains] = useState<string[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
      totalScholars: 0,
      totalCitations: 0,
      averageHIndex: 0,
      yearlyStats: [],
    });

    const calculateStats = (scholarData: Scholar[]) => {
      // Calculate basic stats
      const totalScholars = scholarData.length;
      const totalCitations = scholarData.reduce((sum, scholar) => sum + (scholar.citedby || 0), 0);
      const averageHIndex = scholarData.length > 0 
        ? scholarData.reduce((sum, scholar) => sum + (scholar.hindex || 0), 0) / totalScholars 
        : 0;
  
      // Calculate yearly stats from publications
      const yearlyData: Map<string, { papers: number; citations: number }> = new Map();
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - 4;
  
      // Initialize years
      for (let year = startYear; year <= currentYear; year++) {
        yearlyData.set(year.toString(), { papers: 0, citations: 0 });
      }
  
      // Aggregate publication data
      scholarData.forEach(scholar => {
        scholar.googleScholarPubs?.forEach(pub => {
          if (pub.pubYear && pub.pubYear >= startYear) {
            const yearStats = yearlyData.get(pub.pubYear.toString());
            if (yearStats) {
              yearStats.papers += 1;
              yearStats.citations += pub.numCitations || 0;
            }
          }
        });
      });
  
      // Convert to array format for chart
      const yearlyStats = Array.from(yearlyData.entries()).map(([name, data]) => ({
        name,
        ...data
      }));
  
      setStats({
        totalScholars,
        totalCitations,
        averageHIndex: Math.round(averageHIndex * 10) / 10,
        yearlyStats: yearlyStats.sort((a, b) => a.name.localeCompare(b.name))
      });
    };

    // Create fetchScholars function that can be called from outside
    const fetchScholars = async () => {
        try {
            // Check if session is expired before making the API call
            if (!auth.accessToken || (auth.expiresAt && Date.now() >= auth.expiresAt)) {
                // Don't set a specific error message, just clear data and stop loading
                setScholars([]);
                setFilteredScholars([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            
            const response = await fetch('/api/scholars', {
                headers: {
                    'Authorization': `Bearer ${auth.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!Array.isArray(data)) {
                console.error('Received non-array data:', data);
                setError('Invalid data format received');
                setScholars([]);
                setFilteredScholars([]);
                return;
            }

            setScholars(data);
            setFilteredScholars(data);
            
            const affiliations = Array.from(
                new Set(data.map(s => s.affiliation).filter((aff): aff is string => !!aff))
            ).sort();
            
            const domains = Array.from(
                new Set(data.map(s => s.emailDomain).filter((domain): domain is string => !!domain))
            ).sort();

            setUniqueAffiliations(affiliations);
            setUniqueEmailDomains(domains);
            calculateStats(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching scholars:', err);
            setError(err instanceof Error ? err.message : 'Failed to load scholars');
            setScholars([]);
            setFilteredScholars([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch if there's a valid token and it's not expired
        if (auth.accessToken && (!auth.expiresAt || Date.now() < auth.expiresAt)) {
            fetchScholars();
        } else if (auth.accessToken && auth.expiresAt && Date.now() >= auth.expiresAt) {
            // Don't set specific error message, just clear data and stop loading
            setScholars([]);
            setFilteredScholars([]);
            setLoading(false);
        } else {
            // When there's no token yet
            setLoading(false);
        }
    }, [auth.accessToken, auth.expiresAt]); // Re-fetch when token or expiration changes

    useEffect(() => {
        if (scholars.length === 0) {
            return;
        }
        
        const filtered = scholars.filter(scholar => {
            const matchesSearch = scholar.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
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
        calculateStats(filtered);
    }, [searchQuery, filters, scholars]);

    return {
        scholars,
        filteredScholars,
        loading,
        error,
        searchQuery,
        setSearchQuery,
        filters,
        setFilters,
        uniqueAffiliations,
        uniqueEmailDomains,
        stats,
        refreshScholars: fetchScholars 
    };
};