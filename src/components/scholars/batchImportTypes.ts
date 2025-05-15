// components/scholars/batchImportTypes.ts
export interface CSVScholar {
  name: string;
  openalex_id?: string;
  [key: string]: string | number | undefined;
}

export interface OpenAlexScholar {
  id: string;
  display_name: string;
  works_count: number;
  cited_by_count: number;
  summary_stats?: {
    h_index?: number;
    i10_index?: number;
  };
  affiliations?: Array<{
    institution: {
      display_name: string;
    };
  }>;
}

export interface ProcessedScholarItem {
  csvData: CSVScholar;
  status: 'ready' | 'needs_confirmation' | 'processing' | 'success' | 'error';
  message?: string;
  matchOptions?: OpenAlexScholar[];
  selectedMatch?: OpenAlexScholar;
  expanded?: boolean;
  isSearching?: boolean;
}

export interface BatchScholarImportProps {
  onScholarAdded?: () => void;
}