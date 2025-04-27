// src/components/palantir/common.ts
import { PalantirEntity, FetchOptions, FetchResponse } from '@/components/palantir/types';

export class PalantirService<T extends PalantirEntity> {
  private entityType: string;
  private actionName: string;

  constructor(entityType: string, actionName: string) {
    this.entityType = entityType;
    this.actionName = actionName;
  }

  async saveEntitiesToPalantir(
    entities: T[],
    accessToken: string
  ): Promise<void> {
    try {
      console.log(`Saving ${entities.length} ${this.entityType} to Palantir...`);

      const FOUNDRY_URL = process.env.NEXT_PUBLIC_FOUNDRY_URL;
      const ONTOLOGY_RID = process.env.NEXT_PUBLIC_ONTOLOGY_RID;

      if (!FOUNDRY_URL || !ONTOLOGY_RID) {
        throw new Error('Missing required environment variables: FOUNDRY_URL or ONTOLOGY_RID');
      }

      const endpoint = `/api/v2/ontologies/${ONTOLOGY_RID}/actions/create-${this.actionName}/applyBatch`;

      const requestBody = {
        requests: entities.map(entity => ({
          parameters: { ...entity }
        }))
      };

      const response = await fetch('/api/foundry-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint,
          token: accessToken,
          method: 'POST',
          requestBody: requestBody
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Full error response:', errorData);
        throw new Error(`Palantir API error: ${JSON.stringify(errorData)}`);
      }

      return Promise.resolve();
    } catch (error) {
      console.error(`Error saving ${this.entityType} to Palantir:`, error);
      return Promise.reject(error);
    }
  }

  async updateEntityInPalantir(
    entityId: number,
    data: Partial<T>,
    accessToken: string
  ): Promise<void> {
    try {
      console.log(`Updating ${this.entityType} ${entityId} in Palantir...`);

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
          endpoint: `/api/v2/ontologies/${ONTOLOGY_RID}/objects/${this.entityType}/${entityId}`,
          token: accessToken,
          method: 'PATCH',
          requestBody: data
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Palantir API error: ${errorData.message || response.statusText}`);
      }

      console.log(`${this.entityType} ${entityId} successfully updated in Palantir`);

      return Promise.resolve();
    } catch (error) {
      console.error(`Error updating ${this.entityType} in Palantir:`, error);
      return Promise.reject(error);
    }
  }

  async deleteEntityFromPalantir(
    entityId: number,
    accessToken: string
  ): Promise<void> {
    try {
      console.log(`Deleting ${this.entityType} ${entityId} from Palantir...`);

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
          endpoint: `/api/v2/ontologies/${ONTOLOGY_RID}/objects/${this.entityType}/${entityId}`,
          token: accessToken,
          method: 'DELETE'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Palantir API error: ${errorData.message || response.statusText}`);
      }

      console.log(`${this.entityType} ${entityId} successfully deleted from Palantir`);

      return Promise.resolve();
    } catch (error) {
      console.error(`Error deleting ${this.entityType} from Palantir:`, error);
      return Promise.reject(error);
    }
  }

  async fetchEntitiesFromPalantir(
    accessToken: string,
    options: FetchOptions = {}
  ): Promise<FetchResponse<T>> {
    try {
      console.log(`Fetching ${this.entityType} from Palantir...`);

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

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/foundry-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: `/api/v2/ontologies/${ONTOLOGY_RID}/objects/${this.entityType}`,
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
      console.error(`Error fetching ${this.entityType} from Palantir:`, error);
      throw error;
    }
  }

  async fetchEntityByPrimaryKey(
    entityId: string,
    accessToken: string
  ): Promise<T | null> {
    try {
      console.log(`Fetching ${this.entityType} with ID ${entityId} from Palantir...`);

      const FOUNDRY_URL = process.env.NEXT_PUBLIC_FOUNDRY_URL;
      const ONTOLOGY_RID = process.env.NEXT_PUBLIC_ONTOLOGY_RID;

      if (!FOUNDRY_URL || !ONTOLOGY_RID) {
        throw new Error('Missing required environment variables');
      }

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/foundry-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: `/api/v2/ontologies/${ONTOLOGY_RID}/objects/${this.entityType}/${entityId}`,
          token: accessToken,
          method: 'GET'
        })
      });

      if (response.status === 404) {
        console.log(`${this.entityType} with primary key ${entityId} not found in Palantir`);
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Palantir API error: ${errorData.message || response.statusText}`);
      }

      const entityData = await response.json();
      return entityData as T;
    } catch (error) {
      console.error(`Error fetching ${this.entityType} with ID ${entityId} from Palantir:`, error);
      throw error;
    }
  }

  async fetchLinkedEntities<L extends PalantirEntity>(
    entityId: string | number,
    linkName: string,
    accessToken: string,
    options: FetchOptions = {}
  ): Promise<FetchResponse<L>> {
    try {
      console.log(`Fetching ${linkName} linked to ${this.entityType} ${entityId} from Palantir...`);

      const FOUNDRY_URL = process.env.NEXT_PUBLIC_FOUNDRY_URL;
      const ONTOLOGY_RID = process.env.NEXT_PUBLIC_ONTOLOGY_RID;

      if (!FOUNDRY_URL || !ONTOLOGY_RID) {
        throw new Error('Missing required environment variables');
      }

      const requestBody: Record<string, any> = {};

      if (options.pageSize) {
        requestBody.pageSize = options.pageSize;
      } else {
        requestBody.pageSize = 10000;
      }

      if (options.pageToken) {
        requestBody.pageToken = options.pageToken;
      }

      if (options.filter) {
        requestBody.filter = options.filter;
      }

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/foundry-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: `/api/v2/ontologies/${ONTOLOGY_RID}/objects/${this.entityType}/${entityId}/links/${linkName}`,
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
      console.error(`Error fetching ${linkName} linked to ${this.entityType} ${entityId} from Palantir:`, error);
      throw error;
    }
  }
}