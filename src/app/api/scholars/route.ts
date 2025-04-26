// client/src/app/api/scholars/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  fetchScholarsFromPalantir, saveScholarsToPalantir, PalantirScholar 
} from '@/components/palantir/palantirScholars';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const accessToken = authHeader.split(' ')[1];

    const response = await fetchScholarsFromPalantir(accessToken);
    
    const palantirScholars = Array.isArray(response) ? response : 
                            response.data ? response.data : [];
    
    const scholarsWithPublications = await Promise.all(
      palantirScholars.map(async (scholar: any) => {
        const scholarId = scholar.scholar_id;
        
        if (!scholarId) {
          return {
            id: scholar.id,
            name: scholar.name,
            emailDomain: scholar.emailDomain,
            affiliation: scholar.affiliation,
            scholarId: scholar.scholarId,
            citedby: scholar.citedby,
            citedby5y: scholar.citedby5y,
            hindex: scholar.hindex,
            i10index: scholar.i10index,
            totalPub: scholar.totalPub,
            interests: scholar.interests,
            fullName: scholar.fullName,
            googleScholarPubs: [],
            pubmedPubs: []
          };
        }
        
        const googleScholarPubs = await prisma.googleScholarPub.findMany({
          where: { scholarId }
        });
        
        const pubmedPubs = await prisma.pubmedPub.findMany({
          where: { scholarId }
        });
        
        return {
          id: scholar.id,
          name: scholar.name,
          emailDomain: scholar.emailDomain,
          affiliation: scholar.affiliation,
          scholarId: scholar.scholarId,
          citedby: scholar.citedby,
          citedby5y: scholar.citedby5y,
          hindex: scholar.hindex,
          i10index: scholar.i10index,
          totalPub: scholar.totalPub,
          interests: scholar.interests,
          fullName: scholar.fullName,
          googleScholarPubs,
          pubmedPubs
        };
      })
    );
    
    return NextResponse.json(scholarsWithPublications);
  } catch (error) {
    console.error('Error fetching scholars:', error);
    return NextResponse.json(
      { error: 'Error fetching scholars' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const accessToken = authHeader.split(' ')[1];

    const body = await request.json();
    const { profile, publications } = body;
    
    console.log('Received profile data:', JSON.stringify(profile, null, 2));

    const emailDomain = profile.email?.toLowerCase()?.split('@')[1] || profile.emailDomain || null;
    const normalizedName = profile.name?.trim()?.toLowerCase();
    const normalizedAffiliation = profile.institution?.trim()?.toLowerCase() || profile.affiliation?.trim()?.toLowerCase();
    const scholarId = profile.scholarId?.trim() || null;

    if (!normalizedName) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const response = await fetchScholarsFromPalantir(accessToken);
    const palantirScholars = Array.isArray(response) ? response : 
                            response.data ? response.data : [];
    
    if (scholarId) {
      const existingByScholarId = palantirScholars.find((s: any) => 
        s.scholar_id?.toLowerCase() === scholarId.toLowerCase()
      );

      if (existingByScholarId) {
        return NextResponse.json(
          {
            error: 'Scholar already exists in database',
            scholarId: existingByScholarId.id,
            matchType: 'scholarId'
          },
          { status: 409 }
        );
      }
    }

    if (!scholarId) {
      const existingByOtherCriteria = palantirScholars.find((s: any) => 
        s.name?.toLowerCase() === normalizedName &&
        (
          (emailDomain && s.email_domain?.toLowerCase() === emailDomain) ||
          (normalizedAffiliation && s.affiliation?.toLowerCase() === normalizedAffiliation)
        )
      );

      if (existingByOtherCriteria) {
        return NextResponse.json(
          {
            error: 'Scholar already exists in database',
            scholarId: existingByOtherCriteria.id,
            matchType: 'nameAndAffiliation'
          },
          { status: 409 }
        );
      }
    }

    const palantirScholarData: Partial<PalantirScholar> = {
      name: profile.name,
      email_domain: emailDomain,
      affiliation: profile.institution || profile.affiliation,
      scholar_id: scholarId,
      citedby: profile.citedby || profile.citations || null,
      citedby5y: profile.citedby5y || null,
      hindex: profile.hindex || null,
      i10index: profile.i10index || null,
      total_pub: profile.totalPubs || profile.works_count || null,
      interests: Array.isArray(profile.interests) ? profile.interests.join(', ') : profile.interests,
      full_name: profile.name,
    };
    
    try {
      await saveScholarsToPalantir([palantirScholarData as any], accessToken);
      
      const updatedResponse = await fetchScholarsFromPalantir(accessToken);
      const updatedScholars = Array.isArray(updatedResponse) ? updatedResponse : 
                           updatedResponse.data ? updatedResponse.data : [];
      
      const newScholar = updatedScholars.find((s: any) => 
        (scholarId && s.scholar_id === scholarId) ||
        (s.name === profile.name && 
         (s.email_domain === emailDomain || s.affiliation === (profile.institution || profile.affiliation)))
      );
      
      if (!newScholar) {
        throw new Error('Failed to find newly created scholar');
      }
      
      const savedPublications = [];
      
      if (publications && Array.isArray(publications)) {
        for (let i = 0; i < publications.length; i++) {
          const pub = publications[i];
          const newPub = await prisma.googleScholarPub.create({
            data: {
              scholarId: scholarId!,
              title: pub.title,
              pubYear: pub.year,
              citation: pub.citation,
              author: Array.isArray(pub.authors) ? pub.authors.join(', ') : pub.authors,
              journal: pub.venue,
              numCitations: pub.numCitations,
              citedbyUrl: pub.citedbyUrl,
              pubUrl: pub.pubUrl,
              citesId: pub.citesId || [],
              pubIndex: i
            }
          });
          
          savedPublications.push(newPub);
        }
      }

      return NextResponse.json({
        id: newScholar.id,
        name: newScholar.name,
        emailDomain: newScholar.email_domain,
        affiliation: newScholar.affiliation,
        scholarId: newScholar.scholar_id,
        citedby: newScholar.citedby,
        citedby5y: newScholar.citedby5y,
        hindex: newScholar.hindex,
        i10index: newScholar.i10index,
        totalPub: newScholar.total_pub,
        interests: newScholar.interests,
        fullName: newScholar.full_name,
        googleScholarPubs: savedPublications,
        pubmedPubs: []
      });
    } catch (error) {
      console.error('Error saving to Palantir:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error processing scholar:', error);
    return NextResponse.json(
      { error: 'Failed to process scholar data' },
      { status: 500 }
    );
  }
}