// src/components/palantir/palantirScholars.ts
import { PalantirService } from '@/components/palantir/commonApi';
import { PalantirScholar, PalantirGooglePub, FetchOptions, FetchResponse, PalantirPubMed } from '@/components/palantir/types';

const scholarService = new PalantirService<PalantirScholar>('ScholarProfiles', 'scholar-profiles');

export const saveScholarsToPalantir = (scholars: PalantirScholar[], accessToken: string) => 
  scholarService.saveEntitiesToPalantir(scholars, accessToken);

export const saveScholarToPalantir = async (scholar: Partial<PalantirScholar>, accessToken: string): Promise<void> => {
  try {
    await scholarService.saveEntitiesToPalantir([scholar as PalantirScholar], accessToken);
    console.log(`Scholar ${scholar.name} successfully saved to Palantir`);
    return Promise.resolve();
  } catch (error) {
    console.error('Error saving scholar to Palantir:', error);
    return Promise.reject(error);
  }
};

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