// client/src/app/api/scholars/route.ts
import { NextResponse } from 'next/server';
import { fetchScholarsFromPalantir} from '@/components/palantir/palantirScholars';
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