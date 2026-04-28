import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { word, reference, hebrewText, translation, ageGroup, language } = await req.json();

    const prompt = `
      ROL: Eres un narrador experto en teología bíblica y pedagogía infantil.
      CONTEXTO: El usuario está usando la app "Efraín: Explorador de la Palabra".
      PERSONAJE PROTAGONISTA: Efraín (un niño explorador de 9 años, curioso y valiente).
      
      TAREA: ${ageGroup === 'dictionary' 
        ? 'Realiza un análisis etimológico y espiritual profundo de la palabra hebrea para un niño curioso.' 
        : `Crea un cuento corto para un niño de la etapa: ${ageGroup}.`}
      
      BASE BÍBLICA:
      - Palabra Clave: ${word}
      - Referencia: ${reference}
      - Texto Hebreo: ${hebrewText}
      - Traducción: ${translation}
      
      REGLAS ESTRICTAS:
      1. Fidelidad: Mantente 100% fiel al significado de la palabra y el versículo. NO inventes versículos.
      2. Enfoque: Relaciona la palabra con Jehová, Su amor, Sus promesas o la vida de Jesús.
      3. Estilo: ${ageGroup === 'dictionary' ? 'Usa un tono de "Sabías que..." fascinante.' : `Usa un lenguaje adaptado a ${ageGroup}.`}
      4. Idioma: Responde estrictamente en ${language === 'es' ? 'Español' : 'Inglés'}.
      5. Estructura: 
         ${ageGroup === 'dictionary' 
           ? '- Título: "Tesoro Escondido: [Palabra]" \\n- Significado original y fonética. \\n- Conexión con Jehová.' 
           : '- Título llamativo. \\n- La aventura de Efraín descubriendo esta palabra. \\n- Lección espiritual clara y reconfortante.'}
      
      FORMATO DE SALIDA (ESTRICTAMENTE JSON):
      {
        "title": "...",
        "story": "...",
        "lesson": "...",
        "verses": ["${reference}"]
      }
    `;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY no configurada en el servidor.');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://efrain-app.vercel.app',
        'X-Title': 'Efrain Explorador'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenRouter error:', err);
      throw new Error(`OpenRouter connection failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Clean potential Markdown JSON blocks
    const jsonString = content.replace(/```json\\n?|```/g, '').trim();
    const parsed = JSON.parse(jsonString);
    
    return NextResponse.json({
      title: parsed.title || "Una nueva aventura",
      story: parsed.story || content,
      lesson: parsed.lesson || "Jehová siempre está con nosotros.",
      verses: parsed.verses || [reference]
    });

  } catch (error: any) {
    console.error('API Generate Error:', error);
    return NextResponse.json({
      title: "Aventura en pausa",
      story: "Efraín tuvo un problema conectándose a la biblioteca global. Por favor, intenta de nuevo.",
      lesson: "La paciencia es un tesoro.",
      verses: []
    }, { status: 500 });
  }
}
