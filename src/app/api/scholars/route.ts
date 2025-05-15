// client/src/app/api/scholars/route.ts
import { NextResponse } from 'next/server';
import { fetchScholarsFromPalantir, saveScholarToPalantir } from '@/components/palantir/palantirScholars';
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
    
    const scholars = palantirScholars.map((scholar: any) => {
      return {
        id: scholar.id,
        name: scholar.name,
        emailDomain: scholar.emailDomain,
        affiliation: scholar.affiliation,
        scholarId: scholar.scholarId,
        citedby: scholar.citedby,
        citedby5y: scholar.citedby5y,
        hindex: scholar.hindex,
        hindex5y: scholar.hindex5y,
        i10index: scholar.i10index,
        i10index5y: scholar.i10index5y,
        totalPub: scholar.totalPub,
        interests: scholar.interests,
        fullName: scholar.fullName
      };
    });
    
    return NextResponse.json(scholars);
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
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const accessToken = authHeader.split(' ')[1];
    
    const { profile } = await request.json();
    
    const palantirScholar = {
      name: profile.name,
      email_domain: profile.emailDomain || '',
      affiliation: profile.affiliation || '',
      scholarId: profile.scholarId,
      citedby: profile.citedby || 0,
      citedby5y: profile.citedby5y || 0,
      hindex: profile.hindex || 0,
      hindex5y: profile.hindex5y || 0,
      i10index: profile.i10index || 0,
      i10index5y: profile.i10index5y || 0,
      total_pub: profile.totalPubs || 0,
      interests: profile.interests || '',
      homepage: profile.homepage || '',
      full_name: profile.fullName || profile.name,
      method: 'OpenAlex',
      created_at: new Date().toISOString()
    };
    
    await saveScholarToPalantir(palantirScholar, accessToken);
    
    return NextResponse.json({ 
      success: true, 
      message: `Scholar ${profile.name} was successfully added to the database` 
    });
  } catch (error) {
    console.error('Error adding scholar:', error);
    return NextResponse.json(
      { error: `Error adding scholar: ${error instanceof Error ? error.message : String(error)}` }, 
      { status: 500 }
    );
  }
}