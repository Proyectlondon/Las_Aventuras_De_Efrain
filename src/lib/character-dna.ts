// ═══════════════════════════════════════════════════════════════
// CHARACTER DNA — The immutable identity of Efraín
// Derived from: /public/modelsheets/efrain/EFRAIN_001_MODELSHEET.png
// ═══════════════════════════════════════════════════════════════

/**
 * CHARACTER_DNA is the frozen, ultra-specific character descriptor
 * injected into EVERY image generation call. It is NEVER modified by the LLM.
 * Derived forensically from the official modelsheet turnaround.
 */
export const CHARACTER_DNA = {
  efrain: {
    // The master identity string — injected verbatim into every image prompt
    identity: [
      'A 9-year-old Latin American boy named Efraín.',
      'FACE: Round childlike face, large expressive dark brown eyes with visible highlights, small nose with subtle freckles on cheeks, wide cheerful smile showing teeth when happy, short messy dark brown hair with side-swept bangs peeking under his hat.',
      'HAT: Wide-brimmed brown woven STRAW hat with a simple dark band — NOT a leather fedora, NOT a cowboy hat, NOT a cap. It is a rustic handwoven straw explorer hat.',
      'SHIRT: Cream/off-white collared button-up shirt with rolled-up sleeves, slightly loose fit.',
      'VEST: Brown leather multi-pocket explorer vest with brass/bronze buckle closures, worn open over the shirt.',
      'SATCHEL: Brown leather cross-body satchel/bandolera with a single brass buckle clasp, worn diagonally across chest from left shoulder to right hip.',
      'PANTS: Blue denim knee-length shorts with rolled cuffs just above the knee.',
      'BOOTS: Brown leather lace-up ankle boots with thick tan soles.',
      'BACKPACK: Large brown leather backpack with a rolled blue sleeping bag/blanket strapped on top with leather straps.',
      'BUILD: Slim but sturdy build, average height for a 9-year-old boy. Anime/manga proportions — slightly larger head and eyes relative to body, typical of children\'s illustration style.',
    ].join('\n'),

    // Emotional expression descriptors for facial direction
    expressions: {
      joy: 'wide open-mouth smile showing teeth, sparkling eyes with visible highlights, slightly raised eyebrows, cheeks lifted',
      curiosity: 'one eyebrow raised higher than the other, mouth slightly open in wonder, head tilted slightly, leaning forward',
      concern: 'eyebrows furrowed and angled upward in center, slight frown, hands clasped together or touching chin',
      determination: 'firm set jaw, focused intense eyes, fists clenched at sides or hands on hips, confident stance',
      peace: 'gentle closed-mouth smile, relaxed shoulders, eyes softly half-closed looking at horizon, serene posture',
      sorrow: 'downcast eyes looking at ground, slight pout on lower lip, shoulders dropped, arms hanging loosely',
      surprise: 'eyes wide open, mouth in small O shape, eyebrows raised high, body leaning back slightly',
      tenderness: 'soft warm smile, gentle eyes, hands extended or cradling something carefully, slight head tilt',
    } as Record<string, string>,

    // Color palette extracted from modelsheet costume details panel
    palette: {
      hat: '#8B6914',        // dark golden brown
      hatHighlight: '#D4A853', // warm gold
      shirt: '#F5E6C8',     // cream/off-white  
      vest: '#8B4513',       // saddle brown
      satchel: '#6B3A1F',    // dark leather brown
      pants: '#4A7FB5',      // denim blue
      boots: '#654321',      // dark brown
      skin: '#D4A574',       // warm tan
      hair: '#3D2B1F',       // deep dark brown
      backpack: '#8B6914',   // matching hat
      sleepingBag: '#6B8EB5', // muted blue
    },
  },
} as const;

/**
 * STYLE_ANCHOR — The immutable art style directive.
 * Ensures all 5 pages of a story share the same rendering aesthetic.
 */
export const STYLE_ANCHOR = [
  'Warm pastoral anime illustration style, inspired by Studio Ghibli and premium children\'s storybook art.',
  'Soft diffused natural lighting with golden hour warmth and gentle shadows.',
  'Rich but not neon colors — saturated earth tones, warm golds, sage greens, soft blues.',
  'Lush green meadows with wildflowers, rolling hills, ancient olive trees, pastoral countryside.',
  'Wholesome, emotionally rich, family-friendly atmosphere.',
  'Detailed painted backgrounds with atmospheric depth and perspective.',
  'Character proportions consistent with anime/manga style for children\'s media.',
  'Soft rounded edges on all elements, no harsh angular shapes.',
  'Visible brushwork texture suggesting hand-painted quality.',
].join(' ');

/**
 * NEGATIVE_PROMPT — Things to explicitly exclude from every image.
 */
export const NEGATIVE_PROMPT = [
  'Do NOT include any of the following in the image:',
  'text, letters, words, numbers, watermarks, logos, signatures, UI elements, frames, borders,',
  'realistic photographic style, 3D render style, dark/horror themes, violence, blood,',
  'modern technology (phones, computers, cars), modern clothing, urban/city environments (unless story specifies),',
  'weapons, inappropriate content, scary monsters, skulls.',
  'Do NOT change Efraín\'s outfit or physical appearance from the reference description.',
].join(' ');

/**
 * AGE_GATES — Language rules matched to each developmental stage.
 * Injected into The Narrator's prompt to calibrate prose complexity.
 */
export const AGE_GATES = {
  toddler: {
    label: 'Early Childhood (0-2 years)',
    sentenceLength: '5-10 words maximum per sentence',
    vocabulary: 'Basic concrete nouns and simple verbs only. No abstract concepts.',
    abstractions: 'None — show actions, don\'t describe feelings with complex words.',
    emotionalComplexity: 'Simple emotions only: happy, sad, scared, brave, kind.',
    pageLength: '2-3 very short sentences per page',
    storyComplexity: 'Single simple problem with a single clear solution. Repetitive rhythmic structure.',
    tone: 'Warm, musical, repetitive like a lullaby. Use onomatopoeia and rhythm.',
  },
  preschool: {
    label: 'Preschool (3-5 years)',
    sentenceLength: '10-18 words per sentence',
    vocabulary: 'Expanding vocabulary with descriptive adjectives and adverbs. Name colors, animals, feelings.',
    abstractions: 'Simple similes allowed ("brave like a lion", "soft like a cloud").',
    emotionalComplexity: 'Empathy, sharing, forgiveness, friendship, gratitude.',
    pageLength: '3-4 sentences per page',
    storyComplexity: 'One clear problem with one twist before resolution. Characters learn through action.',
    tone: 'Engaging, slightly playful, warm and encouraging. Like a loving teacher.',
  },
  middle: {
    label: 'Middle Childhood (6-11 years)',
    sentenceLength: '15-25 words, compound sentences allowed',
    vocabulary: 'Rich descriptive language. Biblical terms explained naturally in context. Poetic imagery.',
    abstractions: 'Metaphors, proverbs, deeper spiritual parallels, cause-and-effect reasoning.',
    emotionalComplexity: 'Moral dilemmas, inner conflict, empathy for others\' perspectives, growth through struggle.',
    pageLength: '4-6 rich sentences per page',
    storyComplexity: 'Layered problem with meaningful sacrifice or difficult choice. Multiple character perspectives.',
    tone: 'Rich narrative voice, like a wise storyteller by the fire. Profound yet accessible.',
  },
} as const;

export type AgeGroup = keyof typeof AGE_GATES;

/**
 * Maps a narrative emotion beat to the corresponding facial expression key.
 */
export function getExpressionForBeat(pageNumber: number, narrativeEmotion?: string): string {
  // Default progression if no specific emotion is provided
  const defaultProgression: Record<number, string> = {
    1: 'curiosity',   // Setting — discovering something
    2: 'concern',     // Rising tension — facing a challenge
    3: 'determination', // Climax — making a brave choice
    4: 'joy',         // Resolution — seeing the beautiful result
    5: 'peace',       // Wisdom — reflecting on the lesson
  };

  if (narrativeEmotion && CHARACTER_DNA.efrain.expressions[narrativeEmotion]) {
    return CHARACTER_DNA.efrain.expressions[narrativeEmotion];
  }

  const key = defaultProgression[pageNumber] || 'joy';
  return CHARACTER_DNA.efrain.expressions[key];
}

/**
 * Path to the reference portrait image for multimodal API calls.
 * This is the clean character portrait, not the full turnaround sheet.
 */
export const REFERENCE_IMAGE_PATH = 'public/characters/efrain_final.png';
