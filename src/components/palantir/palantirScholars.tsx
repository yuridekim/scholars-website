// src/components/palantir/scholars.ts
import { PalantirService } from '@/components/palantir/commonApi';
import { PalantirScholar, PalantirGooglePub, FetchOptions, FetchResponse, PalantirPubMed } from '@/components/palantir/types';

const scholarService = new PalantirService<PalantirScholar>('ScholarProfiles', 'scholar-profiles');

export const saveScholarsToPalantir = (scholars: PalantirScholar[], accessToken: string) => 
  scholarService.saveEntitiesToPalantir(scholars, accessToken);

export const updateScholarInPalantir = (scholarId: number, data: Partial<PalantirScholar>, accessToken: string) =>
  scholarService.updateEntityInPalantir(scholarId, data, accessToken);

export const deleteScholarFromPalantir = (scholarId: number, accessToken: string) =>
  scholarService.deleteEntityFromPalantir(scholarId, accessToken);

export const fetchScholarsFromPalantir = (accessToken: string, options: FetchOptions = {}) =>
  scholarService.fetchEntitiesFromPalantir(accessToken, options);

export const fetchScholarByIdFromPalantir = (scholarId: string, accessToken: string) =>
  scholarService.fetchEntityByPrimaryKey(scholarId, accessToken);

export const fetchScholarGooglePubs = (
  scholarId: string,
  accessToken: string,
  options: FetchOptions = {}
): Promise<FetchResponse<PalantirGooglePub>> => {
  return scholarService.fetchLinkedEntities<PalantirGooglePub>(
    scholarId,
    'GooglePubs', 
    accessToken,
    options
  );
};

export const fetchScholarPubMed = (
  scholarId: string,
  accessToken: string,
  options: FetchOptions = {}
): Promise<FetchResponse<PalantirPubMed>> => {
  return scholarService.fetchLinkedEntities<PalantirPubMed>(
    scholarId,
    // 'PubMed',
    'PalantirPubMeds', // has to be plural
    accessToken,
    options
  );
};

