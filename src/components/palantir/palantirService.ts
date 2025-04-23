export const saveToPalantir = async <T>(
  data: T[],
  accessToken: string,
  options: {
    objectType: string;
  }
): Promise<void> => {
  const { objectType } = options;
  
  try {
    console.log(`Saving ${data.length} ${objectType.toLowerCase()}s to Palantir...`);
    
    const FOUNDRY_URL = process.env.NEXT_PUBLIC_FOUNDRY_URL;
    const ONTOLOGY_RID = process.env.NEXT_PUBLIC_ONTOLOGY_RID;
    
    if (!FOUNDRY_URL || !ONTOLOGY_RID) {
      throw new Error(`Missing required environment variables: ${!FOUNDRY_URL ? 'FOUNDRY_URL ' : ''}${!ONTOLOGY_RID ? 'NEXT_PUBLIC_ONTOLOGY_RID ' : ''}`);
    }
    
    const response = await fetch('/api/foundry-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: `/api/v2/ontologies/${ONTOLOGY_RID}/objects/${objectType}`,
        token: accessToken,
        method: 'PUT',
        requestBody: {
          objects: data
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Palantir API error: ${errorData.message || response.statusText}`);
    }
    
    console.log(`${objectType}s successfully saved to Palantir`);
    
    return Promise.resolve();
  } catch (error) {
    console.error(`Error saving ${objectType.toLowerCase()}s to Palantir:`, error);
    return Promise.reject(error);
  }
};

export const savePublicationsToPalantir = async (
  publications: Publication[], 
  accessToken: string
): Promise<void> => {
  return saveToPalantir(publications, accessToken, {
    objectType: 'Publication'
  });
};

export const saveScholarsToPalantir = async (
  scholars: Scholar[], 
  accessToken: string
): Promise<void> => {
  return saveToPalantir(scholars, accessToken, {
    objectType: 'Scholar'
  });
};

export interface Publication {
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

export interface Scholar {
  id: number;
  methods?: string;
  method?: string;
  researchMethods?: string;
  focus?: string;
  Focus?: string;
  [key: string]: any;
}