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

interface ManuscriptPage {
  pageNumber: number;
  text: string;
  sceneDescription: string;
  theme: string;
  emotion: string;
  visualElements: string[];
}

interface Manuscript {
  title: string;
  pages: ManuscriptPage[];
  lesson: string;
  verses: string[];
}

interface VisualBlueprint {
  pageNumber: number;
  composition: string;
  characters: string;
  environment: string;
  lighting: string;
  efrainExpression: string;
  efrainPose: string;
  continuityNotes: string;
  fullPrompt: string;
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
// THE NARRATOR — Story text generation prompt
// ═══════════════════════════════════════════════════════════════

export function buildNarratorPrompt(seed: StorySeed): string {
  const ageKey = detectAgeGroup(seed.ageGroup);
  const gate = AGE_GATES[ageKey];
  const lang = seed.language === 'es' ? 'Español' : 'English';

  return `SYSTEM: You are "The Narrator" — an elite children's storybook author who weaves biblical wisdom into emotionally rich pastoral adventures starring a boy named Efraín.

═══ THE 7 GOLD RULES (YOU MUST FOLLOW ALL 7 — NEVER VIOLATE) ═══

RULE 1 — BIBLICAL ANCHOR:
The Hebrew word "${seed.word}" (${seed.hebrewText}) from ${seed.reference} is the spiritual DNA of this story.
Its meaning: "${seed.translation}"
EVERY conflict, resolution, and lesson MUST directly connect to this word's meaning.
Do NOT invent Bible verses. Only reference: ${seed.reference}.

RULE 2 — EMOTIONAL STAKES:
Something Efraín deeply cares about must be at risk. A friendship, an animal's safety, a promise, a relationship with family. The reader must FEEL the tension.

RULE 3 — SENSORY WRITING:
Each page MUST contain at least 2 sensory details from different senses:
- Sight: colors, light, movement
- Sound: wind, animal sounds, whispers, laughter
- Touch: textures, warmth, cold
- Smell: flowers, earth, bread, rain

RULE 4 — CHARACTER AGENCY:
Efraín MAKES CHOICES. He is NEVER passive. Use "Efraín decided to...", "Efraín chose...", "With courage, Efraín...".
NEVER: "Efraín was told to...", "Someone helped Efraín...", "Things got better on their own."

RULE 5 — THEMATIC ESCALATION:
Each page DEEPENS the theme. NEVER repeat the same message.
Page 1: encounters the concept → Page 3: LIVES it through action → Page 5: carries it forward.

RULE 6 — VISUAL ANCHORING:
Every page MUST name at least ONE specific, concrete, illustratable visual element:
✅ "sitting under the old olive tree" / "kneeling beside the wounded lamb" / "crossing the stone bridge"
❌ "thinking about things" / "feeling happy" / "learning a lesson"

RULE 7 — AGE-GATED LANGUAGE:
Target audience: ${gate.label}
- Sentence length: ${gate.sentenceLength}
- Vocabulary: ${gate.vocabulary}
- Abstractions: ${gate.abstractions}
- Emotional complexity: ${gate.emotionalComplexity}
- Page length: ${gate.pageLength}
- Story complexity: ${gate.storyComplexity}
- Tone: ${gate.tone}

═══ NARRATIVE ARC (MANDATORY 5-PAGE STRUCTURE) ═══

PAGE 1 — "THE SEED" (Setting + Discovery):
Efraín is in his pastoral world (green meadows, animals, his village). 
Introduce a SPECIFIC situation that naturally connects to "${seed.word}". 
End the page with a question, discovery, or unexpected event that hooks the reader.
EMOTION: curiosity, wonder.

PAGE 2 — "THE ROOT" (Rising Tension):
Tension rises. Efraín encounters a CHALLENGE that tests the value of "${seed.word}".
He struggles. He remembers something wise (a grandmother's saying, a verse, a memory).
Show his internal conflict — he knows what's right but it's not easy.
EMOTION: concern, reflection, inner struggle.

PAGE 3 — "THE BLOOM" (CLIMAX — Emotional Peak):
THIS IS THE MOST IMPORTANT PAGE. Efraín makes a BRAVE, SELFLESS choice that EMBODIES "${seed.word}".
Show the action in vivid, cinematic detail. This is the moment the reader's heart swells.
The choice must have a COST — it's not free. Efraín sacrifices something (comfort, pride, fear).
EMOTION: determination, courage, love.

PAGE 4 — "THE FRUIT" (Beautiful Consequences):
The beautiful RESULTS of Efraín's choice unfold. Joy, reconciliation, wonder, healing.
Other characters (animals, friends, family) are AFFECTED by what Efraín did.
Show the transformation — something that was broken is now whole.
EMOTION: joy, relief, warmth, gratitude.

PAGE 5 — "THE HARVEST" (Wisdom + Looking Forward):
Efraín reflects quietly. He looks toward the horizon/sunset/stars.
The lesson emerges NATURALLY from the moment — it is NOT stated as a lecture.
Efraín carries this wisdom into his future. End with hope and beauty.
EMOTION: peace, wisdom, gentle joy.

═══ CHARACTERS AVAILABLE ═══
- Efraín (protagonist, 9-year-old explorer boy)
- Animals: sheep/lamb, goat, horse, cow, donkey, collie dog, chickens, ducks
- Family: grandmother (wise storyteller), grandfather (guardian of traditions), mother (heart of the home), father (hardworking, brave), sister Susana (curious little girl), friend Samuel (best friend)
- Village: Najar (wise elder friend)

═══ OUTPUT FORMAT (STRICTLY JSON, language: ${lang}) ═══
{
  "title": "TÍTULO EN MAYÚSCULAS",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Full narrative text for this page...",
      "sceneDescription": "Brief scene summary for illustration reference",
      "theme": "One-word or short theme (e.g., Discovery, Courage)",
      "emotion": "Primary emotion of this page (curiosity, concern, determination, joy, peace)",
      "visualElements": ["old olive tree", "green meadow", "small white lamb"]
    }
  ],
  "lesson": "The spiritual lesson — warm, natural, not preachy",
  "verses": ["${seed.reference}"]
}

WRITE THE STORY NOW. Language: ${lang}. Age group: ${gate.label}.`;
}

// ═══════════════════════════════════════════════════════════════
// THE ART DIRECTOR — Visual blueprint generation prompt
// ═══════════════════════════════════════════════════════════════

export function buildArtDirectorPrompt(manuscript: Manuscript): string {
  const cameraProgression = [
    'wide establishing shot showing full environment and character in context',
    'medium shot focusing on Efraín and the key interaction, environment visible but soft',
    'medium close-up, emotional intensity, focus on Efraín\'s face and hands during the key action',
    'medium shot showing multiple characters interacting, warm inclusive framing',
    'wide panoramic shot, Efraín small against beautiful landscape, looking toward horizon',
  ];

  return `SYSTEM: You are "The Art Director" for an illustrated children's storybook series starring Efraín.
You receive a 5-page story manuscript and create PRECISE visual blueprints for an AI illustrator.

═══ CHARACTER REFERENCE (LOCKED — YOU CANNOT MODIFY THIS) ═══
${CHARACTER_DNA.efrain.identity}

═══ ART STYLE (LOCKED) ═══
${STYLE_ANCHOR}

═══ STORY MANUSCRIPT ═══
${JSON.stringify(manuscript.pages.map(p => ({
  page: p.pageNumber,
  text: p.text,
  scene: p.sceneDescription,
  emotion: p.emotion,
  visuals: p.visualElements,
})), null, 2)}

═══ YOUR TASK ═══
For each of the 5 pages, create a detailed image generation prompt.

MANDATORY RULES:
1. CHARACTER LOCK: Efraín ALWAYS wears his straw hat, leather vest, cream shirt, blue shorts, boots, and satchel. NEVER change his outfit.
2. CONTINUITY: If an animal (e.g., a white lamb) appears on page 1, it must be the SAME animal on later pages — same size, same color, same markings.
3. ENVIRONMENT FLOW: Settings evolve logically. If page 1 is under an olive tree, page 2 can be nearby but not in a desert.
4. EXPRESSION SYNC: Match Efraín's facial expression to the page's emotion.
5. CAMERA VARIETY: Use this progression:
   ${cameraProgression.map((c, i) => `   Page ${i + 1}: ${c}`).join('\n')}
6. LIGHTING FLOW: Progress lighting to suggest passage of time if applicable (morning → golden afternoon → sunset).
7. NO TEXT: Never include any text, letters, words, or numbers in the image.

═══ OUTPUT FORMAT (STRICTLY JSON) ═══
{
  "blueprints": [
    {
      "pageNumber": 1,
      "fullPrompt": "Complete, self-contained image generation prompt that includes: the exact scene, Efraín's appearance (locked), his expression, pose, other characters, environment details, lighting, camera angle, and art style. This must work as a STANDALONE prompt — the illustrator has no other context."
    },
    { "pageNumber": 2, "fullPrompt": "..." },
    { "pageNumber": 3, "fullPrompt": "..." },
    { "pageNumber": 4, "fullPrompt": "..." },
    { "pageNumber": 5, "fullPrompt": "..." }
  ]
}

IMPORTANT: Each "fullPrompt" must be a single, dense, descriptive paragraph of 80-120 words in ENGLISH.
Start each prompt with the scene, then Efraín's appearance, then other characters, then environment, then style.
End each prompt with: "${STYLE_ANCHOR.split('.').slice(0, 2).join('.')}"

Generate the 5 visual blueprints NOW.`;
}

// ═══════════════════════════════════════════════════════════════
// THE ILLUSTRATOR — Final image prompt assembly
// ═══════════════════════════════════════════════════════════════

export function buildIllustratorPrompt(blueprint: VisualBlueprint | { fullPrompt: string; pageNumber: number }): string {
  return `Generate a children's storybook illustration.

${NEGATIVE_PROMPT}

CHARACTER (LOCKED — THIS IS EXACTLY HOW EFRAÍN MUST LOOK):
${CHARACTER_DNA.efrain.identity}

SCENE TO ILLUSTRATE:
${'fullPrompt' in blueprint ? blueprint.fullPrompt : ''}

ART STYLE: ${STYLE_ANCHOR}

Remember: NO text, NO letters, NO words anywhere in the image. Landscape orientation. High quality detailed illustration.`;
}

// ═══════════════════════════════════════════════════════════════
// VALIDATOR — Structure checking
// ═══════════════════════════════════════════════════════════════

export function validateManuscript(parsed: any): Manuscript | null {
  if (!parsed || !parsed.title || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
    return null;
  }

  const pages: ManuscriptPage[] = parsed.pages.map((p: any, i: number) => ({
    pageNumber: p.pageNumber || i + 1,
    text: p.text || '',
    sceneDescription: p.sceneDescription || '',
    theme: p.theme || '',
    emotion: p.emotion || ['curiosity', 'concern', 'determination', 'joy', 'peace'][i] || 'joy',
    visualElements: Array.isArray(p.visualElements) ? p.visualElements : [],
  }));

  return {
    title: parsed.title,
    pages,
    lesson: parsed.lesson || '',
    verses: Array.isArray(parsed.verses) ? parsed.verses : [],
  };
}

export function validateBlueprints(parsed: any): { fullPrompt: string; pageNumber: number }[] | null {
  if (!parsed || !Array.isArray(parsed.blueprints) || parsed.blueprints.length === 0) {
    return null;
  }

  return parsed.blueprints.map((b: any, i: number) => ({
    pageNumber: b.pageNumber || i + 1,
    fullPrompt: b.fullPrompt || '',
  }));
}
