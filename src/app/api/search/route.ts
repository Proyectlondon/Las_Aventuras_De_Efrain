import { NextResponse } from 'next/server';

async function callLLM(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://efrain-app.vercel.app',
      'X-Title': 'Efrain Biblical Search',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('OpenRouter error in search:', err);
    throw new Error(`OpenRouter failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return content.replace(/```json\n?|```/g, '').trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const apiKey = process.env.OPENROUTER_API_KEY;

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
