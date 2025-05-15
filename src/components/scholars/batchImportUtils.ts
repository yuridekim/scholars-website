// components/scholars/batchImportUtils.ts
import axios from 'axios';
import { OpenAlexScholar, ScholarStatus } from './batchImportTypes';

export const extractOpenAlexId = (id: string): string => {
  if (!id) return '';
  return id.includes('/') ? id.split('/').pop() || '' : id;
};

export const getAffiliation = (scholar: OpenAlexScholar): string => {
  if (scholar.affiliations && scholar.affiliations.length > 0) {
    return scholar.affiliations.map(aff => aff.institution.display_name).join(', ');
  }
  return 'No affiliation information';
};

export const fetchAuthorById = async (openAlexId: string): Promise<OpenAlexScholar | null> => {
  const cleanId = extractOpenAlexId(openAlexId);
  
  if (!cleanId) {
    throw new Error('Invalid OpenAlex ID');
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await axios.get<OpenAlexScholar>(
      `https://api.openalex.org/authors/${cleanId}`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    
    return response.data;
  } catch (err) {
    console.error('Error fetching author by ID:', err);
    const errorMessage = err instanceof Error 
      ? (err.name === 'AbortError' 
          ? 'Request timed out. The OpenAlex API may be slow or unavailable.' 
          : err.message)
      : String(err);
    
    throw new Error(`Error fetching author from OpenAlex: ${errorMessage}`);
  }
};

export const getStep3StatusText = (status: ScholarStatus): string => {
  switch (status) {
    case 'success':
      return 'Imported';
    case 'error':
      return 'Failed';
    case 'processing':
      return 'Processing';
    case 'ready':
      return 'Ready to Import';
    case 'needs_confirmation':
      return 'Needs ID';
    default:
      return 'Unknown';
  }
};