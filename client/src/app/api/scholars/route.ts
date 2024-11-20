// client/src/app/api/scholars/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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