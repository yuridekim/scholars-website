// lib/scholarExperiment.ts
import axios from 'axios';

export class ScholarExperiment {
  static async fetchPubMedData(name: string) {
    try {
      const response = await axios.get(
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi`,
        {
          params: {
            db: 'pubmed',
            term: `${name}[Author]`,
            retmode: 'json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching PubMed data:', error);
      throw error;
    }
  }

  static async parseGoogleScholar(url: string) {
    try {
      const pattern = /user=([^&]+)/;
      const match = url.match(pattern);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error parsing Google Scholar URL:', error);
      return null;
    }
  }

  static async fetchNIHGrants(name: string) {
    try {
      const response = await axios.post(
        'https://api.reporter.nih.gov/v2/projects/search',
        {
          criteria: {
            pi_names: [{ any_name: name }]
          },
          limit: 500
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching NIH grants:', error);
      throw error;
    }
  }
}