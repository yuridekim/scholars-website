// src/components/palantir/publications.ts
import { PalantirService } from '@/components/palantir/commonApi';
import { FetchOptions, PalantirPublication } from '@/components/palantir/types';

const publicationService = new PalantirService<PalantirPublication>('Publications', 'publications');

export const savePublicationsToPalantir = (publications: PalantirPublication[], accessToken: string) =>
  publicationService.saveEntitiesToPalantir(publications, accessToken);

export const updatePublicationInPalantir = (publicationId: number, data: Partial<PalantirPublication>, accessToken: string) =>
  publicationService.updateEntityInPalantir(publicationId, data, accessToken);

export const deletePublicationFromPalantir = (publicationId: number, accessToken: string) =>
  publicationService.deleteEntityFromPalantir(publicationId, accessToken);

export const fetchPublicationsFromPalantir = (accessToken: string, options: FetchOptions = {}) =>
  publicationService.fetchEntitiesFromPalantir(accessToken, options);