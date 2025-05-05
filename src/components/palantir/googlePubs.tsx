// src/components/palantir/googlePubs.tsx
import { PalantirService } from '@/components/palantir/commonApi';
import { PalantirScholar, PalantirGooglePub, FetchOptions, FetchResponse } from '@/components/palantir/types';

const googlePubService = new PalantirService<PalantirGooglePub>('GooglePubs', 'google-pubs');

export const saveGooglePubsToPalantir = (pubs: PalantirGooglePub[], accessToken: string) => 
  googlePubService.saveEntitiesToPalantir(pubs, accessToken);

export const updateGooglePubInPalantir = (pubId: number, data: Partial<PalantirGooglePub>, accessToken: string) =>
  googlePubService.updateEntityInPalantir(pubId, data, accessToken);

export const deleteGooglePubFromPalantir = (pubId: number, accessToken: string) =>
  googlePubService.deleteEntityFromPalantir(pubId, accessToken);

export const fetchGooglePubsFromPalantir = (accessToken: string, options: FetchOptions = {}) =>
  googlePubService.fetchEntitiesFromPalantir(accessToken, options);

export const fetchGooglePubByIdFromPalantir = (pubId: string, accessToken: string) =>
  googlePubService.fetchEntityByPrimaryKey(pubId, accessToken);

export const fetchGooglePubScholars = (
  pubId: string,
  accessToken: string,
  options: FetchOptions = {}
): Promise<FetchResponse<PalantirScholar>> => {
  return googlePubService.fetchLinkedEntities<PalantirScholar>(
    pubId,
    'ScholarProfile', // has to be single
    accessToken,
    options
  );
};