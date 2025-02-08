// app/api/ptviz/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const scholars = await prisma.scholar.findMany({
      include: {
        paperTopics: {
          take: 1,
          orderBy: { createdAt: 'asc' }
        },
      },
    });

    const ptVizData = scholars.map(scholar => {
      if (scholar.paperTopics && scholar.paperTopics.length > 0) {
        const paperTopic = scholar.paperTopics[0];
        return {
          id: scholar.scholarId || "NO_ID",
          name: scholar.name,
          class: paperTopic.generalClass14 || 0,
          w1: paperTopic.vector2dComponent1 || 0,
          w2: paperTopic.vector2dComponent2 || 0,
        };
      } else {
        return null;
      }
    }).filter(item => item !== null) as any;

    return NextResponse.json(ptVizData);

  } catch (error) {
    console.error('Error fetching ptViz data:', error);
    return NextResponse.json(
      { error: 'Error fetching ptViz data' },
      { status: 500 }
    );
  }
}