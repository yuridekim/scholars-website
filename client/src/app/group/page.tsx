'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from 'lucide-react'
import { Scholar } from '@/lib/types'

type FilterType = 'name' | 'affiliation' | 'emailDomain' | 'interests'
type Filter = {
  id: string
  type: FilterType
  value: string
}

export default function GroupPage() {
  const [scholars, setScholars] = useState<Scholar[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filter[]>([])
  const [currentFilterType, setCurrentFilterType] = useState<FilterType>('name')
  const [currentFilterValue, setCurrentFilterValue] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionRef = useRef<HTMLDivElement>(null)

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

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update suggestions when filter type or value changes
  useEffect(() => {
    if (!currentFilterValue.trim()) {
      setSuggestions([])
      return
    }

    const value = currentFilterValue.toLowerCase()
    const uniqueValues = new Set<string>()

    scholars.forEach(scholar => {
      let fieldValue = ''
      switch (currentFilterType) {
        case 'name':
          fieldValue = scholar.name || ''
          break
        case 'affiliation':
          fieldValue = scholar.affiliation || ''
          break
        case 'emailDomain':
          fieldValue = scholar.emailDomain || ''
          break
        case 'interests':
          fieldValue = scholar.interests || ''
          break
      }

      if (currentFilterType === 'interests' && fieldValue) {
        // Split interests and handle them individually
        fieldValue.split(',').forEach(interest => {
          const trimmedInterest = interest.trim()
          if (trimmedInterest.toLowerCase().includes(value)) {
            uniqueValues.add(trimmedInterest)
          }
        })
      } else if (fieldValue.toLowerCase().includes(value)) {
        uniqueValues.add(fieldValue)
      }
    })

    setSuggestions(Array.from(uniqueValues).slice(0, 10)) // Limit to 10 suggestions
  }, [currentFilterType, currentFilterValue, scholars])

  const addFilter = (value?: string) => {
    const filterValue = value || currentFilterValue
    if (filterValue.trim()) {
      const newFilter: Filter = {
        id: Math.random().toString(36).substr(2, 9),
        type: currentFilterType,
        value: filterValue.trim()
      }
      setFilters([...filters, newFilter])
      setCurrentFilterValue('')
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const removeFilter = (filterId: string) => {
    setFilters(filters.filter(f => f.id !== filterId))
  }

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'name', label: 'Name' },
    { value: 'affiliation', label: 'Affiliation' },
    { value: 'emailDomain', label: 'Email Domain' },
    { value: 'interests', label: 'Interests' }
  ]

  const filteredScholars = scholars.filter(scholar => {
    if (filters.length === 0) return true

    return filters.every(filter => {
      const value = filter.value.toLowerCase()
      switch (filter.type) {
        case 'name':
          return scholar.name?.toLowerCase().includes(value)
        case 'affiliation':
          return scholar.affiliation?.toLowerCase().includes(value)
        case 'emailDomain':
          return scholar.emailDomain?.toLowerCase().includes(value)
        case 'interests':
          return scholar.interests?.toLowerCase().includes(value)
        default:
          return true
      }
    })
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center mt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  const getAverageMetrics = () => {
    const total = filteredScholars.length || 1 // Prevent division by zero
    return {
      citations: filteredScholars.reduce((sum, s) => sum + (s.citedby || 0), 0) / total,
      citations5y: filteredScholars.reduce((sum, s) => sum + (s.citedby5y || 0), 0) / total,
      hIndex: filteredScholars.reduce((sum, s) => sum + (s.hindex || 0), 0) / total,
      hIndex5y: filteredScholars.reduce((sum, s) => sum + (s.hindex5y || 0), 0) / total,
      i10Index: filteredScholars.reduce((sum, s) => sum + (s.i10index || 0), 0) / total,
    }
  }

  const averages = getAverageMetrics()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">Scholar Group Analysis</h1>
          
          <div className="flex flex-wrap gap-2">
            {filters.map(filter => (
              <div 
                key={filter.id}
                className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                <span className="font-medium">{filterOptions.find(f => f.value === filter.type)?.label}:</span>
                <span>{filter.value}</span>
                <button 
                  onClick={() => removeFilter(filter.id)}
                  className="hover:text-blue-900"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 relative">
            <Select value={currentFilterType} onValueChange={(value: FilterType) => setCurrentFilterType(value)}>
              <SelectTrigger className="w-40 bg-white">
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {filterOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                placeholder={`Filter by ${filterOptions.find(f => f.value === currentFilterType)?.label.toLowerCase()}...`}
                value={currentFilterValue}
                onChange={(e) => {
                  setCurrentFilterValue(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addFilter()
                  }
                }}
                className="w-full p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={suggestionRef}
                  className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => addFilter(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => addFilter()}
              disabled={!currentFilterValue.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Filter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(averages).map(([metric, value]) => (
            <Card key={metric}>
              <CardHeader className="py-4">
                <CardTitle className="text-sm capitalize">
                  {metric.replace(/([A-Z])/g, ' $1').trim()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {value.toFixed(1)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Scholar Metrics ({filteredScholars.length} scholars)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Affiliation</TableHead>
                  <TableHead>Citations</TableHead>
                  <TableHead>h-index</TableHead>
                  <TableHead>i10-index</TableHead>
                  <TableHead>Total Publications</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScholars.map((scholar) => (
                  <TableRow key={scholar.id}>
                    <TableCell className="font-medium">
                      {scholar.name}
                      {scholar.emailDomain && (
                        <div className="text-sm text-gray-500">{scholar.emailDomain}</div>
                      )}
                    </TableCell>
                    <TableCell>{scholar.affiliation || 'N/A'}</TableCell>
                    <TableCell>
                      {scholar.citedby || 0}
                      {scholar.citedby5y && (
                        <div className="text-xs text-gray-500">Last 5y: {scholar.citedby5y}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {scholar.hindex || 0}
                      {scholar.hindex5y && (
                        <div className="text-xs text-gray-500">Last 5y: {scholar.hindex5y}</div>
                      )}
                    </TableCell>
                    <TableCell>{scholar.i10index || 0}</TableCell>
                    <TableCell>{scholar.totalPub || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}