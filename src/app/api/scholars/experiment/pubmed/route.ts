import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';
import { ParsedPubMedResult, PubMedAuthorAffiliation, PubMedAuthor, PubMedArticle, PubMedKeyword, PubMedMeshHeading } from './types';

async function searchPubMedByTitleAndAuthor(title: string, author: string) {
  try {
    const query = `${title}[Title] AND ${author}[Author]`;
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=1&retmode=json`;
    
    const response = await axios.get(searchUrl);
    if (!response.data?.esearchresult?.idlist) {
      console.error('No search results found');
      return [];
    }
    return response.data.esearchresult.idlist;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

async function fetchPubMedDetails(idList: string[]) {
  if (idList.length === 0) return null;
  
  try {
    const ids = idList.join(',');
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids}&retmode=xml`;
    
    const response = await axios.get(fetchUrl);
    if (!response.data) {
      console.error('No data returned from PubMed');
      return null;
    }
    return response.data;
  } catch (error) {
    console.error('Fetch details error:', error);
    return null;
  }
}

function parsePubMedXML(xmlData: string): ParsedPubMedResult | null {
    if (!xmlData) {
      console.error('No XML data provided');
      return null;
    }
  
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "_",
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true
    });
  
    try {
      const result = parser.parse(xmlData);
    //   console.log('Parsed XML structure:', JSON.stringify(result, null, 2));
      
      // Handle both array and single object cases
      const pubmedArticle = Array.isArray(result?.PubmedArticleSet?.PubmedArticle)
        ? result.PubmedArticleSet.PubmedArticle[0]
        : result?.PubmedArticleSet?.PubmedArticle;
  
      if (!pubmedArticle?.MedlineCitation) {
        console.error('Invalid or missing MedlineCitation in XML structure');
        return null;
      }
  
      const citation = pubmedArticle.MedlineCitation;
      const articleData = citation.Article;
  
      if (!articleData) {
        console.error('Missing Article data in XML structure');
        return null;
      }
  
      // Helper function to safely handle array or single object for authors
      const normalizeArray = <T>(item: T | T[] | undefined): T[] => {
        if (!item) return [];
        return Array.isArray(item) ? item : [item];
      };
  
      return {
        basicInfo: {
          pmid: typeof citation.PMID === 'string' ? citation.PMID : citation.PMID['#text'],
          title: articleData.ArticleTitle,
          journal: articleData.Journal?.Title,
          publishDate: {
            year: articleData.Journal?.JournalIssue?.PubDate?.Year,
            month: articleData.Journal?.JournalIssue?.PubDate?.Month
          },
          doi: normalizeArray(articleData.ELocationID)
            .find(id => id._EIdType === 'doi')?.['#text'] || null
        },
        authors: normalizeArray(articleData.AuthorList?.Author).map((author: PubMedAuthor) => ({
          lastName: author.LastName,
          foreName: author.ForeName,
          affiliation: author.AffiliationInfo 
            ? normalizeArray(author.AffiliationInfo)
                .map((aff: PubMedAuthorAffiliation) => aff.Affiliation)
                .join('; ')
            : null
        })),
        abstract: normalizeArray(articleData.Abstract?.AbstractText)[0] || null,
        keywords: normalizeArray(citation.KeywordList?.Keyword)
          .map((k: PubMedKeyword | string) => (typeof k === 'string' ? k : k['#text'] || '')),
        meshTerms: normalizeArray(citation.MeshHeadingList?.MeshHeading)
          .map((mesh: PubMedMeshHeading | any) => ({ // Allow for potentially missing properties
            term: mesh.DescriptorName?.['#text'] || mesh.DescriptorName?.['#text'] || '', // Handle missing '#text' and DescriptorName gracefully
            isMajorTopic: mesh.DescriptorName?._MajorTopicYN === 'Y' //Optional Chaining
          })),
        publicationType: normalizeArray(articleData.PublicationTypeList?.PublicationType)
          .map((type: { '#text': string } | string) => (typeof type === 'string' ? type : type['#text'] || '')),
      };
    } catch (error) {
      console.error('XML parsing error:', error);
      return null;
    }
  }

export async function POST(request: Request) {
  try {
    const { papers } = await request.json();
    if (!Array.isArray(papers)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid input: papers must be an array' 
      }, { status: 400 });
    }

    const results = [];
    
    for (const paper of papers) {
      if (!paper.title || !paper.author) {
        console.error('Missing required paper data:', paper);
        continue;
      }

      // Add delay between requests to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Search for paper
      const idList = await searchPubMedByTitleAndAuthor(paper.title, paper.author);
      
      if (idList.length > 0) {
        // Fetch details
        const xmlData = await fetchPubMedDetails(idList);
        if (xmlData) {
          const parsed = parsePubMedXML(xmlData);
          if (parsed) {
            results.push(parsed);
          } else {
            console.error('Failed to parse XML for paper:', paper);
          }
        }
      } else {
        console.log('No PubMed ID found for paper:', paper);
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: results,
      totalFound: results.length,
      totalRequested: papers.length
    });

  } catch (error) {
    console.error('PubMed API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch PubMed data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}