// /api/scholars/[scholarId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { scholarId: string } }
) {
  try {
    const scholarId = params.scholarId;

    if (!scholarId) {
      return NextResponse.json(
        { error: 'Invalid scholar ID' },
        { status: 400 }
      );
    }

    const scholar = await prisma.scholar.findUnique({
      where: {
        scholarId: scholarId
      },
      include: {
        googleScholarPubs: {
          orderBy: {
            pubYear: 'desc'
          }
        },
        pubmedPubs: {
          orderBy: {
            pubIndex: 'desc'
          }
        }
      }
    });

    if (!scholar) {
      return NextResponse.json(
        { error: 'Scholar not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(scholar);

  } catch (error) {
    console.error('Error fetching scholar:', error);
    return NextResponse.json(
      { error: 'Error fetching scholar' },
      { status: 500 }
    );
  }
}