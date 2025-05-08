// /api/scholars/[scholarId]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  fetchScholarByIdFromPalantir, 
  fetchScholarGooglePubs,
  fetchScholarPubMed
} from '@/components/palantir/palantirScholars';

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
      
      if (!palantirScholar) {
        console.log("No scholar found with the provided ID");
        return NextResponse.json(
          { error: 'Scholar not found' },
          { status: 404 }
        );
      }
      
      const googleScholarPubsResponse = await fetchScholarGooglePubs(
        palantirScholar.scholarId || '', accessToken);
      
      const googleScholarPubs = googleScholarPubsResponse.data || [];
      
      const pubmedPubsResponse = await fetchScholarPubMed(
        palantirScholar.scholarId || '', accessToken);
      
      const pubmedPubs = pubmedPubsResponse.data || [];
      
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
      console.error("Error in Palantir API call:", palantirError);
      return NextResponse.json(
        { error: `Palantir API error: ${palantirError instanceof Error ? palantirError.message : String(palantirError)}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching scholar:', error);
    return NextResponse.json(
      { error: 'Error fetching scholar data' },
      { status: 500 }
    );
  }
}