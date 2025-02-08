'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Scholar, GoogleScholarPub, PubmedPub, Grant } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CollapsibleGrants } from '@/components/grants';
import { CollapsiblePublications } from '@/components/publications';


const extractUniqueGrants = (pubs?: PubmedPub[]): Grant[] => {
  if (!pubs) return []
  const uniqueGrantIds = new Set<string>()
  const uniqueGrants: Grant[] = []

  pubs.forEach(pub => {
    if (pub.grantSupport) {
      pub.grantSupport.forEach(grant => {
        const grantKey = grant.GrantID + grant.Agency
        if (!uniqueGrantIds.has(grantKey) && grant.GrantID !== 'Not available') {
          uniqueGrantIds.add(grantKey)
          uniqueGrants.push(grant)
        }
      })
    }
  })

  return uniqueGrants
}

const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="flex items-center justify-center mt-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
    </div>
  </div>
)

const ScholarNotFound = ({ onBack }: { onBack: () => void }) => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-7xl mx-auto">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-red-600">Scholar not found</h1>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Scholars
          </button>
        </CardContent>
      </Card>
    </div>
  </div>
)

const ProfileInfo = ({ scholar }: { scholar: Scholar }) => (
  <div>
    <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
    <dl className="space-y-2">
      <InfoItem label="Affiliation" value={scholar.affiliation || 'N/A'} />
      {scholar.emailDomain && <InfoItem label="Email Domain" value={scholar.emailDomain} />}
      {scholar.homepage && (
        <InfoItem
          label="Homepage"
          value={
            <a
              href={scholar.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {scholar.homepage}
            </a>
          }
        />
      )}
    </dl>
  </div>
)

const ScholarMetrics = ({ scholar }: { scholar: Scholar }) => (
  <div>
    <h2 className="text-xl font-semibold mb-4">Metrics</h2>
    <dl className="space-y-2">
      <MetricItem
        label="Citations"
        value={scholar.citedby || 0}
        fiveYear={scholar.citedby5y}
      />
      <MetricItem
        label="h-index"
        value={scholar.hindex || 0}
        fiveYear={scholar.hindex5y}
      />
      <MetricItem
        label="i10-index"
        value={scholar.i10index || 0}
        fiveYear={scholar.i10index5y}
      />
    </dl>
  </div>
)

const GrantCard = ({ grant }: { grant: Grant }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-medium text-gray-900">{grant.Agency}</span>
        <Badge variant="secondary">{grant.Country}</Badge>
      </div>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoItem label="Grant ID" value={grant.GrantID} />
        {grant.Acronym !== 'Not available' && (
          <InfoItem label="Program" value={grant.Acronym} />
        )}
        {grant.GrantNumber !== 'Not available' && (
          <InfoItem label="Grant Number" value={grant.GrantNumber} />
        )}
        {grant.ProjectName !== 'Not available' && (
          <div className="md:col-span-2">
            <InfoItem label="Project" value={grant.ProjectName} />
          </div>
        )}
      </dl>
    </CardContent>
  </Card>
)

const Publications = ({ pubs }: { pubs: GoogleScholarPub[] }) => (
  <div className="mt-6">
    <h2 className="text-xl font-semibold mb-4">Recent Publications</h2>
    <div className="space-y-4">
      {pubs.map((pub) => (
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
)

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="text-sm text-gray-900">{value}</dd>
  </div>
)

const MetricItem = ({
  label,
  value,
  fiveYear,
}: {
  label: string
  value: number
  fiveYear?: number
}) => (
  <div>
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="text-sm text-gray-900">
      {value}
      {fiveYear && (
        <span className="text-gray-500 ml-2">(Last 5 years: {fiveYear})</span>
      )}
    </dd>
  </div>
)

export default function ScholarDetailPage({ params }: { params: { scholarId: string } }) {
  const router = useRouter()
  const [scholar, setScholar] = useState<Scholar | null>(null)
  const [loading, setLoading] = useState(true)
  const [grants, setGrants] = useState<Grant[]>([])

  useEffect(() => {
    fetch(`/api/scholars/${params.scholarId}`)
      .then((res) => res.json())
      .then((data: Scholar) => {
        setScholar(data)
        const uniqueGrants = extractUniqueGrants(data.pubmedPubs)
        setGrants(uniqueGrants)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching scholar:', error)
        setLoading(false)
      })
  }, [params.scholarId])

  if (loading) return <LoadingSpinner />
  if (!scholar) return <ScholarNotFound onBack={() => router.push('/scholars')} />

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

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileInfo scholar={scholar} />
              <ScholarMetrics scholar={scholar} />
            </div>

            {scholar.interests && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Research Interests</h2>
                <p className="text-sm text-gray-900">{scholar.interests}</p>
              </div>
            )}

            {grants.length > 0 && <CollapsibleGrants grants={grants} />}

            {scholar.googleScholarPubs && scholar.googleScholarPubs.length > 0 && (
            <CollapsiblePublications publications={scholar.googleScholarPubs} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}