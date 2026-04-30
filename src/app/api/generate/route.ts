import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { word, reference, hebrewText, translation, ageGroup, language } = await req.json();

    const isDictionary = ageGroup === 'dictionary';

    const prompt = isDictionary
      ? `
        ROL: Eres un narrador experto en teología bíblica y pedagogía infantil.
        CONTEXTO: El usuario está usando la app "Efraín: Explorador de la Palabra".
        PERSONAJE PROTAGONISTA: Efraín (un niño explorador de 9 años, curioso y valiente).
        
        TAREA: Realiza un análisis etimológico y espiritual profundo de la palabra hebrea para un niño curioso.
        
        BASE BÍBLICA:
        - Palabra Clave: ${word}
        - Referencia: ${reference}
        - Texto Hebreo: ${hebrewText}
        - Traducción: ${translation}
        
        REGLAS ESTRICTAS:
        1. Fidelidad: Mantente 100% fiel al significado de la palabra y el versículo. NO inventes versículos.
        2. Enfoque: Relaciona la palabra con Jehová, Su amor, Sus promesas o la vida de Jesús.
        3. Estilo: Usa un tono de "Sabías que..." fascinante.
        4. Idioma: Responde estrictamente en ${language === 'es' ? 'Español' : 'Inglés'}.
        5. Estructura: - Título: "Tesoro Escondido: [Palabra]" - Significado original y fonética. - Conexión con Jehová.
        
        FORMATO DE SALIDA (ESTRICTAMENTE JSON):
        {
          "title": "...",
          "story": "...",
          "lesson": "...",
          "verses": ["${reference}"]
        }
      `
      : `
        ROL: Eres un narrador experto en teología bíblica, pedagogía infantil y cuentos ilustrados para niños.
        CONTEXTO: El usuario está usando la app "Efraín: Explorador de la Palabra".
        
        PERSONAJE PROTAGONISTA: Efraín, un niño explorador latinoamericano de 9 años. 
        Siempre usa sombrero de explorador, bandolera de cuero, ropa de campo. 
        Vive en un entorno pastoral con prados verdes, colinas suaves, animales de granja (ovejas, cabras, caballos, vacas, gallinas, un perro collie).
        Tiene una sonrisa curiosa y ojos brillantes.
        
        TAREA: Crea un CUENTO ILUSTRADO de exactamente 5 páginas para un niño de la etapa: ${ageGroup}.
        
        BASE BÍBLICA:
        - Palabra Clave: ${word}
        - Referencia: ${reference}
        - Texto Hebreo: ${hebrewText}
        - Traducción: ${translation}
        
        REGLAS ESTRICTAS:
        1. FIDELIDAD: Mantente 100% fiel al significado de la palabra y el versículo. NO inventes versículos.
        2. ENFOQUE: Relaciona la palabra con Jehová, Su amor, Sus promesas o la vida de Jesús.
        3. ESTILO: Lenguaje adaptado a ${ageGroup}. Narrativa cálida, emotiva, con descripciones visuales ricas.
        4. IDIOMA: Responde estrictamente en ${language === 'es' ? 'Español' : 'Inglés'}.
        5. ESTRUCTURA: Exactamente 5 páginas. Cada página debe tener un momento clave de la historia.
        6. ARCO NARRATIVO:
           - Página 1: Introducción — Efraín en su entorno, se presenta el tema/situación
           - Página 2: Reflexión — Efraín piensa, recuerda una enseñanza, busca sabiduría
           - Página 3: Acción — Efraín toma una decisión valiente, actúa con amor
           - Página 4: Resultado — Las consecuencias positivas de su acción, alegría
           - Página 5: Lección — Efraín reflexiona, mira al horizonte, promete vivir la enseñanza
        7. ESCENAS VISUALES: Cada página debe tener una descripción de escena rica y un tema/valor.
        8. IMAGE PROMPTS: Para cada página, genera un prompt EN INGLÉS optimizado para generación de imágenes IA.
           El prompt debe describir: la escena exacta, a Efraín (9-year-old Latin American boy with explorer hat, satchel, farm clothes), 
           los animales presentes, el paisaje, la emoción, la iluminación.
           Estilo: "warm pastoral anime illustration, children's storybook art, soft warm lighting, green meadows, rolling hills"
        
        FORMATO DE SALIDA (ESTRICTAMENTE JSON):
        {
          "title": "TÍTULO DEL CUENTO EN MAYÚSCULAS",
          "pages": [
            {
              "pageNumber": 1,
              "text": "Texto narrativo completo de esta página (3-5 oraciones ricas en descripción visual)...",
              "sceneDescription": "Descripción breve de la escena e imagen clave",
              "theme": "Valor o Tema de esta página (ej: Conciencia, Reflexión, Reconciliación)",
              "imagePrompt": "Detailed English prompt for AI image generation describing this exact scene with Efraín..."
            },
            {
              "pageNumber": 2,
              "text": "...",
              "sceneDescription": "...",
              "theme": "...",
              "imagePrompt": "..."
            },
            {
              "pageNumber": 3,
              "text": "...",
              "sceneDescription": "...",
              "theme": "...",
              "imagePrompt": "..."
            },
            {
              "pageNumber": 4,
              "text": "...",
              "sceneDescription": "...",
              "theme": "...",
              "imagePrompt": "..."
            },
            {
              "pageNumber": 5,
              "text": "...",
              "sceneDescription": "...",
              "theme": "...",
              "imagePrompt": "..."
            }
          ],
          "lesson": "Lección espiritual clara y reconfortante",
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

    if (isDictionary) {
      return NextResponse.json({
        title: parsed.title || "Una nueva aventura",
        story: parsed.story || content,
        lesson: parsed.lesson || "Jehová siempre está con nosotros.",
        verses: parsed.verses || [reference]
      });
    }
    
    // Illustrated story format
    return NextResponse.json({
      title: parsed.title || "UNA NUEVA AVENTURA",
      pages: parsed.pages || [],
      lesson: parsed.lesson || "Jehová siempre está con nosotros.",
      verses: parsed.verses || [reference]
    });

  } catch (error: any) {
    console.error('API Generate Error:', error);
    return NextResponse.json({
      title: "Aventura en pausa",
      story: "Efraín tuvo un problema conectándose a la biblioteca global. Por favor, intenta de nuevo.",
      lesson: "La paciencia es un tesoro.",
      verses: [],
      pages: []
    }, { status: 500 });
  }
}
