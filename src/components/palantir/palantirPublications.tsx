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
  
  export const savePublicationsToPalantir = async (
    publications: PalantirPublication[],
    accessToken: string
  ): Promise<void> => {
    try {
      console.log(`Saving ${publications.length} publications to Palantir...`);
      
      const FOUNDRY_URL = process.env.NEXT_PUBLIC_FOUNDRY_URL;
      const ONTOLOGY_RID = process.env.NEXT_PUBLIC_ONTOLOGY_RID;
      
      if (!FOUNDRY_URL || !ONTOLOGY_RID) {
        throw new Error('Missing required environment variables: FOUNDRY_URL or NEXT_PUBLIC_ONTOLOGY_RID');
      }
      
      const response = await fetch('/api/foundry-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: `/api/v2/ontologies/${ONTOLOGY_RID}/objects/Publications`,
          token: accessToken,
          method: 'PUT',
          requestBody: {
            objects: publications
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Palantir API error: ${errorData.message || response.statusText}`);
      }
      
      console.log('Publications successfully saved to Palantir');
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error saving publications to Palantir:', error);
      return Promise.reject(error);
    }
  };
  
  export const updatePublicationInPalantir = async (
    publicationId: number, 
    data: Partial<PalantirPublication>,
    accessToken: string
  ): Promise<void> => {
    try {
      console.log(`Updating publication ${publicationId} in Palantir...`);
      
      const FOUNDRY_URL = process.env.NEXT_PUBLIC_FOUNDRY_URL;
      const ONTOLOGY_RID = process.env.NEXT_PUBLIC_ONTOLOGY_RID;
      
      if (!FOUNDRY_URL || !ONTOLOGY_RID) {
        throw new Error('Missing required environment variables');
      }
      
      const response = await fetch('/api/foundry-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: `/api/v2/ontologies/${ONTOLOGY_RID}/objects/Publications/${publicationId}`,
          token: accessToken,
          method: 'PATCH',
          requestBody: data
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Palantir API error: ${errorData.message || response.statusText}`);
      }
      
      console.log(`Publication ${publicationId} successfully updated in Palantir`);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating publication in Palantir:', error);
      return Promise.reject(error);
    }
  };
  
  export const deletePublicationFromPalantir = async (
    publicationId: number,
    accessToken: string
  ): Promise<void> => {
    try {
      console.log(`Deleting publication ${publicationId} from Palantir...`);
      
      const FOUNDRY_URL = process.env.NEXT_PUBLIC_FOUNDRY_URL;
      const ONTOLOGY_RID = process.env.NEXT_PUBLIC_ONTOLOGY_RID;
      
      if (!FOUNDRY_URL || !ONTOLOGY_RID) {
        throw new Error('Missing required environment variables');
      }
      
      const response = await fetch('/api/foundry-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: `/api/v2/ontologies/${ONTOLOGY_RID}/objects/Publications/${publicationId}`,
          token: accessToken,
          method: 'DELETE'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Palantir API error: ${errorData.message || response.statusText}`);
      }
      
      console.log(`Publication ${publicationId} successfully deleted from Palantir`);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error deleting publication from Palantir:', error);
      return Promise.reject(error);
    }
  };
  
  export const fetchPublicationsFromPalantir = async (
    accessToken: string,
    options: {
      pageSize?: number;
      pageToken?: string;
      filter?: string;
    } = {}
  ): Promise<{
    data: PalantirPublication[];
    nextPageToken?: string;
  }> => {
    try {
      console.log('Fetching publications from Palantir...');
      
      const FOUNDRY_URL = process.env.NEXT_PUBLIC_FOUNDRY_URL;
      const ONTOLOGY_RID = process.env.NEXT_PUBLIC_ONTOLOGY_RID;
      
      if (!FOUNDRY_URL || !ONTOLOGY_RID) {
        throw new Error('Missing required environment variables');
      }
      
      const requestBody: Record<string, any> = {
        pageSize: options.pageSize || 100
      };
      
      if (options.pageToken) {
        requestBody.pageToken = options.pageToken;
      }
      
      if (options.filter) {
        requestBody.filter = options.filter;
      }
      
      const response = await fetch('/api/foundry-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: `/api/v2/ontologies/${ONTOLOGY_RID}/objects/Publications`,
          token: accessToken,
          method: 'GET',
          requestBody
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Palantir API error: ${errorData.message || response.statusText}`);
      }
      
      const responseData = await response.json();
      
      return {
        data: responseData.data || [],
        nextPageToken: responseData.nextPageToken
      };
    } catch (error) {
      console.error('Error fetching publications from Palantir:', error);
      throw error;
    }
  };
  
  export const verifyPalantirConnection = async (accessToken: string): Promise<boolean> => {
    try {
      const FOUNDRY_URL = process.env.NEXT_PUBLIC_FOUNDRY_URL;
      
      if (!FOUNDRY_URL) {
        throw new Error('Missing FOUNDRY_URL environment variable');
      }
      
      const response = await fetch('/api/foundry-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: '/api/v2/health',
          token: accessToken,
          method: 'GET'
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error verifying Palantir connection:', error);
      return false;
    }
  };