// ═══════════════════════════════════════════════════════════════
// LLM CLIENT — Unified interface for different AI providers
// ═══════════════════════════════════════════════════════════════

import { GoogleGenerativeAI } from '@google/generative-ai';
import http from 'http';

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class LLMClient {
  private googleAI: GoogleGenerativeAI | null = null;
  private openRouterKey: string;

  constructor(private googleApiKey: string) {
    this.googleAI = new GoogleGenerativeAI(googleApiKey);
    this.openRouterKey = process.env.OPENROUTER_API_KEY || '';
  }

  async callLLM(prompt: string, options: LLMOptions = {}): Promise<string> {
    const useLocalAI = process.env.USE_LOCAL_TEXT_AI === 'true';

    if (useLocalAI) {
      return this.callOllama(prompt, options);
    }

    // Try Gemini first, fallback to OpenRouter
    try {
      return await this.callGemini(prompt, options);
    } catch (error) {
      console.warn('[LLM] Gemini failed, trying OpenRouter:', error instanceof Error ? error.message : String(error));
      return this.callOpenRouter(prompt, options);
    }
  }

  private async callOllama(prompt: string, options: LLMOptions): Promise<string> {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1';
    const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:8b';

    const url = new URL(ollamaUrl);
    const postData = JSON.stringify({
      model: ollamaModel,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      ...options
    });

    const response = await new Promise<string>((resolve, reject) => {
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

    const data = JSON.parse(response);
    let text = data.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];
    return text.replace(/```json\n?|```/g, '').trim();
  }

  private async callGemini(prompt: string, options: LLMOptions): Promise<string> {
    if (!this.googleAI) {
      throw new Error('Google AI not initialized');
    }

    const model = this.googleAI.getGenerativeModel({
      model: options.model || 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        ...options
      }
    });

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) text = jsonMatch[0];
    return text.replace(/```json\n?|```/g, '').trim();
  }

  private async callOpenRouter(prompt: string, options: LLMOptions): Promise<string> {
    if (!this.openRouterKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openRouterKey}`,
        'HTTP-Referer': 'https://efrain-app.vercel.app',
        'X-Title': 'Efrain Story Generation',
      },
      body: JSON.stringify({
        model: options.model || 'anthropic/claude-3-haiku',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        ...options
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${err}`);
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) text = jsonMatch[0];
    return text.replace(/```json\n?|```/g, '').trim();
  }
}

// Singleton instance
let llmClient: LLMClient | null = null;

export function getLLMClient(): LLMClient {
  if (!llmClient) {
    const googleApiKey = process.env.GOOGLE_AI_API_KEY;
    if (!googleApiKey) {
      throw new Error('GOOGLE_AI_API_KEY not configured');
    }
    llmClient = new LLMClient(googleApiKey);
  }
  return llmClient;
}