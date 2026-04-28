import { NextResponse } from 'next/server';
import { generateStory } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { word, reference, hebrewText, translation, ageGroup, language } = body;

    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    const storyData = await generateStory({
      word,
      reference,
      hebrewText,
      translation,
      ageGroup,
      language: language || 'es'
    });

    return NextResponse.json(storyData);
  } catch (error) {
    console.error('Story generation error:', error);
    return NextResponse.json({ error: 'Failed to generate story' }, { status: 500 });
  }
}
