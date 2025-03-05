'use client'
import OpenAlexScholarSearch from '@/components/openalex/publications';

export default function OpenAlexPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">OpenAlex Publications</h1>
      <OpenAlexScholarSearch />
    </div>
  );
}