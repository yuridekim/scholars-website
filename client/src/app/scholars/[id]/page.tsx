// client/src/app/scholars/[id]/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Scholar, GoogleScholarPub, PubmedPub } from '@/lib/types'

export default function ScholarDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [scholar, setScholar] = useState<Scholar | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/scholars/${params.id}`)
      .then((res) => res.json())
      .then((data: Scholar) => {
        setScholar(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching scholar:', error)
        setLoading(false)
      })
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center mt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (!scholar) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-red-600">Scholar not found</h1>
            <button
              onClick={() => router.push('/scholars')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Back to Scholars
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{scholar.name}</h1>
          <button
            onClick={() => router.push('/scholars')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Scholars
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Affiliation</dt>
                    <dd className="text-sm text-gray-900">{scholar.affiliation || 'N/A'}</dd>
                  </div>
                  {scholar.emailDomain && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email Domain</dt>
                      <dd className="text-sm text-gray-900">{scholar.emailDomain}</dd>
                    </div>
                  )}
                  {scholar.homepage && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Homepage</dt>
                      <dd className="text-sm text-gray-900">
                        <a
                          href={scholar.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {scholar.homepage}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Metrics</h2>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Citations</dt>
                    <dd className="text-sm text-gray-900">
                      {scholar.citedby || 0}
                      {scholar.citedby5y && (
                        <span className="text-gray-500 ml-2">
                          (Last 5 years: {scholar.citedby5y})
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">h-index</dt>
                    <dd className="text-sm text-gray-900">
                      {scholar.hindex || 0}
                      {scholar.hindex5y && (
                        <span className="text-gray-500 ml-2">
                          (Last 5 years: {scholar.hindex5y})
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">i10-index</dt>
                    <dd className="text-sm text-gray-900">
                      {scholar.i10index || 0}
                      {scholar.i10index5y && (
                        <span className="text-gray-500 ml-2">
                          (Last 5 years: {scholar.i10index5y})
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {scholar.interests && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Research Interests</h2>
                <p className="text-sm text-gray-900">{scholar.interests}</p>
              </div>
            )}

            {scholar.googleScholarPubs && scholar.googleScholarPubs.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Recent Publications</h2>
                <div className="space-y-4">
                  {scholar.googleScholarPubs.map((pub) => (
                    <div key={pub.id} className="border-b pb-4">
                      <h3 className="text-lg font-medium text-gray-900">{pub.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {pub.author} ({pub.pubYear})
                      </p>
                      {pub.journal && (
                        <p className="text-sm text-gray-500 mt-1">{pub.journal}</p>
                      )}
                      {pub.numCitations !== undefined && (
                        <p className="text-sm text-gray-500 mt-1">
                          Citations: {pub.numCitations}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}