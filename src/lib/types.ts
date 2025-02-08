// lib/types.ts

export type Scholar = {
  id: number;
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
  googleScholarPubs?: GoogleScholarPub[];
  pubmedPubs?: PubmedPub[];
}

export type GoogleScholarPub = {
  id: number;
  title: string;
  pubYear?: number;
  citation?: string;
  author?: string;
  journal?: string;
  publisher?: string;
  abstract?: string;
  numCitations?: number;
  pubUrl?: string;
}

export type PubmedPub = {
  id: number;
  title: string;
  authors: string[];
  affiliations: string[];
  pmid?: string;
  doi?: string;
  abstract?: string;
  meshTerms: string[];
  publicationType: string[];
  keywords: string[];
  grantSupport?: Grant[] | null
}
export type Grant = {
  GrantID: string
  Agency: string
  Country: string
  Acronym: string
  GrantNumber: string
  ProjectName: string
}

export type GoogleScholarSearchResult = {
  name: string;
  affiliation: string;
  emailDomain?: string;
  scholarId: string;
  citedby: number;
  hindex: number;
};

export interface YearlyStats {
name: string;
papers: number;
citations: number;
}

export interface DashboardStats {
totalScholars: number;
totalCitations: number;
averageHIndex: number;
yearlyStats: YearlyStats[];
}

export interface FilterState {
affiliation: string;
emailDomain: string;
citationRange: string;
hIndexRange: string;
}

export interface TopicInfo {
  topic_id: string;
  topic_name: string;
  topic_description: string;
  general_class14: number;
  topic_popularity: number;
  w1: number;
  w2: number;
}