import { NextResponse } from 'next/server';
import { buildIllustratorPrompt } from '@/lib/narrative-engine';
import http from 'http';

// Simple in-memory rate limiter (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (clientData.count >= RATE_LIMIT) {
    return false;
  }

  clientData.count++;
  return true;
}

export async function POST(req: Request) {
  let pageNumber = 0;
  try {
    // Basic rate limiting by IP (simplified)
    const clientId = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientId)) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      }, { status: 429 });
    }

    const body = await req.json();
    const { imagePrompt, pageNumber: reqPageNumber } = body;

    // Input validation
    if (!imagePrompt || typeof imagePrompt !== 'string' || imagePrompt.length > 2000) {
      return NextResponse.json({
        success: false,
        error: 'Invalid imagePrompt: must be a string under 2000 characters'
      }, { status: 400 });
    }

    if (!reqPageNumber || typeof reqPageNumber !== 'number' || reqPageNumber < 1 || reqPageNumber > 20) {
      return NextResponse.json({
        success: false,
        error: 'Invalid pageNumber: must be a number between 1 and 20'
      }, { status: 400 });
    }

    pageNumber = reqPageNumber;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    // Build the full prompt with CHARACTER_DNA + STYLE_ANCHOR injected
    const fullPrompt = buildIllustratorPrompt(imagePrompt);

    const useLocalAI = process.env.USE_LOCAL_IMAGE_AI === 'true';

    if (useLocalAI) {
      // Keep the existing Fooocus implementation as fallback
      const localImageApi = process.env.LOCAL_IMAGE_API || 'http://127.0.0.1:7865/api/predict';
      console.log(`[Illustrator] Generating image with Fooocus for page ${pageNumber}...`);

      try {
        // Fooocus Gradio API requires a specific array of 152 parameters for fn_index 67
        const data = new Array(152).fill(null);

        // Basic Settings
        data[0] = true; // Generate Image Grid
        data[1] = fullPrompt; // Positive Prompt
        data[2] = "nsfw, low quality, bad anatomy, worst quality, text, watermark, signature, blurry, deformed, extra limbs"; // Negative Prompt
        data[3] = ["Fooocus V2", "Fooocus Enhance", "Fooocus Sharp"]; // Styles
        data[4] = "Speed"; // Performance (Speed, Quality, Extreme Speed)
        data[5] = "1152×896"; // Aspect Ratio (1152x896 is good for 1.3:1)
        data[6] = 1; // Image Number
        data[7] = "png"; // Output Format
        data[8] = "-1"; // Seed
        data[9] = true; // Read wildcards in order
        data[10] = 2.0; // Image Sharpness
        data[11] = 4.0; // Guidance Scale
        data[12] = "juggernautXL_v8Rundiffusion.safetensors"; // Base Model
        data[13] = "None"; // Refiner
        data[14] = 0.1; // Refiner Switch At

        // LoRAs (indices 15-29)
        data[15] = true; data[16] = "None"; data[17] = 0.5; // LoRA 1
        data[18] = true; data[19] = "None"; data[20] = 0.5; // LoRA 2
        data[21] = true; data[22] = "None"; data[23] = 0.5; // LoRA 3
        data[24] = true; data[25] = "None"; data[26] = 0.5; // LoRA 4
        data[27] = true; data[28] = "None"; data[29] = 0.5; // LoRA 5

        // Advanced / Input Image Settings
        data[30] = false; // Input Image Checkbox (disabled for security)
        data[31] = ""; // parameter_212
        data[32] = "Disabled"; // Upscale or Variation

        // Indices 38-41 (Flags)
        data[38] = true; // Disable Preview
        data[39] = false; // Disable Intermediate Results
        data[40] = false; // Disable seed increment
        data[41] = false; // Black Out NSFW

        // Indices 42-46 (ADM / CLIP)
        data[42] = 0.1; data[43] = 0.1; data[44] = 0.0; data[45] = 1.0; data[46] = 1.0;

        // Indices 47-49 (Sampler/Scheduler/VAE)
        data[47] = "euler"; data[48] = "normal"; data[49] = "Default (model)";

        // Indices 50-55 (Overwrites)
        data[50] = -1; data[51] = -1; data[52] = -1; data[53] = -1; data[54] = -1; data[55] = -1;

        // Indices 56-59 (Mixing/Debug)
        data[56] = true; data[57] = true; data[58] = true; data[59] = true;

        // Indices 60-63 (Canny/Refiner/Softness)
        data[60] = 1; data[61] = 1; data[62] = "joint"; data[63] = 0.0;

        // Indices 64-68 (FreeU)
        data[64] = false; data[65] = 1.01; data[66] = 1.02; data[67] = 0.99; data[68] = 0.95;

        // Indices 69-73 (Inpaint)
        data[69] = true; data[70] = true; data[71] = "None"; data[72] = 0.0; data[73] = 0.0;

        // Indices 74-79 (Advanced Masking)
        data[74] = true; data[75] = true; data[76] = -64; data[77] = true; data[78] = true; data[79] = "fooocus";

        // IMAGE PROMPT SLOTS (Indices 80-95) - All disabled for security
        data[83] = "ImagePrompt";
        data[87] = "ImagePrompt";
        data[91] = "ImagePrompt";
        data[95] = "ImagePrompt";

        // Indices 96-151 (Enhancements/GroundingDINO/etc)
        for (let i = 96; i < 152; i++) {
          if (data[i] === undefined) data[i] = null;
        }
        data[100] = false; // Enhance
        data[101] = "Disabled"; // Upscale/Variation
        data[102] = "Before First Enhancement";
        data[103] = "Original Prompts";

        const url = new URL(localImageApi);
        const postData = JSON.stringify({
          data,
          event_data: null,
          fn_index: 67
        });

        const localResponseText = await new Promise<string>((resolve, reject) => {
          const req = http.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            }
          }, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
              if (res.statusCode && res.statusCode >= 400) {
                reject(new Error(`Fooocus error ${res.statusCode}: ${body}`));
              } else {
                resolve(body);
              }
            });
          });
          req.on('error', (e) => reject(e));
          req.write(postData);
          req.end();
        });

        const localData = JSON.parse(localResponseText);
        console.log('[Illustrator] Fooocus response received');

        let imageName = '';
        if (localData.data && Array.isArray(localData.data)) {
          for (const item of localData.data) {
            if (Array.isArray(item) && item.length > 0 && item[0] && item[0].name) {
              imageName = item[0].name;
              break;
            }
          }
        }

        if (!imageName) {
          console.error('[Illustrator] Could not find image in Fooocus response:', JSON.stringify(localData).slice(0, 1000));
          throw new Error('Fooocus did not return an image path. Check Fooocus console for errors.');
        }

        const imageUrl = `${localImageApi.replace('/api/predict', '')}/file=${imageName}`;

        try {
          const imageBase64Data = await new Promise<string>((resolve, reject) => {
            const req = http.get(imageUrl, (res) => {
              const chunks: any[] = [];
              res.on('data', (chunk) => chunks.push(chunk));
              res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve(buffer.toString('base64'));
              });
              res.on('error', (e) => reject(e));
            });
            req.on('error', (e) => reject(e));
          });
          const finalImage = `data:image/png;base64,${imageBase64Data}`;

          console.log(`[Illustrator] ✅ Page ${pageNumber} illustrated locally by Fooocus`);
          return NextResponse.json({
            pageNumber,
            image: finalImage,
            success: true,
          });
        } catch {
          console.warn('[Illustrator] Could not convert Fooocus image to base64, returning direct URL');
          return NextResponse.json({
            pageNumber,
            image: imageUrl,
            success: true,
          });
        }
      } catch (localError: unknown) {
        console.warn('[Illustrator] Local AI failed, falling back to cloud:', localError instanceof Error ? localError.message : String(localError));
        // Fall through to cloud implementation
      }
    }

    // ═══ CLOUD IMAGE GENERATION VIA OPENROUTER ═══
    console.log(`[Illustrator] Generating image for page ${pageNumber} via OpenRouter...`);

    // Use Flux Pro for high-quality children's book illustrations
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://efrain-app.vercel.app',
        'X-Title': 'Efrain Story Illustrations',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/flux.2-pro',
        messages: [{
          role: 'user',
          content: fullPrompt,
        }],
        modalities: ['image'],
        image_config: {
          aspect_ratio: '5:4', // Good for storybook pages (landscape)
          image_size: '2K',    // High quality for illustrations
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`[Illustrator] OpenRouter API error (page ${pageNumber}):`, err);
      throw new Error(`Image generation failed: ${response.status} - ${err}`);
    }

    const data = await response.json();

    // Extract image from OpenRouter response
    const message = data.choices?.[0]?.message;
    if (!message) {
      throw new Error('No message in API response');
    }

    let imageUrl = null;

    // Check for images array (OpenRouter format)
    if (message.images && Array.isArray(message.images) && message.images.length > 0) {
      imageUrl = message.images[0].image_url?.url;
    }

    // Fallback: check content for data URL
    if (!imageUrl && typeof message.content === 'string' && message.content.startsWith('data:image')) {
      imageUrl = message.content;
    }

    if (!imageUrl) {
      console.error('[Illustrator] No image found in response:', JSON.stringify(data, null, 2).slice(0, 1000));
      throw new Error('No image data in API response');
    }

    console.log(`[Illustrator] ✅ Page ${pageNumber} illustrated successfully via OpenRouter`);

    return NextResponse.json({
      pageNumber,
      image: imageUrl,
      success: true,
    });

  } catch (error: unknown) {
    console.error('[Illustrator] Error:', error);
    return NextResponse.json({
      pageNumber: pageNumber || 0,
      image: null,
      success: false,
      error: `Illustration failed: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
}


