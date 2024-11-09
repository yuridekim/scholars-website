// src/app/scholars/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Scholar {
  id: number
  name: string
  department: string
}

export default function ScholarsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [scholars, setScholars] = useState<Scholar[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/scholars')
      .then(res => res.json())
      .then(data => {
        setScholars(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching scholars:', error)
        setLoading(false)
      })
  }, [])

  const handleScholarClick = (id: number) => {
    router.push(`/scholars/${id}`)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Scholars Directory</h1>  // updated title
      
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search scholars..."  // updated placeholder
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      {/* Scholars Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Department</th>
          </tr>
        </thead>
        <tbody>
          {scholars
            .filter(scholar => 
              scholar.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(scholar => (
              <tr 
                key={scholar.id}
                onClick={() => handleScholarClick(scholar.id)}
                className="hover:bg-gray-100 cursor-pointer"
              >
                <td className="border p-2">{scholar.name}</td>
                <td className="border p-2">{scholar.department}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}