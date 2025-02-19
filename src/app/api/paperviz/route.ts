import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const papers = await prisma.paperTopic.findMany({
      select: {
        id: true,
        paperId: true,
        title: true,
        pubYear: true,
        abstract: true,
        journal: true,
        publisher: true,
        numCitations: true,
        generalClass14: true,
        vector2dComponent1: true,
        vector2dComponent2: true,
        scholarId: true,
        scholarName: true
      }
    });

    const paperVizData = papers.map(paper => ({
      id: paper.id,
      paperId: paper.paperId,
      title: paper.title,
      pubYear: paper.pubYear,
      abstract: paper.abstract,
      journal: paper.journal,
      publisher: paper.publisher,
      numCitations: paper.numCitations ?? 0,
      generalClass14: paper.generalClass14 ?? 1,
      vector2dComponent1: paper.vector2dComponent1,
      vector2dComponent2: paper.vector2dComponent2,
      scholarId: paper.scholarId,
      scholarName: paper.scholarName
    }));
    
    return NextResponse.json(paperVizData);

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error fetching paper visualization data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}