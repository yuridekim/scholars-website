// src/app/people/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PeoplePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  
  // Example data - replace with your actual data source
  const people = [
    { id: 1, name: 'John Doe', department: 'Computer Science' },
    { id: 2, name: 'Jane Smith', department: 'Physics' },
    // ... more people
  ]

  const handlePersonClick = (id: number) => {
    router.push(`/people/${id}`)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">People Directory</h1>
      
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search people..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      {/* People Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Department</th>
          </tr>
        </thead>
        <tbody>
          {people
            .filter(person => 
              person.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(person => (
              <tr 
                key={person.id}
                onClick={() => handlePersonClick(person.id)}
                className="hover:bg-gray-100 cursor-pointer"
              >
                <td className="border p-2">{person.name}</td>
                <td className="border p-2">{person.department}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}