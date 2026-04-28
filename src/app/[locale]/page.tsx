'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Search, BookOpen, Users, Bookmark, Languages, Sparkles, Loader2, X, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function IndexPage() {
  const t = useTranslations('Index');
  const c = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedAge, setSelectedAge] = useState('preschool');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [story, setStory] = useState<any>(null);

  const [analysis, setAnalysis] = useState<any>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setStory(null);
    setAnalysis(null);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data.results || []);

      // If we found results, let's analyze the word too
      if (data.results?.length > 0) {
        const analyzeRes = await fetch('/api/generate-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: query,
            reference: data.results[0].ref,
            hebrewText: data.results[0].he,
            translation: data.results[0].en,
            ageGroup: 'dictionary', // Special mode for dictionary
            language: locale
          })
        });
        const analyzeData = await analyzeRes.json();
        setAnalysis(analyzeData);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateStory = async (res: any) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: query,
          reference: res.ref,
          hebrewText: res.he,
          translation: res.en,
          ageGroup: c(`ageGroups.${selectedAge}`),
          language: locale
        })
      });
      const data = await response.json();
      setStory(data);
      // Scroll to story
      setTimeout(() => {
        document.getElementById('story-view')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Story generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveStory = async () => {
    if (!story) return;
    
    const { error } = await supabase.from('stories').insert([{
      title: story.title,
      content: story.story,
      word: query,
      reference: story.verses?.[0] || '',
      lesson: story.lesson,
      verses: story.verses,
      age_group: selectedAge,
      language: locale
    }]);

    if (error) {
      console.error('Error saving to Supabase:', error);
      alert('Error al guardar en la nube. ¿Creaste la tabla en Supabase?');
    } else {
      alert(c('saved'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 to-stone-50">
      {/* Header */}
      <header className="p-6 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10 border-b border-stone-200/50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-amber-600/20">
            E
          </div>
          <span className="font-bold text-stone-800 text-xl tracking-tight hidden sm:block">
            Efraín
          </span>
        </div>
        <nav className="flex items-center gap-4 md:gap-6">
          <Link href={`/${locale}/characters`} className="flex items-center gap-2 text-stone-600 hover:text-amber-700 transition-colors font-bold">
            <Users size={20} />
            <span className="hidden lg:inline">Personajes</span>
          </Link>
          <Link href={`/${locale}/library`} className="flex items-center gap-2 text-stone-600 hover:text-amber-700 transition-colors font-bold">
            <Bookmark size={20} />
            <span className="hidden lg:inline">Biblioteca</span>
          </Link>
          
          <div className="h-6 w-px bg-stone-200 hidden sm:block"></div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold border border-amber-200 shadow-sm">
                {user.email?.[0].toUpperCase()}
              </div>
              <button 
                onClick={handleSignOut}
                className="hidden sm:block text-stone-500 hover:text-red-600 font-bold text-sm transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <Link 
              href={`/${locale}/auth`}
              className="px-6 py-2 bg-stone-900 text-white rounded-full font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/10 active:scale-95"
            >
              Entrar
            </Link>
          )}

          <button className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-stone-600 font-bold hover:shadow-sm transition-all flex items-center gap-2">
            <Languages size={18} />
            <span className="hidden sm:inline">{locale.toUpperCase()}</span>
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-stone-900 mb-6 tracking-tight">
            {t('title')}
          </h1>
          <p className="text-xl text-stone-600 mb-12 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-amber-600 transition-colors">
              <Search size={24} />
            </div>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-14 pr-36 py-5 bg-white border-2 border-stone-200 rounded-2xl shadow-xl shadow-stone-200/40 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none text-xl transition-all text-stone-900"
            />
            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute right-3 top-2 bottom-2 px-6 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? <Loader2 className="animate-spin" /> : t('searchButton')}
            </button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
             {Object.keys(c.raw('ageGroups')).map((key) => (
               <button 
                 key={key} 
                 onClick={() => setSelectedAge(key)}
                 className={`px-6 py-3 rounded-full transition-all border font-semibold ${
                   selectedAge === key 
                   ? 'bg-amber-600 text-white border-amber-600 shadow-md scale-105' 
                   : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                 }`}
               >
                 {c(`ageGroups.${key}`)}
               </button>
             ))}
          </div>
        </motion.div>

        {/* Results & Story Area */}
        <AnimatePresence mode="wait">
          {analysis && !story && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-3xl p-8 mb-8 text-white shadow-2xl shadow-amber-700/20 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12 transition-transform group-hover:rotate-0">
                <Sparkles size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <BookOpen size={24} />
                  </div>
                  <span className="font-bold tracking-widest uppercase text-sm opacity-80">Diccionario de Tesoros</span>
                </div>
                <h2 className="text-4xl font-bold mb-4">{analysis.title}</h2>
                <p className="text-xl opacity-90 leading-relaxed mb-6 max-w-3xl">
                  {analysis.story}
                </p>
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 rounded-xl border border-white/20">
                   <Heart size={20} fill="currentColor" className="text-rose-300" />
                   <span className="font-medium italic">{analysis.lesson}</span>
                </div>
              </div>
            </motion.div>
          )}

          {isGenerating && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex flex-col items-center justify-center py-20 gap-6"
            >
              <div className="relative w-32 h-32 rounded-full bg-amber-100 border-4 border-white shadow-xl overflow-hidden">
                 <Image src="/characters/efrain_final.png" alt="Efraín" fill className="object-cover animate-pulse" />
              </div>
              <p className="text-xl font-bold text-stone-800 animate-pulse">{c('loading')}</p>
            </motion.div>
          )}

          {story && !isGenerating && (
            <motion.div 
              id="story-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[3rem] border border-stone-200 shadow-2xl overflow-hidden mb-12 relative"
            >
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center border-b border-amber-100 relative">
                <div className="w-32 h-32 md:w-40 md:h-40 relative flex-shrink-0">
                  <div className="absolute inset-0 bg-white rounded-full shadow-lg border-4 border-amber-200"></div>
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <Image src="/characters/efrain_final.png" alt="Efraín" fill className="object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-2 rounded-full shadow-lg">
                    <Sparkles size={24} />
                  </div>
                </div>
                <div className="text-center md:text-left flex-1">
                  <h2 className="text-4xl md:text-5xl font-black text-stone-900 mb-2 leading-tight">{story.title}</h2>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-amber-700 font-bold tracking-widest uppercase text-sm">
                    <BookOpen size={18} />
                    <span>Aventura de Efraín</span>
                  </div>
                </div>
                <button 
                  onClick={() => setStory(null)} 
                  className="absolute top-8 right-8 p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X className="text-stone-400" />
                </button>
              </div>
              <div className="p-8 md:p-16 prose prose-stone max-w-none">
                <p className="text-2xl text-stone-700 leading-relaxed first-letter:text-6xl first-letter:font-black first-letter:text-amber-600 first-letter:mr-4 first-letter:float-left whitespace-pre-wrap">
                  {story.story}
                </p>
                
                <div className="mt-16 p-8 bg-amber-50/50 rounded-[2.5rem] border border-amber-100 flex items-start gap-6 shadow-inner">
                  <div className="p-4 bg-white rounded-2xl text-amber-600 shadow-sm">
                    <Heart size={32} fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-stone-800 mb-2 uppercase tracking-wide">Lección para el corazón</h3>
                    <p className="text-xl text-stone-600 leading-relaxed italic">"{story.lesson}"</p>
                  </div>
                </div>

                <div className="mt-16 flex flex-col sm:flex-row justify-between items-center gap-8 border-t border-stone-100 pt-12">
                  <div className="flex flex-wrap justify-center gap-4">
                    {story.verses?.map((v: string, i: number) => (
                      <span key={i} className="px-5 py-2 bg-sky-100 text-sky-800 rounded-xl font-bold text-sm shadow-sm">
                        {v}
                      </span>
                    ))}
                  </div>
                  <button 
                    onClick={handleSaveStory}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-amber-600 text-white font-black rounded-2xl hover:bg-amber-700 transition-all shadow-xl shadow-amber-600/30 hover:-translate-y-1 active:translate-y-0"
                  >
                    <Bookmark size={24} />
                    {c('save')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {results.length > 0 && !story && !isGenerating && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid gap-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-2xl font-bold text-stone-800">Resultados encontrados</h2>
                <div className="h-px flex-1 bg-stone-200"></div>
              </div>
              
              {results.map((res, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ scale: 1.01 }}
                  className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="text-amber-600" size={32} />
                  </div>
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1">
                      <span className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-2 block">
                        {res.ref}
                      </span>
                      <p className="text-3xl font-hebrew text-stone-900 leading-relaxed text-right mb-6" dir="rtl">
                        {res.he}
                      </p>
                      <p className="text-lg text-stone-600 leading-relaxed italic">
                        "{res.en}"
                      </p>
                    </div>
                    <button 
                      onClick={() => handleGenerateStory(res)}
                      className="w-full md:w-auto px-8 py-6 bg-stone-900 text-white font-bold rounded-2xl hover:bg-amber-600 transition-colors flex items-center justify-center gap-3 self-center shadow-xl shadow-stone-900/10 active:scale-95 transition-all"
                    >
                      <Sparkles size={20} />
                      Crear Cuento con Efraín
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="h-24 bg-stone-100 border-t border-stone-200 flex items-center justify-center gap-12 px-6 overflow-hidden">
        <div className="flex items-center gap-3 text-stone-400 grayscale opacity-50">
          <BookOpen size={24} />
          <span className="font-bold uppercase tracking-widest text-xs">Fidelidad Bíblica</span>
        </div>
        <div className="flex items-center gap-3 text-stone-400 grayscale opacity-50">
          <Users size={24} />
          <span className="font-bold uppercase tracking-widest text-xs">Aventuras con Efraín</span>
        </div>
      </footer>
    </div>
  );
}
