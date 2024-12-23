// app/api/scholars/experiment/pubmed/types.ts
export interface PubMedAuthorAffiliation {
    Affiliation: string;
  }
  
  export interface PubMedAuthor {
    LastName: string;
    ForeName: string;
    Initials?: string;
    AffiliationInfo?: PubMedAuthorAffiliation[];
  }
  
  export interface PubMedKeyword {
    '#text': string;
    _MajorTopicYN: 'Y' | 'N';
  }
  
  export interface PubMedMeshDescriptor {
    '#text': string;
    _MajorTopicYN: 'Y' | 'N';
    _UI?: string;
  }
  
  export interface PubMedMeshHeading {
    DescriptorName: PubMedMeshDescriptor;
  }
  
  export interface PubMedArticle {
    MedlineCitation: {
      PMID: {
        '#text': string;
        _Version?: string;
      } | string;
      Article: {
        ArticleTitle: string;
        Abstract?: {
          AbstractText: string[];
        };
        Journal: {
          Title: string;
          JournalIssue: {
            PubDate: {
              Year: string;
              Month: string;
            };
          };
        };
        AuthorList: {
          Author: PubMedAuthor[];
        };
        ELocationID?: Array<{
          '#text': string;
          _EIdType: string;
        }>;
        PublicationTypeList: {
          PublicationType: Array<{
            '#text': string;
          }>;
        };
      };
      KeywordList?: {
        Keyword: PubMedKeyword[];
      };
      MeshHeadingList?: {
        MeshHeading: PubMedMeshHeading[];
      };
    };
  }
  
  export interface ParsedPubMedResult {
    basicInfo: {
      pmid: string;
      title: string;
      journal: string;
      publishDate: {
        year: string;
        month: string;
      };
      doi: string | null;
    };
    authors: Array<{
      lastName: string;
      foreName: string;
      affiliation: string | null;
    }>;
    abstract: string | null;
    keywords: string[];
    meshTerms: Array<{
      term: string;
      isMajorTopic: boolean;
    }>;
    publicationType: string[];
  }