// src/app/scholars/page.tsx
'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Scholar } from '@/lib/types'

export default function ScholarsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [scholars, setScholars] = useState<Scholar[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/scholars')
      .then((res) => res.json())
      .then((data: Scholar[]) => {
        setScholars(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching scholars:', error)
        setLoading(false)
      })
  }, [])

  const handleScholarClick = (id: number) => {
    router.push(`/scholars/${id}`)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center mt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  const filteredScholars = scholars.filter((scholar) => 
    scholar.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (scholar.affiliation?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Scholars Directory</h1>
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search scholars by name or affiliation..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliation</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Citations</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">h-index</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredScholars.map((scholar) => (
                <tr 
                  key={scholar.id}
                  onClick={() => handleScholarClick(scholar.id)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{scholar.name}</div>
                    {scholar.emailDomain && (
                      <div className="text-sm text-gray-500">{scholar.emailDomain}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{scholar.affiliation || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{scholar.citedby || 0}</div>
                    {scholar.citedby5y && (
                      <div className="text-xs text-gray-500">Last 5y: {scholar.citedby5y}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{scholar.hindex || 0}</div>
                    {scholar.hindex5y && (
                      <div className="text-xs text-gray-500">Last 5y: {scholar.hindex5y}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}