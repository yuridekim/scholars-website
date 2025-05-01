// // src/components/palantir/pubMed.tsx
// import { PalantirService } from '@/components/palantir/commonApi';
// import { PalantirScholar, PalantirPubMed, FetchOptions, FetchResponse } from '@/components/palantir/types';

// const pubMedService = new PalantirService<PalantirPubMed>('Pubmeds', 'pubmed');

// export const savePubMedToPalantir = (pubs: PalantirPubMed[], accessToken: string) => 
//   pubMedService.saveEntitiesToPalantir(pubs, accessToken);

// export const updatePubMedInPalantir = (pubId: number, data: Partial<PalantirPubMed>, accessToken: string) =>
//   pubMedService.updateEntityInPalantir(pubId, data, accessToken);

// export const deletePubMedFromPalantir = (pubId: number, accessToken: string) =>
//   pubMedService.deleteEntityFromPalantir(pubId, accessToken);

// export const fetchPubMedFromPalantir = (accessToken: string, options: FetchOptions = {}) =>
//   pubMedService.fetchEntitiesFromPalantir(accessToken, options);

// export const fetchPubMedByIdFromPalantir = (pubId: string, accessToken: string) =>
//   pubMedService.fetchEntityByPrimaryKey(pubId, accessToken);


// export const fetchPubMedScholars = (
//   pubId: string,
//   accessToken: string,
//   options: FetchOptions = {}
// ): Promise<FetchResponse<PalantirScholar>> => {
//   return pubMedService.fetchLinkedEntities<PalantirScholar>(
//     pubId,
//     'ScholarProfiles',
//     accessToken,
//     options
//   );
// };

// src/components/palantir/pubMed.tsx
import { PalantirService } from '@/components/palantir/commonApi';
import { PalantirScholar, PalantirPubMed, FetchOptions, FetchResponse } from '@/components/palantir/types';

const pubMedService = new PalantirService<PalantirPubMed>('PalantirPubMeds', 'palantir-pub-meds');

export const savePubMedToPalantir = (pubs: PalantirPubMed[], accessToken: string) => 
  pubMedService.saveEntitiesToPalantir(pubs, accessToken);

export const updatePubMedInPalantir = (pmid: number, data: Partial<PalantirPubMed>, accessToken: string) =>
  pubMedService.updateEntityInPalantir(pmid, data, accessToken);

export const deletePubMedFromPalantir = (pmid: number, accessToken: string) =>
  pubMedService.deleteEntityFromPalantir(pmid, accessToken);

export const fetchPubMedFromPalantir = (accessToken: string, options: FetchOptions = {}) =>
  pubMedService.fetchEntitiesFromPalantir(accessToken, options);

export const fetchPubMedByIdFromPalantir = (pmid: number, accessToken: string) =>
  pubMedService.fetchEntityByPrimaryKey(pmid, accessToken);

export const fetchPubMedScholars = (
  pmid: number,
  accessToken: string,
  options: FetchOptions = {}
): Promise<FetchResponse<PalantirScholar>> => {
  return pubMedService.fetchLinkedEntities<PalantirScholar>(
    pmid,
    'ScholarProfile',
    accessToken,
    options
  );
};