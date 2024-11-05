// src/app/page.tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Search, Filter, Download, Users } from 'lucide-react';

const mockData = [
  { name: '2020', papers: 12, citations: 45 },
  { name: '2021', papers: 15, citations: 78 },
  { name: '2022', papers: 18, citations: 120 },
  { name: '2023', papers: 22, citations: 189 },
  { name: '2024', papers: 8, citations: 45 },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Scholar Performance Tracker</h1>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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
                <p className="text-2xl font-bold">1,078</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Citations</h3>
              <p className="text-2xl font-bold">347,995</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Average h-index</h3>
              <p className="text-2xl font-bold">15.4</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-8 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Publication Performance</h2>
          <div className="min-w-[800px]">
            <BarChart width={800} height={300} data={mockData}>
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
  )
}