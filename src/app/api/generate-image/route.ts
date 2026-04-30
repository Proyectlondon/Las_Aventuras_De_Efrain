import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { imagePrompt, pageNumber } = await req.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    // Build the full prompt with consistent style direction
    const fullPrompt = `Generate an illustration for a children's storybook page.

STYLE REQUIREMENTS:
- Warm pastoral anime illustration style, similar to Studio Ghibli
- Children's storybook art with soft warm lighting
- Green meadows, rolling hills, pastoral countryside
- Bright, cheerful, wholesome atmosphere
- No text or letters in the image
- High quality, detailed illustration
- Aspect ratio: landscape (wider than tall)

CHARACTER CONSISTENCY - EFRAÍN:
- 9-year-old Latin American boy
- Wears a light brown explorer/adventure hat
- Has a leather satchel/bandolera across his chest
- Wears simple farm clothes (light shirt, brown pants)
- Curious smile, bright expressive eyes
- Short dark brown hair

SCENE TO ILLUSTRATE:
${imagePrompt}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://efrain-app.vercel.app',
        'X-Title': 'Efrain Story Illustrations'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-preview-04-17',
        messages: [{ role: 'user', content: fullPrompt }],
        modalities: ['image', 'text'],
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`Image generation error (page ${pageNumber}):`, err);
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract image from response - OpenRouter returns multipart content
    const messageContent = data.choices?.[0]?.message?.content;
    
    // The response may contain inline_data with base64 image
    // Or it may be in parts format
    let imageBase64 = null;
    
    // Check if content is an array of parts (multimodal response)
    const parts = data.choices?.[0]?.message?.parts;
    if (parts && Array.isArray(parts)) {
      for (const part of parts) {
        if (part.inline_data?.mime_type?.startsWith('image/')) {
          imageBase64 = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
          break;
        }
      }
    }
    
    // Alternative: check content array format
    if (!imageBase64 && Array.isArray(messageContent)) {
      for (const item of messageContent) {
        if (item.type === 'image_url' && item.image_url?.url) {
          imageBase64 = item.image_url.url;
          break;
        }
      }
    }
    
    // Alternative: content might be a string with data URL
    if (!imageBase64 && typeof messageContent === 'string' && messageContent.startsWith('data:image')) {
      imageBase64 = messageContent;
    }

    if (!imageBase64) {
      console.error('No image found in response. Full response:', JSON.stringify(data, null, 2));
      throw new Error('No image data in API response');
    }

    return NextResponse.json({
      pageNumber,
      image: imageBase64,
      success: true
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json({
      pageNumber: 0,
      image: null,
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
