// src/app/scholars/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export type Scholar = {
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
    googleScholarPubs?: GoogleScholarPub[];
    pubmedPubs?: PubmedPub[];
  }
  
  export type GoogleScholarPub = {
    id: number;
    title: string;
    pubYear?: number;
    citation?: string;
    author?: string;
    journal?: string;
    publisher?: string;
    abstract?: string;
    numCitations?: number;
    pubUrl?: string;
  }
  
  export type PubmedPub = {
    id: number;
    title: string;
    authors: string[];
    affiliations: string[];
    pmid?: string;
    doi?: string;
    abstract?: string;
    meshTerms: string[];
    publicationType: string[];
    keywords: string[];
    grantSupport?: Grant[] | null // Changed to match Prisma's Json type
  }
  export type Grant = {
    GrantID: string
    Agency: string
    Country: string
    Acronym: string
    GrantNumber: string
    ProjectName: string
  }