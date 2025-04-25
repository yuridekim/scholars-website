// src/components/palantir/publications.ts
import { PalantirService, FetchOptions } from '@/components/palantir/commonApi';

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

const publicationService = new PalantirService<PalantirPublication>('Publications', 'publications');

export const savePublicationsToPalantir = (publications: PalantirPublication[], accessToken: string) =>
  publicationService.saveEntitiesToPalantir(publications, accessToken);

export const updatePublicationInPalantir = (publicationId: number, data: Partial<PalantirPublication>, accessToken: string) =>
  publicationService.updateEntityInPalantir(publicationId, data, accessToken);

export const deletePublicationFromPalantir = (publicationId: number, accessToken: string) =>
  publicationService.deleteEntityFromPalantir(publicationId, accessToken);

export const fetchPublicationsFromPalantir = (accessToken: string, options: FetchOptions = {}) =>
  publicationService.fetchEntitiesFromPalantir(accessToken, options);