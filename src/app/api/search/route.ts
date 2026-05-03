import { NextResponse } from 'next/server';
import { getLLMClient } from '@/lib/llm-client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  try {
    const llmClient = getLLMClient();
    const prompt = `
      Act as an expert in the Hebrew Bible. The user searched for the following word or concept in Spanish: "${query}".
      Find exactly 3 relevant biblical verses from the Tanakh (Hebrew Bible) that relate to this concept.

      Return a JSON object with a single "results" array. Each item in the array MUST have:
      - "ref": The biblical reference in Spanish (e.g., "Génesis 1:1").
      - "he": The exact original Hebrew text of the verse (with nikkud).
      - "en": The translation of the verse in SPANISH (do not use English).

      Output ONLY valid JSON.
    `;

    const jsonString = await llmClient.callLLM(prompt);
    const parsedData = JSON.parse(jsonString);

    if (!parsedData.results || !Array.isArray(parsedData.results)) {
      throw new Error('Invalid JSON format from LLM');
    }

    return NextResponse.json({ results: parsedData.results });
  } catch (error: unknown) {
    console.error('Search error:', error);

    // Fallback in case of failure
    return NextResponse.json({
      results: [{
        ref: "Génesis 1:1",
        he: "בְּרֵאשִׁית בָּרָא אֱלֹהִִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ׃",
        en: `Error: ${error instanceof Error ? error.message : String(error)}`
      }]
    });
  }
}
