// client/src/app/api/scholars/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const scholar = await prisma.scholar.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        googleScholarPubs: true,
        pubmedPubs: true
      }
    })
    if (!scholar) {
      return NextResponse.json(
        { error: 'Scholar not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(scholar)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching scholar' },
      { status: 500 }
    )
  }
}