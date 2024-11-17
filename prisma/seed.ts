import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'  // Changed this import

const prisma = new PrismaClient()

const parseCSV = (filePath: string) => {
  const fullPath = path.join(__dirname, 'data', filePath)
  console.log(`Reading file from: ${fullPath}`)
  
  try {
    const fileContent = fs.readFileSync(fullPath, 'utf-8')
    return parse(fileContent, {  // Using synchronous parse
      columns: true,
      skip_empty_lines: true
    })
  } catch (error) {
    console.error(`Error reading file ${fullPath}:`, error)
    throw error
  }
}

type ScholarRecord = {
  name: string
  email_domain?: string
  affiliation?: string
  scholar_id: string
  citedby?: string
  citedby5y?: string
  hindex?: string
  hindex5y?: string
  i10index?: string
  i10index5y?: string
  total_pub?: string
  interests?: string
  homepage?: string
  full_name?: string
  method?: string
  summary_training_start?: string
}

type PublicationRecord = {
  title: string
  pub_year?: string
  citation?: string
  author?: string
  journal?: string
  publisher?: string
  abstract?: string
  author_pub_id?: string
  num_citations?: string
  citedby_url?: string
  cites_id?: string
  pub_url?: string
  scholar_id: string
  pub_index?: string
}

type PubMedRecord = {
  Title: string
  Authors?: string
  Affiliations?: string
  PMID?: string
  DOI?: string
  'Abstract Text'?: string
  'MeSH Terms'?: string
  'Grant Support'?: string
  'Publication Type'?: string
  Keywords?: string
  name: string
  pub_index?: number | string
  record_id?: string
  timestamp?: string
  paper_id?: string
  dict_error?: string | number
}

async function importScholars() {
  const records = parseCSV('id_df.csv') as ScholarRecord[]
  console.log(`Found ${records.length} scholars to import`)
  
  for (const record of records) {
    try {
      await prisma.scholar.upsert({
        where: {
          scholarId: record.scholar_id
        },
        update: {
          name: record.name,
          emailDomain: record.email_domain,
          affiliation: record.affiliation,
          citedby: record.citedby ? parseInt(record.citedby) : null,
          citedby5y: record.citedby5y ? parseInt(record.citedby5y) : null,
          hindex: record.hindex ? parseInt(record.hindex) : null,
          hindex5y: record.hindex5y ? parseInt(record.hindex5y) : null,
          i10index: record.i10index ? parseInt(record.i10index) : null,
          i10index5y: record.i10index5y ? parseInt(record.i10index5y) : null,
          totalPub: record.total_pub ? parseInt(record.total_pub) : null,
          interests: record.interests,
          homepage: record.homepage,
          fullName: record.full_name,
          method: record.method,
          summaryTrainingStart: record.summary_training_start ? new Date(record.summary_training_start) : null
        },
        create: {
          scholarId: record.scholar_id,
          name: record.name,
          emailDomain: record.email_domain,
          affiliation: record.affiliation,
          citedby: record.citedby ? parseInt(record.citedby) : null,
          citedby5y: record.citedby5y ? parseInt(record.citedby5y) : null,
          hindex: record.hindex ? parseInt(record.hindex) : null,
          hindex5y: record.hindex5y ? parseInt(record.hindex5y) : null,
          i10index: record.i10index ? parseInt(record.i10index) : null,
          i10index5y: record.i10index5y ? parseInt(record.i10index5y) : null,
          totalPub: record.total_pub ? parseInt(record.total_pub) : null,
          interests: record.interests,
          homepage: record.homepage,
          fullName: record.full_name,
          method: record.method,
          summaryTrainingStart: record.summary_training_start ? new Date(record.summary_training_start) : null
        }
      })
    } catch (error) {
      console.error(`Error importing scholar ${record.name}:`, error)
    }
  }
}

async function importGoogleScholarPubs() {
  const records = parseCSV('gg_pub_df.csv') as PublicationRecord[]
  console.log(`Found ${records.length} Google Scholar publications to import`)
  
  for (const record of records) {
    try {
      await prisma.googleScholarPub.create({
        data: {
          title: record.title,
          pubYear: record.pub_year ? parseInt(record.pub_year) : null,
          citation: record.citation,
          author: record.author,
          journal: record.journal,
          publisher: record.publisher,
          abstract: record.abstract,
          authorPubId: record.author_pub_id,
          numCitations: record.num_citations ? parseInt(record.num_citations) : null,
          citedbyUrl: record.citedby_url,
          citesId: record.cites_id ? record.cites_id.split(',') : [],
          pubUrl: record.pub_url,
          scholarId: record.scholar_id,
          pubIndex: record.pub_index ? parseInt(record.pub_index) : null
        }
      })
    } catch (error) {
      console.error(`Error importing publication ${record.title}:`, error)
    }
  }
}

async function importPubmedPubs() {
  try {
    const records = parseCSV('pubmed_df.csv') as PubMedRecord[]
    console.log(`Found ${records.length} PubMed publications to import`)
    
    for (const record of records) {
      try {
        // First find the scholar by name
        const scholar = await prisma.scholar.findFirst({
          where: { name: record.name }
        })
        
        if (!scholar) {
          console.warn(`Warning: Scholar not found for name: ${record.name}`)
          continue
        }
        
        // Safely parse grant support
        let grantSupport = null
        try {
          // Clean up the string and try to parse it
          if (record['Grant Support']) {
            const cleanedGrantSupport = record['Grant Support']
              .replace(/'/g, '"')  // Replace single quotes with double quotes
              .replace(/None/g, 'null')  // Replace Python None with JSON null
              .replace(/True/g, 'true')  // Replace Python True with JSON true
              .replace(/False/g, 'false')  // Replace Python False with JSON false
            grantSupport = JSON.parse(cleanedGrantSupport)
          }
        } catch (e) {
          console.warn(`Warning: Could not parse grant support for ${record.Title}`)
          console.warn('Grant Support data:', record['Grant Support'])
        }

        // Safely parse keywords
        let keywords: string[] = []
        try {
          if (record.Keywords && record.Keywords !== '[]') {
            // Extract just the string values from the complex structure
            const keywordsMatch = record.Keywords.match(/'([^']+)'/g)
            if (keywordsMatch) {
              keywords = keywordsMatch.map(k => k.replace(/'/g, ''))
            }
          }
        } catch (e) {
          console.warn(`Warning: Could not parse keywords for ${record.Title}`)
        }

        // Parse publication types
        let publicationType: string[] = []
        try {
          if (record['Publication Type']) {
            const cleanedPubType = record['Publication Type']
              .replace(/[\[\]']/g, '')  // Remove brackets and quotes
              .split(',')
              .map(t => t.trim())
              .filter(t => t.length > 0)
            publicationType = cleanedPubType
          }
        } catch (e) {
          console.warn(`Warning: Could not parse publication type for ${record.Title}`)
        }

        console.log(`Importing publication: ${record.Title} for scholar ${scholar.name}`)
        
        const result = await prisma.pubmedPub.create({
          data: {
            title: record.Title,
            authors: record.Authors ? record.Authors.split(' /&/ ') : [],
            affiliations: record.Affiliations ? record.Affiliations.split(' /&/ ') : [],
            pmid: record.PMID,
            doi: record.DOI,
            abstract: record['Abstract Text'],
            meshTerms: record['MeSH Terms'] ? record['MeSH Terms'].split(' /&/ ') : [],
            grantSupport: grantSupport,
            publicationType: publicationType,
            keywords: keywords,
            scholarId: scholar.scholarId!,
            pubIndex: record.pub_index ? parseInt(record.pub_index.toString()) : null
          }
        })
        console.log(`Successfully imported publication ${result.id}`)
      } catch (error) {
        console.error(`Error importing publication "${record.Title}":`, error)
        console.error('Record data:', JSON.stringify(record, null, 2))
      }
    }
  } catch (error) {
    console.error('Error in importPubmedPubs:', error)
  }
}

async function main() {
  try {
    console.log('Starting data import...')
    
    // Clear existing data
    await prisma.pubmedPub.deleteMany()
    console.log('Cleared PubMed publications')
    
    // await prisma.googleScholarPub.deleteMany()
    // console.log('Cleared Google Scholar publications')
    
    // await prisma.scholar.deleteMany()
    // console.log('Cleared scholars')
    
    // await importScholars()
    // console.log('✓ Scholars imported')
    
    // await importGoogleScholarPubs()
    // console.log('✓ Google Scholar publications imported')
    
    await importPubmedPubs()
    console.log('✓ PubMed publications imported')
    
    console.log('Data import completed successfully')
  } catch (error) {
    console.error('Error during import:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })