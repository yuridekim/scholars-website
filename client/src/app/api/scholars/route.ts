import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const scholars = await prisma.scholar.findMany()
    return NextResponse.json(scholars)
  } catch (error) {
    console.error('Error fetching scholars:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scholars' },
      { status: 500 }
    )
  }
}