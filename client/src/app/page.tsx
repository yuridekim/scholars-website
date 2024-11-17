// src/app/page.tsx
'use client'
'use client'

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Search, Filter, Download, Users, List } from 'lucide-react';
import { Scholar, GoogleScholarPub } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface YearlyStats {
  name: string;
  papers: number;
  citations: number;
}

interface DashboardStats {
  totalScholars: number;
  totalCitations: number;
  averageHIndex: number;
  yearlyStats: YearlyStats[];
}

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalScholars: 0,
    totalCitations: 0,
    averageHIndex: 0,
    yearlyStats: [],
  });

  useEffect(() => {
    fetch('/api/scholars')
      .then((res) => res.json())
      .then((data: Scholar[]) => {
        setScholars(data);
        calculateStats(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching scholars:', error);
        setLoading(false);
      });
  }, []);

  const calculateStats = (scholars: Scholar[]) => {
    // Calculate basic stats
    const totalScholars = scholars.length;
    const totalCitations = scholars.reduce((sum, scholar) => sum + (scholar.citedby || 0), 0);
    const averageHIndex = scholars.reduce((sum, scholar) => sum + (scholar.hindex || 0), 0) / totalScholars;

    // Calculate yearly stats from publications
    const yearlyData: Map<string, { papers: number; citations: number }> = new Map();
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 4;

    // Initialize years
    for (let year = startYear; year <= currentYear; year++) {
      yearlyData.set(year.toString(), { papers: 0, citations: 0 });
    }

    // Aggregate publication data
    scholars.forEach(scholar => {
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

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Affiliation', 'Citations', 'H-Index', 'Email Domain'].join(','),
      ...scholars.map(scholar => [
        `"${scholar.name}"`,
        `"${scholar.affiliation || ''}"`,
        scholar.citedby || 0,
        scholar.hindex || 0,
        `"${scholar.emailDomain || ''}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'scholars_data.csv';
    link.click();
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Scholar Performance Tracker</h1>
          <div className="flex gap-4">
            <button 
              onClick={() => router.push('/scholars')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <List size={20} />
              View All Scholars
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download size={20} />
              Export Data
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-lg shadow mb-8">
          <div className="flex gap-4">
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
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <Filter size={20} />
              Filters
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-4">
              <Users className="text-blue-600" size={24} />
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Scholars</h3>
                <p className="text-2xl font-bold">{stats.totalScholars.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Citations</h3>
              <p className="text-2xl font-bold">{stats.totalCitations.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Average h-index</h3>
              <p className="text-2xl font-bold">{stats.averageHIndex}</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-8 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Publication Performance</h2>
          <div className="min-w-[800px]">
            <BarChart width={800} height={300} data={stats.yearlyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="papers" fill="#3b82f6" name="Papers" />
              <Bar yAxisId="right" dataKey="citations" fill="#10b981" name="Citations" />
            </BarChart>
          </div>
        </div>
      </div>
    </div>
  );
}