// /api/scholars/[scholarId]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { fetchScholarByIdFromPalantir } from '@/components/palantir/palantirScholars';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  context: { params: Promise<{ scholarId: string }> | { scholarId: string } }
) {
  try {
    const params = await context.params;
    const scholarIdParam = params.scholarId;
    
    if (!scholarIdParam) {
      return NextResponse.json(
        { error: 'Invalid scholar ID' },
        { status: 400 }
      );
    }
    
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const accessToken = authHeader.split(' ')[1];
    
    try {
      console.log(`Fetching scholar with ID: ${scholarIdParam}`);
      
      const palantirScholar = await fetchScholarByIdFromPalantir(scholarIdParam, accessToken);
      
      console.log(`Palantir API response received`);
      
      if (!palantirScholar) {
        console.log("No scholar found with the provided ID");
        return NextResponse.json(
          { error: 'Scholar not found' },
          { status: 404 }
        );
      }
      
      const googleScholarPubs = await prisma.googleScholarPub.findMany({
        where: { scholarId: palantirScholar.scholarId || '' },
        orderBy: { pubYear: 'desc' }
      });
      
      const pubmedPubs = await prisma.pubmedPub.findMany({
        where: { scholarId: palantirScholar.scholarId || '' },
        orderBy: { pubIndex: 'desc' }
      });
      
      const scholar = {
        id: palantirScholar.id,
        name: palantirScholar.name,
        emailDomain: palantirScholar.emailDomain,
        affiliation: palantirScholar.affiliation,
        scholarId: palantirScholar.scholarId,
        citedby: palantirScholar.citedby,
        citedby5y: palantirScholar.citedby5y,
        hindex: palantirScholar.hindex,
        hindex5y: palantirScholar.hindex5y,
        i10index: palantirScholar.i10index,
        i10index5y: palantirScholar.i10index5y,
        totalPub: palantirScholar.totalPub,
        interests: palantirScholar.interests,
        fullName: palantirScholar.fullName,
        homepage: palantirScholar.homepage,
        googleScholarPubs,
        pubmedPubs
      };
      
      return NextResponse.json(scholar);
    } catch (palantirError) {
      console.error("🔍 Debug: Error in Palantir API call:", palantirError);
      throw palantirError;
    }
  } catch (error) {
    console.error('🔍 Debug: Error fetching scholar:', error);
    return NextResponse.json(
      { error: 'Error fetching scholar' },
      { status: 500 }
    );
  }
}