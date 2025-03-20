'use client';

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { useScholarData } from '@/hooks/useScholarData';
import { AuthState } from '@/hooks/useFoundryAuth';

interface DataItem {
  name: string;
  value: number;
  color?: string;
}

interface ScholarPieChartProps {
  auth: AuthState;
  title: string;
  propertyAccessor: (scholar: any) => string;
  colors: string[];
  fallbackValue?: string;
  maxSlices?: number;
}

export function ScholarPieChart({
  auth,
  title,
  propertyAccessor,
  colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'],
  fallbackValue = 'Not Specified',
  maxSlices = 7
}: ScholarPieChartProps): JSX.Element {
  const { scholars, loading, error } = useScholarData(auth);
  
  const chartData = useMemo(() => {
    if (!scholars.length) return [];
    
    const frequencyMap: Record<string, number> = {};
    
    for (const scholar of scholars) {
      const value = propertyAccessor(scholar) || fallbackValue;
      
      frequencyMap[value] = (frequencyMap[value] || 0) + 1;
    }
    
    return Object.entries(frequencyMap)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, maxSlices);
  }, [scholars, propertyAccessor, fallbackValue, colors, maxSlices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 w-full bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scholar data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-red-600 mb-3">Error Loading Data</h3>
        <p className="text-gray-700 mb-2">{error.message}</p>
        
        <div className="flex justify-center mt-4">
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200 mr-3"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-700">No data available</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200 mt-4"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-full">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>
      
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={120}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} scholars`, 'Count']}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: '4px', 
                padding: '8px', 
                boxShadow: '0 2px 5px rgba(0,0,0,0.15)', 
                border: '1px solid #e2e8f0' 
              }}
            />
            <Legend 
              layout="vertical" 
              align="right"
              verticalAlign="middle" 
              iconType="circle"
              wrapperStyle={{ 
                paddingLeft: '20px',
                fontSize: '12px'
              }}
              formatter={(value) => (
                <span style={{ color: 'rgba(0, 0, 0, 0.85)', fontWeight: 'normal' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
