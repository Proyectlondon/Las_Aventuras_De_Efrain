// ═══════════════════════════════════════════════════════════════
// NARRATIVE ENGINE — Prompt builders for The Narrator & Art Director
// ═══════════════════════════════════════════════════════════════

import {
  CHARACTER_DNA,
  STYLE_ANCHOR,
  NEGATIVE_PROMPT,
  AGE_GATES,
  type AgeGroup,
} from './character-dna';

interface StorySeed {
  word: string;
  reference: string;
  hebrewText: string;
  translation: string;
  ageGroup: string;
  language: 'es' | 'en';
}

export interface ManuscriptPage {
  pageNumber: number;
  text: string;
  theme: string;
  emotion: string;
  imagePrompt: string;
}

export interface Manuscript {
  title: string;
  pages: ManuscriptPage[];
  lesson: string;
  verses: string[];
}

// ─── Detect the age group key from the label text ───
function detectAgeGroup(ageGroupLabel: string): AgeGroup {
  const lower = ageGroupLabel.toLowerCase();
  if (lower.includes('0-2') || lower.includes('temprana') || lower.includes('early') || lower.includes('toddler')) return 'toddler';
  if (lower.includes('3-5') || lower.includes('preescolar') || lower.includes('preschool')) return 'preschool';
  if (lower.includes('6-11') || lower.includes('intermedia') || lower.includes('middle')) return 'middle';
  return 'preschool'; // safe default
}

// ═══════════════════════════════════════════════════════════════
// SINGLE-PASS STORY & VISUAL GENERATION
// ═══════════════════════════════════════════════════════════════

export function buildSinglePassStoryPrompt(seed: StorySeed): string {
  const ageKey = detectAgeGroup(seed.ageGroup);
  const gate = AGE_GATES[ageKey];
  const lang = seed.language === 'es' ? 'Español' : 'English';

  const cameraProgression = [
    'wide establishing shot showing full environment and character in context',
    'medium shot focusing on Efraín and the key interaction, environment visible but soft',
    'medium close-up, emotional intensity, focus on Efraín\'s face and hands during the key action',
    'medium shot showing multiple characters interacting, warm inclusive framing',
    'wide panoramic shot, Efraín small against beautiful landscape, looking toward horizon',
  ];

  return `SYSTEM: You are a master storyteller AND an elite Art Director for a children's book starring a boy named Efraín.
You will write a 5-page story AND generate the visual blueprints (prompts) for the illustrator simultaneously.

═══ STORY RULES (THE NARRATOR) ═══
1. BIBLICAL ANCHOR: The Hebrew word "${seed.word}" (${seed.hebrewText}) from ${seed.reference} is the core theme. Meaning: "${seed.translation}". Do NOT invent verses. Only use ${seed.reference}.
2. EMOTIONAL STAKES: Efraín must face a challenge related to the word. 
3. SENSORY WRITING: Use sight, sound, touch, and smell.
4. CHARACTER AGENCY: Efraín MAKES CHOICES. He is never passive.
5. AGE-GATED LANGUAGE: Target audience: ${gate.label}. Vocabulary: ${gate.vocabulary}.
6. 5-PAGE ARC: 
   Page 1: Discovery. 
   Page 2: Rising Tension. 
   Page 3: Climax (the selfless choice). 
   Page 4: Beautiful Consequences. 
   Page 5: Wisdom & Reflection.

═══ VISUAL RULES (THE ART DIRECTOR) ═══
For EACH page, you must also write an "imagePrompt" in ENGLISH for the AI Illustrator.
CHARACTER LOCK: Efraín ALWAYS wears his straw hat, leather vest, cream shirt, blue shorts, boots, and satchel.
CAMERA PROGRESSION:
${cameraProgression.map((c, i) => `Page ${i + 1}: ${c}`).join('\n')}
STYLE: End each imagePrompt with: "${STYLE_ANCHOR.split('.').slice(0, 2).join('.')}"

═══ OUTPUT FORMAT (STRICTLY JSON) ═══
{
  "title": "STORY TITLE IN UPPERCASE",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Full narrative text for the page in ${lang}...",
      "theme": "Short theme",
      "emotion": "Primary emotion",
      "imagePrompt": "Complete, self-contained 80-word visual prompt in ENGLISH describing the scene, Efraín's exact appearance (locked), environment, and camera angle."
    }
  ],
  "lesson": "The spiritual lesson in ${lang}",
  "verses": ["${seed.reference}"]
}

WRITE THE STORY NOW. Language: ${lang}.`;
}

// ═══════════════════════════════════════════════════════════════
// THE ILLUSTRATOR — Final image prompt assembly
// ═══════════════════════════════════════════════════════════════

export function buildIllustratorPrompt(imagePrompt: string): string {
  return `Generate a children's storybook illustration.

${NEGATIVE_PROMPT}

CHARACTER (LOCKED — THIS IS EXACTLY HOW EFRAÍN MUST LOOK):
${CHARACTER_DNA.efrain.identity}

SCENE TO ILLUSTRATE:
${imagePrompt}

ART STYLE: ${STYLE_ANCHOR}

Remember: NO text, NO letters, NO words anywhere in the image. Landscape orientation. High quality detailed illustration.`;
}

// ═══════════════════════════════════════════════════════════════
// VALIDATOR — Structure checking
// ═══════════════════════════════════════════════════════════════

export function validateSinglePassStory(parsed: any): Manuscript | null {
  if (!parsed || !parsed.title || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
    return null;
  }

  const pages: ManuscriptPage[] = parsed.pages.map((p: any, i: number) => ({
    pageNumber: p.pageNumber || i + 1,
    text: p.text || '',
    theme: p.theme || '',
    emotion: p.emotion || ['curiosity', 'concern', 'determination', 'joy', 'peace'][i] || 'joy',
    imagePrompt: p.imagePrompt || '',
  }));

  return {
    title: parsed.title,
    pages,
    lesson: parsed.lesson || '',
    verses: Array.isArray(parsed.verses) ? parsed.verses : [],
  };
}
