import { NextResponse } from 'next/server';

import { GoogleGenerativeAI } from '@google/generative-ai';

async function callLLM(prompt: string, apiKey: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    }
  });

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text.replace(/```json\n?|```/g, '').trim();
  } catch (error) {
    console.error('Gemini API error in search:', error);
    throw new Error('Gemini API failed');
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const prompt = `
      Act as an expert in the Hebrew Bible. The user searched for the following word or concept in Spanish: "${query}".
      Find exactly 3 relevant biblical verses from the Tanakh (Hebrew Bible) that relate to this concept.
      
      Return a JSON object with a single "results" array. Each item in the array MUST have:
      - "ref": The biblical reference in Spanish (e.g., "Génesis 1:1").
      - "he": The exact original Hebrew text of the verse (with nikkud).
      - "en": The translation of the verse in SPANISH (do not use English).
      
      Output ONLY valid JSON.
    `;

    const jsonString = await callLLM(prompt, apiKey);
    const parsedData = JSON.parse(jsonString);

    if (!parsedData.results || !Array.isArray(parsedData.results)) {
      throw new Error('Invalid JSON format from LLM');
    }

    return NextResponse.json({ results: parsedData.results });
  } catch (error) {
    console.error('Search error:', error);
    
    // Fallback in case of failure
    return NextResponse.json({ 
      results: [{
        ref: "Génesis 1:1",
        he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ׃",
        en: "En el principio creó Dios los cielos y la tierra."
      }] 
    });
  }
}
