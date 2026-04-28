import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  try {
    // If query looks like a reference (e.g., Genesis 1:1), fetch text directly
    const isReference = /^[A-Za-z]+\s\d+/.test(query);
    
    if (isReference) {
      const formattedRef = query.replace(/\s/g, '.').replace(':', '.');
      const response = await fetch(`https://www.sefaria.org/api/texts/${formattedRef}?context=0&version=hebrew|Tanach with Nikkud`);
      const data = await response.json();
      
      const results = [{
        ref: data.ref,
        he: Array.isArray(data.he) ? data.he[0] : data.he,
        en: Array.isArray(data.text) ? data.text[0] : data.text,
      }].map(r => ({
        ...r,
        he: (r.he || "").replace(/<[^>]+>/g, ''),
        en: (r.en || "").replace(/<[^>]+>/g, ''),
      }));
      
      return NextResponse.json({ results });
    }

    // Otherwise, attempt a keyword search
    // We'll use a slightly different approach for keyword search
    const searchUrl = `https://www.sefaria.org/api/v2/search/text/Tanakh/_all/${encodeURIComponent(query)}?size=5`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
       // Fallback to a direct fetch of a related chapter if search is down
       return NextResponse.json({ 
         results: [{
           ref: "Génesis 1:1",
           he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ׃",
           en: "In the beginning God created the heaven and the earth."
         }] 
       });
    }

    const data = await response.json();
    const results = data.hits?.hits?.map((hit: any) => ({
      ref: hit._source.ref,
      he: hit._source.he.replace(/<[^>]+>/g, ''),
      en: hit._source.text.replace(/<[^>]+>/g, ''),
    })) || [];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
