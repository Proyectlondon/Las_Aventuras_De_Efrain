import { NextResponse } from 'next/server';
import {
  buildSinglePassStoryPrompt,
  validateSinglePassStory,
} from '@/lib/narrative-engine';

import { GoogleGenerativeAI } from '@google/generative-ai';

import http from 'http';

async function callLLM(prompt: string, apiKey: string): Promise<string> {
  const useLocalAI = process.env.USE_LOCAL_TEXT_AI === 'true';
  let lastOllamaError = '';
  if (useLocalAI) {
    try {
      const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1';
      const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:8b';
      
      console.log(`[Engine] Calling Ollama (http) at ${ollamaUrl}...`);
      
      const url = new URL(ollamaUrl);
      const postData = JSON.stringify({
        model: ollamaModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      const localText = await new Promise<string>((resolve, reject) => {
        const req = http.request({
          hostname: url.hostname,
          port: url.port,
          path: `${url.pathname}/chat/completions`.replace('//', '/'),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`Ollama error ${res.statusCode}`));
            } else {
              resolve(data);
            }
          });
        });
        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
      });

      const data = JSON.parse(localText);
      let text = data.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) text = jsonMatch[0];
      return text.replace(/```json\n?|```/g, '').trim();
    } catch (error: any) {
      console.warn('[Engine] Ollama http failed:', error.message);
      lastOllamaError = error.message;
    }
  }

  // Fallback to Gemini for production or if local fails
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];
    return text.replace(/```json\n?|```/g, '').trim();
  } catch (error: any) {
    console.error('[Gemini] API error details:', error);
    throw new Error(`Text generation failed. (Ollama: ${lastOllamaError || 'Disabled'}, Gemini: ${error.message || 'Key Expired'})`);
  }
}

export async function POST(req: Request) {
  try {
    const { word, reference, hebrewText, translation, ageGroup, language } = await req.json();

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY not configured');
    }

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

    const content = await callLLM(prompt, apiKey);
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
