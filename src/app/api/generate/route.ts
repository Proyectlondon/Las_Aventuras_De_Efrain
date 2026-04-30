import { NextResponse } from 'next/server';
import {
  buildNarratorPrompt,
  buildArtDirectorPrompt,
  validateManuscript,
  validateBlueprints,
} from '@/lib/narrative-engine';

// ═══════════════════════════════════════════════════════════════
// TWO-PASS STORY GENERATION PIPELINE
// Pass 1: The Narrator — writes the story text (7 Gold Rules)
// Pass 2: The Art Director — creates visual blueprints from manuscript
// ═══════════════════════════════════════════════════════════════

async function callLLM(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://efrain-app.vercel.app',
      'X-Title': 'Efrain Narrative Engine',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('OpenRouter error:', err);
    throw new Error(`OpenRouter failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return content.replace(/```json\n?|```/g, '').trim();
}

export async function POST(req: Request) {
  try {
    const { word, reference, hebrewText, translation, ageGroup, language } = await req.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    // ─── DICTIONARY MODE (unchanged) ───
    if (ageGroup === 'dictionary') {
      const prompt = `
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
      `;

      const dictContent = await callLLM(prompt, apiKey);
      const dictParsed = JSON.parse(dictContent);

      return NextResponse.json({
        title: dictParsed.title || 'Tesoro Escondido',
        story: dictParsed.story || dictContent,
        lesson: dictParsed.lesson || 'Jehová siempre está con nosotros.',
        verses: dictParsed.verses || [reference],
      });
    }

    // ═══════════════════════════════════════════════════════
    // PASS 1: THE NARRATOR — Story text with 7 Gold Rules
    // ═══════════════════════════════════════════════════════
    console.log('[Engine] Pass 1: The Narrator — writing story...');

    const narratorPrompt = buildNarratorPrompt({
      word,
      reference,
      hebrewText,
      translation,
      ageGroup,
      language: language || 'es',
    });

    const narratorContent = await callLLM(narratorPrompt, apiKey);
    const narratorParsed = JSON.parse(narratorContent);
    const manuscript = validateManuscript(narratorParsed);

    if (!manuscript) {
      console.error('[Engine] Narrator output failed validation:', narratorContent);
      throw new Error('Narrator output failed validation');
    }

    console.log(`[Engine] Manuscript ready: "${manuscript.title}" with ${manuscript.pages.length} pages`);

    // ═══════════════════════════════════════════════════════
    // PASS 2: THE ART DIRECTOR — Visual blueprints
    // ═══════════════════════════════════════════════════════
    console.log('[Engine] Pass 2: The Art Director — creating visual blueprints...');

    const artDirectorPrompt = buildArtDirectorPrompt(manuscript);
    const artDirectorContent = await callLLM(artDirectorPrompt, apiKey);
    const artDirectorParsed = JSON.parse(artDirectorContent);
    const blueprints = validateBlueprints(artDirectorParsed);

    if (!blueprints || blueprints.length === 0) {
      console.error('[Engine] Art Director output failed validation:', artDirectorContent);
      // Fallback: use manuscript scene descriptions as basic prompts
      const fallbackBlueprints = manuscript.pages.map((p) => ({
        pageNumber: p.pageNumber,
        fullPrompt: `${p.sceneDescription}. A 9-year-old Latin American boy named Efraín wearing a straw hat, leather vest, cream shirt, blue shorts, and boots. ${p.visualElements.join(', ')}. Warm pastoral anime illustration style.`,
      }));

      return NextResponse.json({
        title: manuscript.title,
        pages: manuscript.pages.map((page, i) => ({
          ...page,
          imagePrompt: fallbackBlueprints[i]?.fullPrompt || page.sceneDescription,
        })),
        lesson: manuscript.lesson,
        verses: manuscript.verses,
      });
    }

    console.log(`[Engine] Blueprints ready: ${blueprints.length} visual blueprints`);

    // ═══════════════════════════════════════════════════════
    // COMBINE: Manuscript + Blueprints → Final Story
    // ═══════════════════════════════════════════════════════
    const finalPages = manuscript.pages.map((page, i) => ({
      pageNumber: page.pageNumber,
      text: page.text,
      sceneDescription: page.sceneDescription,
      theme: page.theme,
      emotion: page.emotion,
      imagePrompt: blueprints[i]?.fullPrompt || page.sceneDescription,
    }));

    return NextResponse.json({
      title: manuscript.title,
      pages: finalPages,
      lesson: manuscript.lesson,
      verses: manuscript.verses,
    });

  } catch (error: any) {
    console.error('[Engine] Pipeline error:', error);
    return NextResponse.json({
      title: 'Aventura en pausa',
      story: 'Efraín tuvo un problema. Por favor, intenta de nuevo.',
      lesson: 'La paciencia es un tesoro.',
      verses: [],
      pages: [],
    }, { status: 500 });
  }
}
