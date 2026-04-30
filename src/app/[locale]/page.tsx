'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Search, BookOpen, Users, Bookmark, Languages, Sparkles, Loader2, X, Heart, BookHeart, LogOut, MapPin, Palette, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface StoryPage {
  pageNumber: number;
  text: string;
  sceneDescription: string;
  theme: string;
  imagePrompt: string;
  image?: string | null;
}

interface IllustratedStory {
  title: string;
  pages: StoryPage[];
  lesson: string;
  verses: string[];
}

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
  const [generationStep, setGenerationStep] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [story, setStory] = useState<IllustratedStory | null>(null);

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
        const analyzeRes = await fetch('/api/generate', {
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

  const generateImageForPage = useCallback(async (imagePrompt: string, pageNumber: number): Promise<string | null> => {
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePrompt, pageNumber })
      });
      const data = await response.json();
      if (data.success && data.image) {
        return data.image;
      }
      return null;
    } catch (error) {
      console.error(`Failed to generate image for page ${pageNumber}:`, error);
      return null;
    }
  }, []);

  const handleGenerateStory = async (res: any) => {
    setIsGenerating(true);
    setGenerationStep(locale === 'es' ? '✍️ Escribiendo la historia...' : '✍️ Writing the story...');
    setGenerationProgress(10);
    
    try {
      // Step 1: Generate the story text
      const response = await fetch('/api/generate', {
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
      
      if (!data.pages || data.pages.length === 0) {
        // Fallback: old format story
        setStory({
          title: data.title || 'Aventura',
          pages: [{
            pageNumber: 1,
            text: data.story || 'No se pudo generar el cuento.',
            sceneDescription: '',
            theme: '',
            imagePrompt: '',
            image: null
          }],
          lesson: data.lesson || '',
          verses: data.verses || []
        });
        setIsGenerating(false);
        return;
      }

      // Initialize story with pages but no images yet
      const initialStory: IllustratedStory = {
        title: data.title,
        pages: data.pages.map((p: StoryPage) => ({ ...p, image: null })),
        lesson: data.lesson,
        verses: data.verses
      };
      setStory(initialStory);
      setGenerationProgress(25);

      // Step 2: Generate images sequentially
      const totalPages = data.pages.length;
      for (let i = 0; i < totalPages; i++) {
        const page = data.pages[i];
        const stepLabel = locale === 'es' 
          ? `🎨 Ilustrando página ${i + 1} de ${totalPages}...`
          : `🎨 Illustrating page ${i + 1} of ${totalPages}...`;
        setGenerationStep(stepLabel);
        setGenerationProgress(25 + ((i + 1) / totalPages) * 70);

        const imageBase64 = await generateImageForPage(page.imagePrompt, page.pageNumber);
        
        // Update the story with the new image progressively
        setStory(prev => {
          if (!prev) return prev;
          const updatedPages = [...prev.pages];
          updatedPages[i] = { ...updatedPages[i], image: imageBase64 };
          return { ...prev, pages: updatedPages };
        });
      }

      setGenerationProgress(100);
      setGenerationStep(locale === 'es' ? '✅ ¡Cuento listo!' : '✅ Story ready!');
      
      // Scroll to story
      setTimeout(() => {
        document.getElementById('story-view')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);

    } catch (error) {
      console.error('Story generation failed:', error);
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationStep('');
        setGenerationProgress(0);
      }, 1000);
    }
  };

  const handleSaveStory = async () => {
    if (!story) return;
    
    const { error } = await supabase.from('stories').insert([{
      title: story.title,
      content: story.pages.map(p => p.text).join('\n\n'),
      word: query,
      reference: story.verses?.[0] || '',
      lesson: story.lesson,
      verses: story.verses,
      age_group: selectedAge,
      language: locale,
      pages: story.pages.map(p => ({
        pageNumber: p.pageNumber,
        text: p.text,
        sceneDescription: p.sceneDescription,
        theme: p.theme,
        image: p.image
      }))
    }]);

    if (error) {
      console.error('Error saving to Supabase:', error);
      alert('Error al guardar en la nube.');
    } else {
      alert(c('saved'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-pastoral-pattern">
      {/* ─── NAVBAR ─── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={`/${locale}`} className="flex items-center gap-2 group">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#C8953D] to-[#C17B5B] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <BookHeart className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-[#6B4F3A] hidden sm:block">
                Efraín
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link href={`/${locale}/characters`} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-all">
                <Users size={16} /> Personajes
              </Link>
              <Link href={`/${locale}/scenes`} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-all">
                <MapPin size={16} /> Escenarios
              </Link>
              <Link href={`/${locale}/library`} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-all">
                <Bookmark size={16} /> Biblioteca
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => router.push(`/${locale === 'es' ? 'en' : 'es'}`)}
                className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-stone-600 font-bold hover:shadow-sm transition-all flex items-center gap-2"
              >
                <Languages size={18} />
                <span className="hidden sm:inline">{locale.toUpperCase()}</span>
              </button>
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7D8B69] to-[#C8953D] flex items-center justify-center text-white font-bold shadow-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <button onClick={handleSignOut} className="text-sm font-bold text-stone-500 hover:text-red-500 flex items-center gap-1">
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Salir</span>
                  </button>
                </div>
              ) : (
                <Link href={`/${locale}/auth`} className="text-sm font-bold bg-[#C8953D] text-white px-4 py-2 rounded-xl hover:bg-[#A67C52] transition-colors shadow-sm">
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </div>
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
             {Object.keys(c.raw('ageGroups')).map((key) => {
               // Map keys to specific colors based on beta app styles
               let bgActive = 'bg-[#C8953D] text-white';
               
               if (key === 'toddler') {
                 bgActive = 'bg-gradient-to-r from-amber-300 to-orange-300 text-amber-900 border-amber-300';
               } else if (key === 'preschool') {
                 bgActive = 'bg-gradient-to-r from-[#7D8B69] to-green-400 text-white border-[#7D8B69]';
               } else if (key === 'middle') {
                 bgActive = 'bg-gradient-to-r from-[#C17B5B] to-rose-400 text-white border-[#C17B5B]';
               }

               return (
                 <button 
                   key={key} 
                   onClick={() => setSelectedAge(key)}
                   className={`px-6 py-3 rounded-2xl transition-all border-2 font-bold flex items-center gap-2 ${
                     selectedAge === key 
                     ? `${bgActive} shadow-md scale-105` 
                     : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                   }`}
                 >
                   {c(`ageGroups.${key}`)}
                 </button>
               );
             })}
          </div>
        </motion.div>

        {/* Results & Story Area */}
        <AnimatePresence mode="wait">
          {analysis && !story && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-warm-gradient border-2 border-[#E8D5BC] rounded-3xl p-8 mb-8 text-[#3D2B1F] shadow-xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 text-[#C8953D] rotate-12 transition-transform group-hover:rotate-0">
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

          {/* ─── GENERATION PROGRESS ─── */}
          {isGenerating && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex flex-col items-center justify-center py-16 gap-6"
            >
              <div className="relative w-36 h-36 rounded-full bg-amber-100 border-4 border-white shadow-xl overflow-hidden">
                 <Image src="/characters/efrain_final.png" alt="Efraín" fill className="object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 to-transparent" />
                 <div className="absolute bottom-2 right-2 bg-white rounded-full p-1.5 shadow-lg">
                   <Palette size={18} className="text-amber-600 animate-pulse" />
                 </div>
              </div>
              <p className="text-xl font-bold text-stone-800">{generationStep}</p>
              
              {/* Progress bar */}
              <div className="w-full max-w-md">
                <div className="generation-progress">
                  <div 
                    className="generation-progress-bar"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <p className="text-sm text-stone-500 mt-2 text-center font-semibold">
                  {Math.round(generationProgress)}%
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── ILLUSTRATED STORYBOOK VIEWER ─── */}
          {story && !isGenerating && (
            <motion.div 
              id="story-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-12"
            >
              {/* Story Title */}
              <div className="text-center mb-10 relative">
                <button 
                  onClick={() => setStory(null)} 
                  className="absolute top-0 right-0 p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X className="text-stone-400" size={24} />
                </button>
                <h2 className="storybook-title text-4xl md:text-6xl mb-3">
                  {story.title}
                </h2>
                <div className="flex items-center justify-center gap-2 text-amber-700 font-bold tracking-widest uppercase text-xs">
                  <BookOpen size={14} />
                  <span>Aventura Ilustrada de Efraín</span>
                </div>
              </div>

              {/* Pages */}
              <div className="space-y-6">
                {story.pages.map((page, index) => (
                  <motion.div
                    key={page.pageNumber}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="storybook-page"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Illustration */}
                      <div className="md:w-[45%] p-4 md:p-5 flex-shrink-0">
                        {page.image ? (
                          <div className="storybook-illustration">
                            <img 
                              src={page.image} 
                              alt={page.sceneDescription || `Página ${page.pageNumber}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="storybook-illustration-loading flex items-center justify-center">
                            <div className="text-center">
                              <Palette size={32} className="text-stone-400 mx-auto mb-2 animate-pulse" />
                              <p className="text-xs text-stone-400 font-semibold">
                                {locale === 'es' ? 'Ilustrando...' : 'Illustrating...'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Text Content */}
                      <div className="md:w-[55%] p-5 md:p-6 md:pl-2 flex flex-col justify-between">
                        <div>
                          <p className="storybook-text mb-4">
                            {page.text}
                          </p>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-stone-100">
                          <div className="flex items-end justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {page.sceneDescription && (
                                <p className="storybook-scene truncate">
                                  {page.sceneDescription}
                                  {page.theme && (
                                    <span className="storybook-theme-badge ml-1">: {page.theme}</span>
                                  )}
                                </p>
                              )}
                            </div>
                            <span className="storybook-page-number flex-shrink-0">
                              {locale === 'es' ? 'Página' : 'Page'} {page.pageNumber}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Lesson & Footer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-8 bg-white rounded-3xl border border-stone-200 shadow-lg overflow-hidden"
              >
                <div className="p-8 md:p-10">
                  {/* Lesson */}
                  <div className="flex items-start gap-5 mb-8">
                    <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 flex-shrink-0">
                      <Heart size={28} fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-stone-800 mb-1 uppercase tracking-wide">
                        {locale === 'es' ? 'Lección para el corazón' : 'Lesson for the heart'}
                      </h3>
                      <p className="text-lg text-stone-600 leading-relaxed italic">
                        &quot;{story.lesson}&quot;
                      </p>
                    </div>
                  </div>

                  {/* Verses & Save */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-6 border-t border-stone-100">
                    <div className="flex flex-wrap justify-center gap-3">
                      {story.verses?.map((v: string, i: number) => (
                        <span key={i} className="px-4 py-2 bg-sky-50 text-sky-700 rounded-xl font-bold text-sm border border-sky-100 shadow-sm">
                          {v}
                        </span>
                      ))}
                    </div>
                    <button 
                      onClick={handleSaveStory}
                      className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-amber-600 text-white font-black rounded-2xl hover:bg-amber-700 transition-all shadow-xl shadow-amber-600/20 hover:-translate-y-1 active:translate-y-0"
                    >
                      <Bookmark size={20} />
                      {c('save')}
                    </button>
                  </div>
                </div>
              </motion.div>
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
                        &quot;{res.en}&quot;
                      </p>
                    </div>
                    <button 
                      onClick={() => handleGenerateStory(res)}
                      className="w-full md:w-auto px-8 py-6 bg-stone-900 text-white font-bold rounded-2xl hover:bg-amber-600 transition-colors flex items-center justify-center gap-3 self-center shadow-xl shadow-stone-900/10 active:scale-95"
                    >
                      <Sparkles size={20} />
                      {locale === 'es' ? 'Crear Cuento Ilustrado' : 'Create Illustrated Story'}
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
