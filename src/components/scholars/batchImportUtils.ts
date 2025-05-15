// components/scholars/batchImportUtils.ts
import { OpenAlexScholar, ProcessedScholarItem } from './batchImportTypes';

export const extractOpenAlexId = (idString?: string): string => {
  if (!idString) return '';
  if (idString.startsWith('https://openalex.org/')) {
    return idString.substring('https://openalex.org/'.length);
  }
  if (/^[A-Za-z0-9]+$/.test(idString)) {
      return idString;
  }
  return idString.split('/').pop() || '';
};

export const getAffiliation = (scholar: OpenAlexScholar): string => {
  return (scholar.affiliations && scholar.affiliations.length > 0)
    ? scholar.affiliations.map(aff => aff.institution.display_name).join(', ')
    : '';
};

export const getStep3StatusText = (status: ProcessedScholarItem['status']) => {
  switch (status) {
    case 'success': return 'Imported Successfully';
    case 'error': return 'Import Failed';
    case 'processing': return 'Processing...';
    case 'ready': return 'Pending Import (Ready)';
    case 'needs_confirmation': return 'Skipped (Needs Confirmation)';
    default: return 'Unknown Status';
  }
};