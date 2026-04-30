// Script to generate remaining character portraits using OpenRouter/Gemini
// Run with: node scratch/generate_portraits.js
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.OPENROUTER_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'characters', 'portraits');

const STYLE = 'Studio Ghibli-inspired anime character portrait illustration, warm pastoral children\'s storybook art style, soft golden hour lighting, rich colors, detailed background, wholesome family-friendly atmosphere. No text, no letters, no words in the image.';

const characters = [
  {
    name: 'mama',
    prompt: `${STYLE} Portrait of a loving Latin American mother. She has long dark brown hair loosely tied back, warm brown eyes, a gentle nurturing smile, wearing a simple burgundy dress with a white apron and a small cross necklace. She is holding a freshly baked loaf of bread. Cozy home interior background with warm window light.`
  },
  {
    name: 'papa', 
    prompt: `${STYLE} Portrait of a strong, hardworking Latin American father. He has short dark hair, a kind strong face with light stubble, wearing a simple tan work shirt with rolled sleeves, brown leather belt, and brown work pants. He is carrying a farming hoe over his shoulder with a proud, gentle smile. Green farmland and golden wheat fields in the background.`
  },
  {
    name: 'najar',
    prompt: `${STYLE} Portrait of Najar, a wise old village elder with deep wisdom. He has a long flowing white beard, deep wise eyes with crow's feet wrinkles, wearing a long brown monk-like robe with a rope belt, holding a wooden walking staff with carved symbols. He has a kind, knowing smile. Ancient stone village with olive trees in the background.`
  },
  {
    name: 'oveja',
    prompt: `${STYLE} Portrait of a cute, fluffy baby white lamb (sheep) standing in a green meadow full of wildflowers and daisies. The lamb has big innocent dark eyes, soft white wool, a pink nose, and tiny hooves. It looks gentle and sweet. Rolling green hills and a blue sky with fluffy clouds in the background.`
  },
  {
    name: 'toro',
    prompt: `${STYLE} Portrait of a strong, noble brown bull standing proudly in a pastoral farm field. The bull has a muscular build, large brown eyes with a calm wise expression, short curved horns, and a shiny brown coat. Green pasture with a wooden fence and rolling hills behind. Warm afternoon lighting.`
  },
  {
    name: 'asno',
    prompt: `${STYLE} Portrait of a friendly, gentle gray donkey in a pastoral setting. The donkey has long fuzzy ears, a soft gray coat with a lighter belly, big kind dark eyes, and a content expression. It's standing on a dirt path with wildflowers, with ancient stone walls and olive trees in the background.`
  },
  {
    name: 'caballo',
    prompt: `${STYLE} Portrait of a beautiful, noble chestnut-brown horse with a flowing dark mane. The horse has large expressive dark eyes, a proud but gentle posture, and a shiny reddish-brown coat. It's standing in a green meadow at golden hour, with rolling hills and a sunset sky behind. Majestic yet approachable.`
  },
  {
    name: 'vaca',
    prompt: `${STYLE} Portrait of a gentle, peaceful brown and white dairy cow in a lush green pasture. The cow has big calm brown eyes, a spotted brown and white coat, and a serene, contented expression. She's chewing grass peacefully. Rolling green meadows with wildflowers and a blue sky behind.`
  },
  {
    name: 'chivo',
    prompt: `${STYLE} Portrait of a playful, energetic young goat (kid) in a pastoral countryside. The goat has white and tan fur, small curved horns, bright mischievous eyes, and a cheerful expression. It's mid-jump on a grassy hillside with wildflowers and rocks, looking playful and happy.`
  },
  {
    name: 'collie',
    prompt: `${STYLE} Portrait of a loyal, intelligent border collie dog with a flowing sable and white coat. The collie has bright alert brown eyes, a long flowing mane of fur, and an eager, loyal expression with tongue slightly out. It's sitting alertly in a green meadow, ready to help. Pastoral farm background.`
  },
  {
    name: 'galli_pato',
    prompt: `${STYLE} Portrait of a colorful rooster and a white duck standing together on a farm. The rooster has a bright red comb, iridescent green and gold tail feathers, proud posture. The duck is fluffy white with an orange bill and a friendly waddle. Morning barnyard with golden sunlight, hay bales and a wooden coop behind.`
  },
  {
    name: 'nina',
    prompt: `${STYLE} Portrait of a sweet Latin American village girl, about 8 years old. She has dark hair with a small flower tucked behind her ear, bright curious eyes, rosy cheeks, wearing a simple blue dress with embroidered flowers. She's holding a small clay pot. Village stone street background with colorful market stalls.`
  },
  {
    name: 'tejedora',
    prompt: `${STYLE} Portrait of a talented Latin American weaver woman, middle-aged with kind eyes. She has dark hair with some gray streaks tied in a bun, wearing a colorful woven shawl over a cream blouse. She's working at a wooden loom with beautiful colorful fabric. Workshop interior with hanging textiles. Warm, cozy lighting.`
  },
  {
    name: 'vendedor',
    prompt: `${STYLE} Portrait of a friendly Latin American market vendor, a middle-aged man with a warm smile and a mustache. He wears a simple white shirt and brown vest, with a straw hat. He's standing behind a market stall full of colorful fruits, spices, and bread. Bustling ancient market square background.`
  },
  {
    name: 'ciervo',
    prompt: `${STYLE} Portrait of a graceful, majestic deer (stag) standing in a forest clearing at dawn. The deer has large antlers, a reddish-brown coat with white spots, and deep soulful dark eyes. Morning mist and golden light filtering through ancient olive and oak trees. Peaceful, spiritual atmosphere.`
  },
  {
    name: 'cerdo',
    prompt: `${STYLE} Portrait of a cheerful, round pink pig in a pastoral farmyard. The pig has a curly tail, floppy ears, a round snout, and small happy dark eyes. It's standing on straw-covered ground near a wooden fence. Green countryside behind with a red barn. Warm, friendly, cute.`
  },
  {
    name: 'ternero',
    prompt: `${STYLE} Portrait of an adorable young calf (baby cow) in a green meadow. The calf has big innocent brown eyes, a soft brown and white spotted coat, wobbly legs, and a curious, sweet expression. It's standing among daisies and buttercups. Soft golden morning light, rolling hills behind.`
  }
];

async function generateImage(char) {
  console.log(`🎨 Generating: ${char.name}...`);
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://efrain-app.vercel.app',
        'X-Title': 'Efrain Character Portraits',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [{ role: 'user', content: char.prompt }],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`  ❌ API error for ${char.name}: ${response.status}`, errBody.slice(0, 300));
      return false;
    }

    const data = await response.json();
    
    // Extract image from response
    let imageBase64 = null;
    
    const parts = data.choices?.[0]?.message?.parts;
    if (parts && Array.isArray(parts)) {
      for (const part of parts) {
        if (part.inline_data?.mime_type?.startsWith('image/')) {
          imageBase64 = part.inline_data.data;
          break;
        }
      }
    }
    
    const content = data.choices?.[0]?.message?.content;
    if (!imageBase64 && Array.isArray(content)) {
      for (const item of content) {
        if (item.type === 'image_url' && item.image_url?.url) {
          const url = item.image_url.url;
          imageBase64 = url.replace(/^data:image\/\w+;base64,/, '');
          break;
        }
      }
    }

    if (!imageBase64) {
      console.error(`  ❌ No image in response for ${char.name}`);
      return false;
    }

    const outPath = path.join(OUTPUT_DIR, `${char.name}.png`);
    fs.writeFileSync(outPath, Buffer.from(imageBase64, 'base64'));
    console.log(`  ✅ Saved: ${outPath}`);
    return true;
  } catch (err) {
    console.error(`  ❌ Error for ${char.name}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('═══ Generating Character Portraits ═══\n');
  
  // Check which portraits already exist
  const existing = fs.readdirSync(OUTPUT_DIR).map(f => f.replace('.png', ''));
  const toGenerate = characters.filter(c => !existing.includes(c.name));
  
  console.log(`Already generated: ${existing.join(', ')}`);
  console.log(`Need to generate: ${toGenerate.map(c => c.name).join(', ')}\n`);

  let success = 0;
  for (const char of toGenerate) {
    const ok = await generateImage(char);
    if (ok) success++;
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`\n═══ Done: ${success}/${toGenerate.length} generated ═══`);
}

main();
