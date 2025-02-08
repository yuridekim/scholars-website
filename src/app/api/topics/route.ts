// app/api/topics/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const topics = await prisma.topicInformation.findMany({
      orderBy: {
        topic_popularity: 'desc'
      }
    });
    
    return NextResponse.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Error fetching topics' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic = await prisma.topicInformation.create({
      data: {
        topic_id: body.topic_id,
        topic_name: body.topic_name,
        topic_description: body.topic_description,
        general_class14: body.general_class14,
        topic_popularity: body.topic_popularity,
        w1: body.w1,
        w2: body.w2,
      }
    });
    
    return NextResponse.json(topic);
  } catch (error) {
    console.error('Error creating topic:', error);
    return NextResponse.json(
      { error: 'Failed to create topic' },
      { status: 500 }
    );
  }
}