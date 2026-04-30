require('dotenv').config({ path: '.env.local' });

async function test() {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-image',
      messages: [{ role: 'user', content: 'Draw a cute baby lamb in a meadow. No text.' }],
      modalities: ['image', 'text'],
    }),
  });
  
  const data = await res.json();
  const msg = data.choices?.[0]?.message || {};
  
  console.log('Status:', res.status);
  console.log('Message keys:', Object.keys(msg));
  
  // Check all possible image locations
  if (msg.images) {
    console.log('images field - length:', msg.images.length);
    console.log('images[0] type:', typeof msg.images[0]);
    if (typeof msg.images[0] === 'string') {
      console.log('images[0] starts:', msg.images[0].slice(0, 80));
    } else if (typeof msg.images[0] === 'object') {
      console.log('images[0] keys:', Object.keys(msg.images[0]));
      // Try common keys
      for (const k of Object.keys(msg.images[0])) {
        const v = msg.images[0][k];
        console.log(`  ${k}:`, typeof v === 'string' ? v.slice(0, 80) : v);
      }
    }
  }
  
  if (Array.isArray(msg.content)) {
    msg.content.forEach((c, i) => {
      console.log(`content[${i}]:`, c.type, typeof c);
      if (c.image_url) console.log('  image_url:', JSON.stringify(c.image_url).slice(0, 100));
    });
  } else if (typeof msg.content === 'string') {
    console.log('content (string):', msg.content.slice(0, 100));
  }
  
  if (msg.parts) {
    msg.parts.forEach((p, i) => {
      console.log(`parts[${i}]:`, Object.keys(p));
    });
  }
  
  // Log raw response structure
  console.log('\nRAW (truncated):', JSON.stringify(data).slice(0, 500));
}

test().catch(console.error);
