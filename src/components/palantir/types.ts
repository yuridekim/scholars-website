// src/components/palantir/types.ts
export interface PalantirEntity {
    id: number;
    [key: string]: any;
  }
  
  export interface FetchOptions {
    pageSize?: number;
    pageToken?: string;
    filter?: string;
  }
  
  export interface FetchResponse<T> {
    data: T[];
    nextPageToken?: string;
  }
  
  export interface PalantirScholar extends PalantirEntity {
    name: string;
    emailDomain?: string;
    affiliation?: string;
    scholarId?: string;
    citedby?: number;
    citedby5y?: number;
    hindex?: number;
    hindex5y?: number;
    i10index?: number;
    i10index5y?: number;
    totalPub?: number;
    interests?: string;
    homepage?: string;
    fullName?: string;
    method?: string;
    summaryTrainingStart?: string;
    createdAt: string;
  }
  
  export interface PalantirGooglePub extends PalantirEntity {
    abstract?: string;
    author?: string;
    authorPubId?: string;
    citation?: string;
    citedbyUrl?: string;
    citesId?: string;
    createdAt: string;
    journal?: string;
    numCitations?: number;
    pubIndex?: number;
    pubUrl?: string;
    pubYear?: number;
    publisher?: string;
    scholarId?: string;
    title: string;
  }

  export interface PalantirPublication {
    id: number;
    title: string;
    publication_year: number;
    journal: string;
    authors: string;
    publication_url: string;
    num_citations: number;
    openalex_author_id: string;
    openalex_author_name: string;
  }

  export interface PalantirPubMed extends PalantirEntity {
    paperId: number;
    abstract: string;
    abstractText: string;
    affiliations: string;
    authors: string;
    dictError: number;
    doi: string;
    grantSupport: string;
    keywords: string;
    meShTerms: string;
    name: string;
    pmid: number;
    pubIndex: number;
    publicationType: string;
    recordId: number;
    scholarId: string;
    timestamp: string;
    title: string;
  }