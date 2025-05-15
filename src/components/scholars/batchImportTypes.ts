// components/scholars/batchImportTypes.ts
import React from 'react';

export interface BatchScholarImportProps {
  onScholarAdded?: () => void;
}

export interface CSVScholar {
  name: string;
  openalex_id?: string;
  [key: string]: string | undefined;
}

export interface OpenAlexConcept {
  id: string;
  display_name: string;
  level: number;
  score: number;
}

export interface OpenAlexInstitution {
  id: string;
  display_name: string;
  ror?: string;
  country_code?: string;
  type?: string;
}

export interface OpenAlexSummaryStats {
  h_index?: number;
  i10_index?: number;
  '2yr_mean_citedness'?: number;
  '2yr_h_index'?: number;
}

export interface OpenAlexScholar {
  id: string;
  display_name: string;
  display_name_alternatives?: string[];
  orcid?: string;
  works_count: number;
  cited_by_count: number;
  summary_stats?: OpenAlexSummaryStats;
  last_known_institution?: OpenAlexInstitution;
  x_concepts?: OpenAlexConcept[];
  counts_by_year?: Array<{ year: number; works_count: number; cited_by_count: number }>;
  affiliations?: Array<{
  institution: {
    display_name: string;
  };
  years?: number[];
  }>;
}

export type ScholarStatus = 'needs_confirmation' | 'ready' | 'processing' | 'success' | 'error';

export interface ProcessedScholarItem {
  csvData: CSVScholar;
  status: ScholarStatus;
  message: string;
  matchOptions?: OpenAlexScholar[];
  selectedMatch?: OpenAlexScholar;
  expanded?: boolean;
  isSearching?: boolean;
}

export interface ScholarImportResultsProps {
  scholars: ProcessedScholarItem[];
  overallStatus: {
    total: number;
    ready: number;
    needsConfirmation: number;
    success: number;
    error: number;
  };
  isProcessingGlobal: boolean;
  resetForm: () => void;
  onScholarAdded?: () => void;
  setScholars: React.Dispatch<React.SetStateAction<ProcessedScholarItem[]>>;
  updateOverallStatus: (scholars: ProcessedScholarItem[]) => void;
  authToken?: string;
}