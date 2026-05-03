import { NextResponse } from 'next/server';
import {
  buildSinglePassStoryPrompt,
  validateSinglePassStory,
} from '@/lib/narrative-engine';

import { getLLMClient } from '@/lib/llm-client';

export async function POST(req: Request) {
  try {
    const { word, reference, hebrewText, translation, ageGroup, language } = await req.json();

    const llmClient = getLLMClient();

    // ─── DICTIONARY MODE ───
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

      const dictContent = await llmClient.callLLM(prompt);
      const dictParsed = JSON.parse(dictContent);

      return NextResponse.json({
        title: dictParsed.title || 'Tesoro Escondido',
        story: dictParsed.story || dictContent,
        lesson: dictParsed.lesson || 'Jehová siempre está con nosotros.',
        verses: dictParsed.verses || [reference],
      });
    }

    // ═══════════════════════════════════════════════════════
    // SINGLE-PASS: Story and Blueprints together
    // ═══════════════════════════════════════════════════════
    console.log('[Engine] Single Pass: Generating story and blueprints...');

    const prompt = buildSinglePassStoryPrompt({
      word,
      reference,
      hebrewText,
      translation,
      ageGroup,
      language: language || 'es',
    });

    const content = await llmClient.callLLM(prompt);
    const parsed = JSON.parse(content);
    const manuscript = validateSinglePassStory(parsed);

    if (!manuscript) {
      console.error('[Engine] Output failed validation:', content);
      throw new Error('LLM output failed validation');
    }

    console.log(`[Engine] Manuscript ready: "${manuscript.title}" with ${manuscript.pages.length} pages and visual blueprints.`);

    return NextResponse.json({
      title: manuscript.title,
      pages: manuscript.pages,
      lesson: manuscript.lesson,
      verses: manuscript.verses,
    });

  } catch (error: any) {
    console.error('[Engine] Pipeline error:', error);
    return NextResponse.json({
      title: 'Aventura en pausa',
      story: `Error técnico: ${error instanceof Error ? error.message : String(error)}`,
      lesson: 'La paciencia es un tesoro.',
      verses: [],
      pages: [],
    }, { status: 500 });
  }
}
