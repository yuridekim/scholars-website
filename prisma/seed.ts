import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

const parseCSV = (filePath: string) => {
  const fullPath = path.join(__dirname, 'data', filePath)
  console.log(`Reading file from: ${fullPath}`)
  
  try {
    const fileContent = fs.readFileSync(fullPath, 'utf-8')
    
    const parsed = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    return parsed;
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

type ScholarInformation = {
  record_id: string
  name: string
  cohort: string
  gender: string
  stage: string
  com_discipline: string
  region: string
  productivity: string
  z1: string
  z2: string
}

type TopicInformation = {
  topic_id: string
  topic_name: string
  topic_description: string
  general_class14: string
  topic_popularity: string
  w1: string
  w2: string
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
      console.error('Record data:', JSON.stringify(record, null, 2))
      console.error('Scholar ID:', record.scholar_id)
    }
  }
}

async function importPubmedPubs() {
  try {
    const records = parseCSV('pubmed_df.csv') as PubMedRecord[]
    console.log(`Found ${records.length} PubMed publications to import`)
    
    for (const record of records) {
      try {
        const scholar = await prisma.scholar.findFirst({
          where: { name: record.name }
        })
        
        if (!scholar) {
          console.warn(`Warning: Scholar not found for name: ${record.name}`)
          continue
        }
        
        let grantSupport = null
        try {
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

        let keywords: string[] = []
        try {
          if (record.Keywords && record.Keywords !== '[]') {
            const keywordsMatch = record.Keywords.match(/'([^']+)'/g)
            if (keywordsMatch) {
              keywords = keywordsMatch.map(k => k.replace(/'/g, ''))
            }
          }
        } catch (e) {
          console.warn(`Warning: Could not parse keywords for ${record.Title}`)
        }

        let publicationType: string[] = []
        try {
          if (record['Publication Type']) {
            const cleanedPubType = record['Publication Type']
              .replace(/[\[\]']/g, '')
              .split(',')
              .map(t => t.trim())
              .filter(t => t.length > 0)
            publicationType = cleanedPubType
          }
        } catch (e) {
          console.warn(`Warning: Could not parse publication type for ${record.Title}`)
        }

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
      } catch (error) {
        console.error(`Error importing publication "${record.Title}":`, error)
        console.error('Record data:', JSON.stringify(record, null, 2))
      }
    }
  } catch (error) {
    console.error('Error in importPubmedPubs:', error)
  }
}

async function importScholarInfo() {
  const records = parseCSV('scholar_information.csv') as ScholarInformation[]
  
  for (const record of records) {
    try {
      await prisma.scholarInformation.upsert({
        where: {
          record_id: parseInt(record.record_id)
        },
        update: {
          name: record.name,
          cohort: parseInt(record.cohort),
          gender: record.gender,
          stage: record.stage,
          com_discipline: record.com_discipline,
          region: record.region,
          productivity: parseFloat(record.productivity),
          z1: parseFloat(record.z1),
          z2: parseFloat(record.z2)
        },
        create: {
          record_id: parseInt(record.record_id),
          name: record.name,
          cohort: parseInt(record.cohort),
          gender: record.gender,
          stage: record.stage,
          com_discipline: record.com_discipline,
          region: record.region,
          productivity: parseFloat(record.productivity),
          z1: parseFloat(record.z1),
          z2: parseFloat(record.z2)
        }
      })
    } catch (error) {
      console.error(`Error importing scholar information ${record.name}:`, error)
    }
  }
}

async function importTopicInfo() {
  try {
    const records = parseCSV('topic_information_cleaned.csv')
    console.log(`Found ${records.length} topics to import`)
    
    for (const record of records) {
      try {
        const topicRecord = {
          topic_id: record.topic_id,
          topic_name: record.topic_name,
          topic_description: record.topic_description.trim(),
          general_class14: parseInt(record.general_class14),
          topic_popularity: parseFloat(record.topic_popularity),
          w1: parseFloat(record.weight_1),
          w2: parseFloat(record.weight_2)
        }

        if (!topicRecord.topic_id || !topicRecord.topic_name) {
          throw new Error(`Missing required fields for topic ${record.topic_id}`)
        }

        await prisma.topicInformation.upsert({
          where: {
            topic_id: topicRecord.topic_id
          },
          update: topicRecord,
          create: topicRecord
        })

      } catch (error) {
        console.error('Error processing topic:', {
          id: record.topic_id,
          error: error instanceof Error ? error.message : String(error)
        })
        continue
      }
    }
    
    console.log('Completed topic information import')
  } catch (error) {
    console.error('Failed to import topic information:', error)
    throw error
  }
}


async function main() {
  try {
    console.log('Starting data import...')
    
    // await prisma.pubmedPub.deleteMany()
    console.log('Cleared PubMed publications')
    
    // await prisma.googleScholarPub.deleteMany()
    console.log('Cleared Google Scholar publications')
    
    // await prisma.scholar.deleteMany()
    console.log('Cleared scholars')

    // await prisma.scholarInformation.deleteMany()
    console.log('Cleared scholar_info')
    
    // await prisma.topicInformation.deleteMany()
    console.log('Cleared topic_info')
    
    await importScholars()
    console.log('✓ Scholars imported')
    
    await importGoogleScholarPubs()
    console.log('✓ Google Scholar publications imported')
    
    await importPubmedPubs()
    console.log('✓ PubMed publications imported')

    await importScholarInfo()
    console.log('✓ Scholar Information imported')
    
    await importTopicInfo()
    console.log('✓ Topic Information imported')
    
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