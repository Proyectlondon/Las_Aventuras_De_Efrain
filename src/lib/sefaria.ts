/**
 * Sefaria API Service
 * Handles fetching Hebrew biblical text with Niqqud.
 */

const SEFARIA_API_BASE = "https://www.sefaria.org/api";

export interface SefariaVerse {
  verse: number;
  he: string;
  en: string;
}

export interface SefariaResponse {
  ref: string;
  he: string | string[];
  text: string | string[];
  book: string;
}

/**
 * Fetch a specific biblical reference from Sefaria.
 * @param ref Example: "Genesis.1.1" or "Psalms.23"
 */
export async function getBiblicalText(ref: string): Promise<SefariaResponse> {
  const url = `${SEFARIA_API_BASE}/texts/${ref}?context=0&version=hebrew|Tanach with Nikkud`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Sefaria API error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Normalizes Sefaria response to handle single verses or full chapters
 */
export function formatVerses(data: SefariaResponse): SefariaVerse[] {
  const heArray = Array.isArray(data.he) ? data.he : [data.he];
  const enArray = Array.isArray(data.text) ? data.text : [data.text];

  return heArray.map((heText, index) => ({
    verse: index + 1,
    he: heText.replace(/<[^>]+>/g, ''), // Clean HTML tags
    en: (enArray[index] || "").replace(/<[^>]+>/g, '')
  }));
}

/**
 * Search for a word in Sefaria (Concordance style)
 * Note: Sefaria's search API is complex. 
 * For a first version, we might want to search in a local list of common Hebrew words
 * or use their /api/search/text endpoint.
 */
export async function searchWord(query: string) {
  // TODO: Implement actual text search logic
  // For now, let's mock a few common ones or use a simple search
  const url = `${SEFARIA_API_BASE}/search-text/${query}?type=text&field=text&source=Tanakh`;
  const response = await fetch(url);
  return await response.json();
}
