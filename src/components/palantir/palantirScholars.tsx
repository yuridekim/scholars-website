// src/components/palantir/scholars.ts
import { PalantirService, FetchOptions } from '@/components/palantir/commonApi';

export interface PalantirScholar {
  id: number;
  name: string;
  emailDomain?: string;
  affiliation?: string;
  scholarId?: string;
  citedby?: number;
  citedby5y?: number;
  hindex?: number;
  hindex5y?: number;
  i10index?: number;
  i10index5y?: number;
  totalPub?: number;
  interests?: string;
  homepage?: string;
  fullName?: string;
  method?: string;
  summaryTrainingStart?: string;
  createdAt: string;
}

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