import { NextResponse } from 'next/server';
import { buildIllustratorPrompt } from '@/lib/narrative-engine';
import { readFileSync } from 'fs';
import { join } from 'path';

// ═══════════════════════════════════════════════════════════════
// THE ILLUSTRATOR — Image generation with CHARACTER_DNA lock
// + Reference image for character consistency
// ═══════════════════════════════════════════════════════════════

// Cache the reference image base64 to avoid re-reading on every call
let cachedReferenceImage: string | null = null;

function getReferenceImageBase64(): string | null {
  if (cachedReferenceImage) return cachedReferenceImage;
  
  try {
    const imagePath = join(process.cwd(), 'public', 'characters', 'efrain_final.png');
    const imageBuffer = readFileSync(imagePath);
    cachedReferenceImage = imageBuffer.toString('base64');
    return cachedReferenceImage;
  } catch (error) {
    console.error('[Illustrator] Failed to load reference image:', error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { imagePrompt, pageNumber } = await req.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    // Build the full prompt with CHARACTER_DNA + STYLE_ANCHOR injected
    const fullPrompt = buildIllustratorPrompt({
      pageNumber,
      fullPrompt: imagePrompt,
    });

    // Build the message with optional reference image
    const referenceBase64 = getReferenceImageBase64();

    // Construct multimodal message content
    const messageContent: any[] = [];

    // Add reference image if available (helps the model "see" what Efraín looks like)
    if (referenceBase64) {
      messageContent.push({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${referenceBase64}`,
        },
      });
      messageContent.push({
        type: 'text',
        text: 'REFERENCE: The image above shows the character Efraín. Use this as a visual reference for his appearance — his face, hat, vest, and overall style. Now generate the following illustration:\n\n' + fullPrompt,
      });
    } else {
      messageContent.push({
        type: 'text',
        text: fullPrompt,
      });
    }

    console.log(`[Illustrator] Generating image for page ${pageNumber}${referenceBase64 ? ' (with reference image)' : ''}...`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://efrain-app.vercel.app',
        'X-Title': 'Efrain Story Illustrations',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [{
          role: 'user',
          content: messageContent,
        }],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`[Illustrator] API error (page ${pageNumber}):`, err);
      
      // Retry without reference image if the first attempt fails
      if (referenceBase64) {
        console.log(`[Illustrator] Retrying page ${pageNumber} without reference image...`);
        return await generateWithoutReference(fullPrompt, pageNumber, apiKey);
      }
      
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const imageBase64 = await extractImage(response);

    if (!imageBase64) {
      // Retry without reference image
      if (referenceBase64) {
        console.log(`[Illustrator] No image in response, retrying page ${pageNumber} without reference...`);
        return await generateWithoutReference(fullPrompt, pageNumber, apiKey);
      }
      throw new Error('No image data in API response');
    }

    console.log(`[Illustrator] ✅ Page ${pageNumber} illustrated successfully`);

    return NextResponse.json({
      pageNumber,
      image: imageBase64,
      success: true,
    });

  } catch (error: any) {
    console.error('[Illustrator] Error:', error);
    return NextResponse.json({
      pageNumber: 0,
      image: null,
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

// ─── Fallback: generate without reference image ───
async function generateWithoutReference(prompt: string, pageNumber: number, apiKey: string) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://efrain-app.vercel.app',
      'X-Title': 'Efrain Story Illustrations',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-preview-04-17',
      messages: [{ role: 'user', content: prompt }],
      modalities: ['image', 'text'],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`[Illustrator] Fallback also failed (page ${pageNumber}):`, err);
    return NextResponse.json({
      pageNumber,
      image: null,
      success: false,
      error: 'Image generation failed on retry',
    }, { status: 500 });
  }

  const imageBase64 = await extractImage(response);
  
  return NextResponse.json({
    pageNumber,
    image: imageBase64,
    success: !!imageBase64,
  });
}

// ─── Extract image from OpenRouter multimodal response ───
async function extractImage(response: Response): Promise<string | null> {
  const data = await response.json();
  const messageContent = data.choices?.[0]?.message?.content;

  // Format 1: parts array with inline_data
  const parts = data.choices?.[0]?.message?.parts;
  if (parts && Array.isArray(parts)) {
    for (const part of parts) {
      if (part.inline_data?.mime_type?.startsWith('image/')) {
        return `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
      }
    }
  }

  // Format 2: content array with image_url
  if (Array.isArray(messageContent)) {
    for (const item of messageContent) {
      if (item.type === 'image_url' && item.image_url?.url) {
        return item.image_url.url;
      }
    }
  }

  // Format 3: direct data URL string
  if (typeof messageContent === 'string' && messageContent.startsWith('data:image')) {
    return messageContent;
  }

  console.error('[Illustrator] Could not extract image. Response:', JSON.stringify(data, null, 2).slice(0, 500));
  return null;
}
