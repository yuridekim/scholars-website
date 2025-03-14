// client/src/app/api/scholars/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const scholars = await prisma.scholar.findMany({
      include: {
        googleScholarPubs: true,
        pubmedPubs: true
      }
    })
    return NextResponse.json(scholars)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching scholars' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profile, publications } = body;
    
    console.log('Received profile data:', JSON.stringify(profile, null, 2));

    // Extract email domain from the email
    const emailDomain = profile.email?.toLowerCase()?.split('@')[1] || profile.emailDomain || null;
    const normalizedName = profile.name?.trim()?.toLowerCase();
    const normalizedAffiliation = profile.institution?.trim()?.toLowerCase() || profile.affiliation?.trim()?.toLowerCase();
    const scholarId = profile.scholarId?.trim() || null;

    // Validation
    if (!normalizedName) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // First check: Look for scholar with exact same Scholar ID
    if (scholarId) {
      const existingByScholarId = await prisma.scholar.findFirst({
        where: { scholarId }
      });

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

    // If we have a scholarId and got here, it means this is a new unique scholar
    // Skip name+affiliation check in this case
    if (!scholarId) {
      // Only check name + affiliation/email if no scholarId provided
      const existingByOtherCriteria = await prisma.scholar.findFirst({
        where: {
          AND: [
            {
              name: {
                equals: normalizedName,
                mode: 'insensitive'
              }
            },
            {
              OR: [
                ...(emailDomain ? [{
                  emailDomain: {
                    equals: emailDomain,
                    mode: 'insensitive' as Prisma.QueryMode
                  }
                }] : []),
                ...(normalizedAffiliation ? [{
                  affiliation: {
                    equals: normalizedAffiliation,
                    mode: 'insensitive' as Prisma.QueryMode
                  }
                }] : [])
              ]
            }
          ]
        }
      });

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

    // Create new scholar with publications
    const scholar = await prisma.$transaction(async (tx) => {
      const newScholar = await tx.scholar.create({
        data: {
          name: profile.name,
          emailDomain: emailDomain,
          // Handle different field names from different sources
          affiliation: profile.institution || profile.affiliation,
          scholarId: profile.scholarId,
          // Support both citedby (OpenAlex) and citations (Google Scholar) field names
          citedby: profile.citedby || profile.citations || null,
          citedby5y: profile.citedby5y || null,
          hindex: profile.hindex || null,
          i10index: profile.i10index || null,
          totalPub: profile.totalPubs || profile.works_count || null,
          interests: Array.isArray(profile.interests) ? profile.interests.join(', ') : profile.interests,
          fullName: profile.name,
        },
      });

      // Create publications
      if (publications && Array.isArray(publications)) {
        for (let i = 0; i < publications.length; i++) {
          const pub = publications[i];
          await tx.googleScholarPub.create({
            data: {
              scholarId: newScholar.scholarId!,
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
        }
      }

      return newScholar;
    });

    return NextResponse.json(scholar);
  } catch (error) {
    console.error('Error processing scholar:', error);
    return NextResponse.json(
      { error: 'Failed to process scholar data' },
      { status: 500 }
    );
  }
}