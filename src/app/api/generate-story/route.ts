import { NextResponse } from 'next/server';
import { getLLMClient } from '@/lib/llm-client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { word, reference, hebrewText, translation, ageGroup, language } = body;

    const llmClient = getLLMClient();

    // Simple story generation using LLMClient
    const prompt = `Generate a children's story about the biblical word "${word}" from ${reference}.
Hebrew: ${hebrewText}, Translation: ${translation}.
Age group: ${ageGroup}, Language: ${language || 'es'}.

Return JSON format:
{
  "title": "Story Title",
  "story": "The story content",
  "lesson": "Moral lesson",
  "verses": ["${reference}"]
}`;

    const content = await llmClient.callLLM(prompt);
    const storyData = JSON.parse(content);

    return NextResponse.json(storyData);
  } catch (error) {
    console.error('Story generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate story',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
