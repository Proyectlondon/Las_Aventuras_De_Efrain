'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Book, Trash2, Calendar, Sparkles, Heart, BookOpen, Palette, X, Bookmark } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface StoryPage {
  pageNumber: number;
  text: string;
  sceneDescription: string;
  theme: string;
  image?: string | null;
}

export default function LibraryPage() {
  const t = useTranslations('Common');
  const locale = useLocale();
  const [savedStories, setSavedStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setSavedStories(data);
    setLoading(false);
  };

  const [selectedStory, setSelectedStory] = useState<any>(null);

  const deleteStory = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres borrar este tesoro?')) return;
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', id);

    if (!error) {
      setSavedStories(savedStories.filter(s => s.id !== id));
    }
  };

  const hasIllustrations = (story: any) => {
    return story.pages && Array.isArray(story.pages) && story.pages.length > 0;
  };

  const getFirstImage = (story: any): string | null => {
    if (!hasIllustrations(story)) return null;
    const firstPageWithImage = story.pages.find((p: StoryPage) => p.image);
    return firstPageWithImage?.image || null;
  };

  return (
    <div className="min-h-screen bg-[#FDFCF7] p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <Link 
          href={`/${locale}/`}
          className="inline-flex items-center gap-2 text-stone-600 hover:text-amber-700 transition-colors font-bold mb-12 group"
        >
          <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-all">
            <ChevronLeft size={24} />
          </div>
          {locale === 'es' ? 'Volver a la exploración' : 'Back to exploration'}
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex justify-between items-end"
        >
          <div>
            <h1 className="text-5xl md:text-6xl font-black text-stone-900 mb-4 tracking-tight">
              {locale === 'es' ? 'Tu Biblioteca' : 'Your Library'}
            </h1>
            <p className="text-xl text-stone-600 font-medium">
              {locale === 'es' 
                ? 'Aquí se guardan todos los tesoros y aventuras que has descubierto con Efraín.'
                : 'Here are all the treasures and adventures you have discovered with Efraín.'}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white p-4 rounded-[2rem] shadow-xl shadow-amber-900/5 border border-amber-100 flex items-center gap-3">
              <Book className="text-amber-600" size={32} />
              <span className="text-2xl font-black text-stone-800">{savedStories.length}</span>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-8">
          <AnimatePresence mode="popLayout">
            {savedStories.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white border-2 border-dashed border-stone-200 rounded-[3rem] p-20 text-center"
              >
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-400">
                  <Book size={40} />
                </div>
                <h2 className="text-2xl font-bold text-stone-800 mb-2">
                  {locale === 'es' ? 'Tu biblioteca está vacía' : 'Your library is empty'}
                </h2>
                <p className="text-stone-500 text-lg">
                  {locale === 'es' 
                    ? '¡Busca una palabra en la concordancia para empezar tu primera aventura!'
                    : 'Search for a word in the concordance to start your first adventure!'}
                </p>
              </motion.div>
            ) : (
              savedStories.map((story) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden group hover:border-amber-200 transition-all cursor-pointer"
                  onClick={() => setSelectedStory(story)}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Thumbnail from first illustration */}
                    {getFirstImage(story) && (
                      <div className="md:w-48 h-40 md:h-auto flex-shrink-0 overflow-hidden">
                        <img 
                          src={getFirstImage(story)!}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="p-8 md:p-10 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-widest">
                            <Calendar size={14} />
                            <span>{new Date(story.created_at).toLocaleDateString()}</span>
                          </div>
                          {hasIllustrations(story) && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-100">
                              <Palette size={12} />
                              {story.pages.length} {locale === 'es' ? 'págs' : 'pgs'}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteStory(story.id);
                          }}
                          className="p-3 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      <h2 className="text-2xl font-black text-stone-900 mb-3 group-hover:text-amber-700 transition-colors leading-tight">
                        {story.title}
                      </h2>
                      
                      <p className="text-stone-600 leading-relaxed line-clamp-2 mb-6">
                        {hasIllustrations(story) 
                          ? story.pages[0]?.text 
                          : story.content}
                      </p>

                      <div className="flex flex-wrap gap-3 items-center">
                        {story.verses?.slice(0, 2).map((v: string, i: number) => (
                          <span key={i} className="px-3 py-1.5 bg-sky-50 text-sky-700 rounded-lg font-bold text-xs border border-sky-100">
                            {v}
                          </span>
                        ))}
                        <div className="flex-1"></div>
                        <span className="flex items-center gap-2 text-amber-700 font-black uppercase text-xs tracking-wide group-hover:gap-3 transition-all">
                          {locale === 'es' ? 'Leer aventura' : 'Read adventure'}
                          <ChevronLeft className="rotate-180" size={16} />
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── STORY READER MODAL ─── */}
      <AnimatePresence>
        {selectedStory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStory(null)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-[#FDFCF7] rounded-3xl shadow-2xl overflow-y-auto"
            >
              {/* Close button */}
              <div className="sticky top-0 right-0 p-4 flex justify-end z-10">
                <button 
                  onClick={() => setSelectedStory(null)}
                  className="p-3 bg-white/80 backdrop-blur rounded-full shadow-lg text-stone-500 hover:text-stone-900 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 md:px-12 pb-12 -mt-4">
                {/* Title */}
                <div className="text-center mb-10">
                  <h2 className="storybook-title text-3xl md:text-5xl mb-2">
                    {selectedStory.title}
                  </h2>
                  <div className="flex items-center justify-center gap-2 text-amber-700 font-bold tracking-widest uppercase text-xs">
                    <BookOpen size={14} />
                    <span>{locale === 'es' ? 'Tesoro Guardado' : 'Saved Treasure'}</span>
                  </div>
                </div>

                {/* Illustrated Pages */}
                {hasIllustrations(selectedStory) ? (
                  <div className="space-y-5">
                    {selectedStory.pages.map((page: StoryPage, index: number) => (
                      <motion.div
                        key={page.pageNumber}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className="storybook-page"
                      >
                        <div className="flex flex-col md:flex-row">
                          {/* Illustration */}
                          {page.image && (
                            <div className="md:w-[45%] p-4 md:p-5 flex-shrink-0">
                              <div className="storybook-illustration">
                                <img 
                                  src={page.image}
                                  alt={page.sceneDescription || `Página ${page.pageNumber}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          )}

                          {/* Text */}
                          <div className={`${page.image ? 'md:w-[55%]' : 'w-full'} p-5 md:p-6 ${page.image ? 'md:pl-2' : ''} flex flex-col justify-between`}>
                            <p className="storybook-text mb-4">{page.text}</p>
                            
                            <div className="mt-3 pt-3 border-t border-stone-100">
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
                ) : (
                  /* Legacy text-only story */
                  <div className="bg-white rounded-2xl border border-stone-200 p-8 md:p-12">
                    <p className="text-lg text-stone-700 leading-relaxed first-letter:text-5xl first-letter:font-black first-letter:text-amber-600 first-letter:mr-3 first-letter:float-left whitespace-pre-wrap">
                      {selectedStory.content}
                    </p>
                  </div>
                )}

                {/* Lesson */}
                <div className="mt-8 bg-white rounded-2xl border border-stone-200 p-6 md:p-8">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600 flex-shrink-0">
                      <Heart size={24} fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-stone-800 mb-1 uppercase tracking-wide">
                        {locale === 'es' ? 'Lección para el corazón' : 'Lesson for the heart'}
                      </h3>
                      <p className="text-lg text-stone-600 leading-relaxed italic">
                        &quot;{selectedStory.lesson}&quot;
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4 border-t border-stone-100">
                    {selectedStory.verses?.map((v: string, i: number) => (
                      <span key={i} className="px-4 py-2 bg-sky-50 text-sky-700 rounded-lg font-bold text-sm border border-sky-100">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
