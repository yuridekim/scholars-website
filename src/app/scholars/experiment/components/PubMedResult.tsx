// app/scholars/experiment/components/PubMedResult.tsx
// In PubMedResult.tsx
import { ParsedPubMedResult } from '@/app/api/scholars/experiment/pubmed/types';

interface PubMedResultProps {
  data: ParsedPubMedResult;
}
  
  export function PubMedResult({ data }: PubMedResultProps) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <h3 className="text-xl font-semibold mb-2">{data.basicInfo.title}</h3>
        
        <div className="mb-4">
          <p className="text-gray-600">
            Published in {data.basicInfo.journal} ({data.basicInfo.publishDate.month} {data.basicInfo.publishDate.year})
          </p>
          <p className="text-gray-500">PMID: {data.basicInfo.pmid} | DOI: {data.basicInfo.doi}</p>
        </div>
  
        <div className="mb-4">
          <h4 className="font-medium mb-2">Authors</h4>
          <div className="space-y-1">
            {data.authors.map((author, index) => (
              <p key={index} className="text-sm">
                {author.foreName} {author.lastName}
                {author.affiliation && (
                  <span className="text-gray-500 text-xs block ml-4">
                    {author.affiliation}
                  </span>
                )}
              </p>
            ))}
          </div>
        </div>
  
        {data.abstract && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">Abstract</h4>
            <p className="text-sm text-gray-700">{data.abstract}</p>
          </div>
        )}
  
        {data.keywords?.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {data.keywords.map((keyword, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
  
        {data.meshTerms?.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">MeSH Terms</h4>
            <div className="flex flex-wrap gap-2">
              {data.meshTerms.map((mesh, index) => (
                <span 
                  key={index}
                  className={`px-2 py-1 text-xs rounded ${
                    mesh.isMajorTopic 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {mesh.term}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }