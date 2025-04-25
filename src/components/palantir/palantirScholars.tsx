// src/components/palantir/scholars.ts
import { PalantirService, FetchOptions } from '@/components/palantir/commonApi';

export interface PalantirScholar {
  id: number;
  name: string;
  email_domain?: string;
  affiliation?: string;
  scholar_id?: string;
  citedby?: number;
  citedby5y?: number;
  hindex?: number;
  hindex5y?: number;
  i10index?: number;
  i10index5y?: number;
  total_pub?: number;
  interests?: string;
  homepage?: string;
  full_name?: string;
  method?: string;
  summary_training_start?: string;
  created_at: string;
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