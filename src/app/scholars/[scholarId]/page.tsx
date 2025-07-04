'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Scholar, PubmedPub, Grant } from '@/lib/types'
import { Card, CardContent} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CollapsibleGrants } from '@/components/grants';
import UnifiedPublications from '@/components/publications/unifiedPublications';
import { useFoundryAuth } from '@/hooks/useFoundryAuth';

const extractUniqueGrants = (pubs?: PubmedPub[]): Grant[] => {
  if (!pubs) return [];
  const uniqueGrantIds = new Set<string>();
  const uniqueGrants: Grant[] = [];

  pubs.forEach(pub => {
    let grantsArray: Grant[] = [];
    
    if (typeof pub.grantSupport === 'string') {
      try {
        const jsonString = pub.grantSupport.replace(/'/g, '"');
        grantsArray = JSON.parse(jsonString);
      } catch (error) {
        console.error('Error parsing grantSupport string:', error);
      }
    } else if (Array.isArray(pub.grantSupport)) {
      grantsArray = pub.grantSupport;
    }
    
    if (Array.isArray(grantsArray)) {
      grantsArray.forEach((grant: Grant) => {
        const grantKey = grant.GrantID + grant.Agency;
        if (!uniqueGrantIds.has(grantKey) && grant.GrantID !== 'Not available') {
          uniqueGrantIds.add(grantKey);
          uniqueGrants.push(grant);
        }
      });
    }
  });

  return uniqueGrants;
};

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

const ErrorDisplay = ({ error, onBack }: { error: string, onBack: () => void }) => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-7xl mx-auto">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-2">{error}</p>
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

export default function Page() {
  const router = useRouter()
  const params = useParams()
  const scholarId = params.scholarId as string
  
  const [scholar, setScholar] = useState<Scholar | null>(null)
  const [loading, setLoading] = useState(true)
  const [grants, setGrants] = useState<Grant[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  
  const auth = useFoundryAuth()

  useEffect(() => {
    console.log('Auth status updated:', { 
      isAuthenticated: auth.isAuthenticated, 
      hasToken: !!auth.accessToken 
    })
    
    if (auth.isAuthenticated && auth.accessToken) {
      setIsAuthReady(true)
    }
  }, [auth.isAuthenticated, auth.accessToken])

  useEffect(() => {
    if (!scholarId || !isAuthReady) return
    
    const fetchScholar = async () => {
      try {
        setLoading(true)
        
        const response = await fetch(`/api/scholars/${scholarId}`, {
          headers: {
            'Authorization': `Bearer ${auth.accessToken}`
          }
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Error ${response.status}: ${errorText}`)
        }
    
        const data: Scholar = await response.json()
        setScholar(data)
        const uniqueGrants = extractUniqueGrants(data.pubmedPubs)
        setGrants(uniqueGrants)
      } catch (error) {
        console.error('Error fetching scholar:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
  
    fetchScholar()
  }, [scholarId, isAuthReady])

  if (!isAuthReady || loading) {
    return <LoadingSpinner />
  }
  
  if (error) {
    return <ErrorDisplay error={error} onBack={() => router.push('/scholars')} />
  }
  
  if (!scholar) {
    return <ScholarNotFound onBack={() => router.push('/scholars')} />
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

            {scholar.emailDomain && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Network Analysis</h3>
                <div className="w-full h-96 border rounded-lg overflow-hidden">
                  <iframe
                    src="/network_plot.html"
                    className="w-full h-full"
                    style={{ border: 'none' }}
                    width="100%"
                    height="100%"
                  />
                </div>
              </div>
            )}

            {grants.length > 0 && <CollapsibleGrants grants={grants} />}

            <UnifiedPublications 
              googlePubs={scholar.googleScholarPubs || []}
              scholarName={scholar.name}
              scholarId={scholarId}
            />
            
          </CardContent>
        </Card>
      </div>
    </div>
  )
}