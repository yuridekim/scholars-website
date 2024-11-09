// client/src/app/scholars/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Scholar {
  id: number
  name: string
  department: string
}

export default function ScholarDetailPage() {
  const params = useParams()
  const [scholar, setScholar] = useState<Scholar | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/scholars/${params.id}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Scholar not found')
        }
        return res.json()
      })
      .then(data => {
        setScholar(data)
        setLoading(false)
      })
      .catch(error => {
        setError(error.message)
        setLoading(false)
      })
  }, [params.id])

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  if (error || !scholar) {
    return <div className="p-6 text-red-500">Error: {error || 'Scholar not found'}</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{scholar.name}</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <label className="font-semibold">Department:</label>
          <p>{scholar.department}</p>
        </div>
        {/* Add more scholar details here as needed */}
      </div>
    </div>
  )
}