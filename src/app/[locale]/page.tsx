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
    setGenerationProgress(5);
    
    try {
      // ═══ PHASE 1+2: The Narrator writes + The Art Director storyboards ═══
      // (Both happen in a single API call to /api/generate)
      setGenerationStep(locale === 'es' 
        ? '✍️ El Narrador está escribiendo la historia...' 
        : '✍️ The Narrator is writing the story...');
      setGenerationProgress(8);

      // Simulate phase transition for UX feedback
      const progressTimer = setTimeout(() => {
        setGenerationStep(locale === 'es' 
          ? '🎬 El Director de Arte prepara las escenas...' 
          : '🎬 The Art Director is preparing scenes...');
        setGenerationProgress(15);
      }, 6000);

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
      
      clearTimeout(progressTimer);
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

      // Story text ready — show it immediately so user can start reading
      setGenerationStep(locale === 'es' 
        ? '📖 ¡Historia lista! Preparando ilustraciones...' 
        : '📖 Story ready! Preparing illustrations...');
      setGenerationProgress(25);

      const initialStory: IllustratedStory = {
        title: data.title,
        pages: data.pages.map((p: StoryPage) => ({ ...p, image: null })),
        lesson: data.lesson,
        verses: data.verses
      };
      setStory(initialStory);

      // Scroll to story so user can start reading while images generate
      setTimeout(() => {
        document.getElementById('story-view')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);

      // ═══ PHASE 3: The Illustrator paints each page ═══
      const totalPages = data.pages.length;
      for (let i = 0; i < totalPages; i++) {
        const page = data.pages[i];
        setGenerationStep(locale === 'es' 
          ? `🎨 Ilustrando página ${i + 1} de ${totalPages}...`
          : `🎨 Illustrating page ${i + 1} of ${totalPages}...`);
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
      setGenerationStep(locale === 'es' ? '✅ ¡Cuento ilustrado completo!' : '✅ Illustrated story complete!');

    } catch (error) {
      console.error('Story generation failed:', error);
      setGenerationStep(locale === 'es' 
        ? '❌ Error generando el cuento. Intenta de nuevo.' 
        : '❌ Error generating story. Try again.');
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationStep('');
        setGenerationProgress(0);
      }, 2000);
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
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 relative">
        {/* Floating decorative companions */}
        <div className="floating-companion top-20 left-4 animate-float" style={{ animationDelay: '0s' }}>
          <Image src="/characters/oveja.png" alt="" width={60} height={60} className="opacity-20" />
        </div>
        <div className="floating-companion top-40 right-4 animate-float" style={{ animationDelay: '1.5s' }}>
          <Image src="/characters/collie.png" alt="" width={55} height={55} className="opacity-15" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          {/* Efraín Mascot */}
          <motion.div 
            className="mb-6 inline-block"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="relative w-28 h-28 md:w-36 md:h-36 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200 via-amber-100 to-green-100 animate-pulse" style={{ animationDuration: '4s' }} />
              <Image src="/characters/efrain_final.png" alt="Efraín" fill className="object-cover rounded-full relative z-10 border-4 border-white shadow-xl" />
              <div className="absolute -bottom-1 -right-1 z-20 bg-amber-500 rounded-full p-2 shadow-lg border-2 border-white">
                <Sparkles size={16} className="text-white" />
              </div>
            </div>
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-black text-stone-900 mb-3 tracking-tight">
            {t('title')}
          </h1>
          <p className="text-lg md:text-xl text-stone-500 mb-8 max-w-xl mx-auto font-medium">
            {t('subtitle')} ✨
          </p>

          {/* Adventure Search Bar */}
          <div className="search-adventure relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-amber-400 z-10">
              <Search size={22} />
            </div>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-14 pr-40 py-5 bg-white border-2 border-amber-200 rounded-2xl shadow-lg shadow-amber-100/40 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/15 outline-none text-lg transition-all text-stone-900 placeholder:text-stone-400"
            />
            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute right-2.5 top-2 bottom-2 px-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              {isSearching ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  <Sparkles size={16} />
                  {locale === 'es' ? '¡Buscar!' : 'Search!'}
                </>
              )}
            </button>
          </div>

          {/* Age Group Pills */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {Object.keys(c.raw('ageGroups')).map((key) => {
              const emojis: Record<string, string> = { toddler: '🍼', preschool: '🌱', middle: '🌟' };
              const pillClass = `age-pill age-pill--${key}`;

              return (
                <button 
                  key={key} 
                  onClick={() => setSelectedAge(key)}
                  className={`${pillClass} ${
                    selectedAge === key 
                    ? 'active' 
                    : 'bg-white text-stone-500 border-stone-200 hover:border-amber-300'
                  }`}
                >
                  <span className="mr-1.5">{emojis[key]}</span>
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
              className="treasure-card mb-8 text-[#3D2B1F]"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-amber-100 rounded-xl">
                    <BookOpen size={22} className="text-amber-600" />
                  </div>
                  <span className="font-black tracking-widest uppercase text-xs text-amber-700">📚 {locale === 'es' ? 'Diccionario de Tesoros' : 'Treasury Dictionary'}</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-4 text-stone-900">{analysis.title}</h2>
                <p className="text-lg opacity-90 leading-relaxed mb-6 max-w-3xl">
                  {analysis.story}
                </p>
                <div className="inline-flex items-center gap-3 px-5 py-3 bg-amber-50 rounded-2xl border border-amber-200">
                   <Heart size={18} fill="currentColor" className="text-rose-400" />
                   <span className="font-bold italic text-stone-700">{analysis.lesson}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── GENERATION PROGRESS ─── */}
          {isGenerating && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="generation-container"
            >
              <div className="generation-mascot">
                <div className="generation-mascot-ring" />
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-amber-50 border-4 border-white shadow-xl overflow-hidden">
                  <Image src="/characters/efrain_final.png" alt="Efraín" fill className="object-cover" />
                </div>
              </div>
              <p className="text-xl font-black text-stone-800 mb-1">{generationStep}</p>
              <p className="text-sm text-stone-400 mb-6 font-medium">
                {locale === 'es' ? 'Efraín está preparando tu aventura...' : 'Efraín is preparing your adventure...'}
              </p>
              
              <div className="w-full max-w-sm mx-auto">
                <div className="generation-progress">
                  <div 
                    className="generation-progress-bar"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <p className="text-xs text-amber-600 mt-2 text-center font-black">
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
                className="mt-8 lesson-card"
              >
                <div className="p-8 md:p-10">
                  {/* Lesson */}
                  <div className="flex items-start gap-5 mb-8">
                    <div className="p-3 bg-rose-50 rounded-2xl text-rose-400 flex-shrink-0 animate-bounce-soft" style={{ animationDuration: '3s' }}>
                      <Heart size={28} fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-stone-800 mb-2 uppercase tracking-widest">
                        💛 {locale === 'es' ? 'Lección para el corazón' : 'Lesson for the heart'}
                      </h3>
                      <p className="text-lg text-stone-600 leading-relaxed italic">
                        &quot;{story.lesson}&quot;
                      </p>
                    </div>
                  </div>

                  {/* Verses & Save */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-6 border-t border-amber-100">
                    <div className="flex flex-wrap justify-center gap-2">
                      {story.verses?.map((v: string, i: number) => (
                        <span key={i} className="px-4 py-2 bg-sky-50 text-sky-700 rounded-full font-black text-xs border border-sky-200 shadow-sm">
                          📖 {v}
                        </span>
                      ))}
                    </div>
                    <button 
                      onClick={handleSaveStory}
                      className="btn-create-story w-full sm:w-auto"
                    >
                      <Bookmark size={18} />
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
              className="grid gap-5"
            >
              <div className="flex items-center gap-4 mb-2">
                <span className="text-2xl">📖</span>
                <h2 className="text-xl font-black text-stone-800">
                  {locale === 'es' ? '¡Tesoros encontrados!' : 'Treasures found!'}
                </h2>
                <div className="h-px flex-1 bg-amber-200"></div>
              </div>
              
              {results.map((res, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="result-card"
                >
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 font-black text-xs uppercase tracking-widest rounded-lg border border-amber-200 mb-4">
                        📜 {res.ref}
                      </span>
                      <p className="text-2xl md:text-3xl font-hebrew text-stone-900 leading-relaxed text-right mb-4" dir="rtl">
                        {res.he}
                      </p>
                      <p className="text-base text-stone-500 leading-relaxed italic">
                        &quot;{res.en}&quot;
                      </p>
                    </div>
                    <button 
                      onClick={() => handleGenerateStory(res)}
                      className="btn-create-story w-full md:w-auto self-center"
                    >
                      <Sparkles size={18} />
                      {locale === 'es' ? '¡Crear Cuento Ilustrado!' : 'Create Illustrated Story!'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-6 bg-amber-50/50 border-t border-amber-100 flex items-center justify-center gap-8 px-6">
        <div className="flex items-center gap-2 text-amber-600/50">
          <span className="text-lg">📖</span>
          <span className="font-black uppercase tracking-widest text-[0.65rem]">{locale === 'es' ? 'Fidelidad Bíblica' : 'Biblical Fidelity'}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-amber-300" />
        <div className="flex items-center gap-2 text-amber-600/50">
          <span className="text-lg">🌾</span>
          <span className="font-black uppercase tracking-widest text-[0.65rem]">{locale === 'es' ? 'Aventuras con Efraín' : 'Adventures with Efraín'}</span>
        </div>
      </footer>
    </div>
  );
}
