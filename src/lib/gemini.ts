export interface StoryParams {
  word: string;
  reference: string;
  hebrewText: string;
  translation: string;
  ageGroup: string;
  language: 'es' | 'en';
}

export async function generateStory(params: StoryParams) {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok) throw new Error('API connection failed');

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      title: "Aventura en curso",
      story: "Efraín está consultando con sus amigos... (Asegúrate de tener internet).",
      lesson: "La paciencia es un tesoro.",
      verses: [params.reference]
    };
  }
}
