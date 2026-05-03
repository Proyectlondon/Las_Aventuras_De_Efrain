const query = "shabat";
const prompt = `
  Act as an expert in the Hebrew Bible. The user searched for the following word or concept in Spanish: "${query}".
  Find exactly 3 relevant biblical verses from the Tanakh (Hebrew Bible) that relate to this concept.
  
  Return a JSON object with a single "results" array. Each item in the array MUST have:
  - "ref": The biblical reference in Spanish (e.g., "Génesis 1:1").
  - "he": The exact original Hebrew text of the verse (with nikkud).
  - "en": The translation of the verse in SPANISH (do not use English).
  
  Output ONLY valid JSON.
`;

async function testOllama() {
  try {
    const response = await fetch('http://localhost:11434/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.1:8b',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });
    
    if (!response.ok) {
      console.log("Error status:", response.status);
      return;
    }
    
    const data = await response.json();
    console.log("Raw output:", data.choices[0].message.content);
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

testOllama();
