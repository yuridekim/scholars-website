// client/src/app/api/scholars/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id)
    const scholar = await prisma.scholar.findUnique({
      where: { id }
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
      { error: 'Failed to fetch scholar' },
      { status: 500 }
    )
  }
}