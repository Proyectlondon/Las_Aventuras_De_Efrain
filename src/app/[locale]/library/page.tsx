'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Book, Trash2, Calendar, Sparkles, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
          Volver a la exploración
        </Link>

        {/* ... (rest of the header remains same until the list) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex justify-between items-end"
        >
          <div>
            <h1 className="text-5xl md:text-6xl font-black text-stone-900 mb-4 tracking-tight">
              Tu Biblioteca
            </h1>
            <p className="text-xl text-stone-600 font-medium">
              Aquí se guardan todos los tesoros y aventuras que has descubierto con Efraín.
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
                <h2 className="text-2xl font-bold text-stone-800 mb-2">Tu biblioteca está vacía</h2>
                <p className="text-stone-500 text-lg">¡Busca una palabra en la concordancia para empezar tu primera aventura!</p>
              </motion.div>
            ) : (
              savedStories.map((story) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[3rem] shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden group hover:border-amber-200 transition-all cursor-pointer"
                  onClick={() => setSelectedStory(story)}
                >
                  <div className="p-8 md:p-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3 text-amber-600 font-bold text-xs uppercase tracking-widest">
                        <Calendar size={16} />
                        <span>{new Date(story.created_at).toLocaleDateString()}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStory(story.id);
                        }}
                        className="p-3 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    
                    <h2 className="text-3xl font-black text-stone-900 mb-4 group-hover:text-amber-700 transition-colors leading-tight">
                      {story.title}
                    </h2>
                    
                    <p className="text-xl text-stone-600 leading-relaxed line-clamp-2 mb-8">
                      {story.content}
                    </p>

                    <div className="flex flex-wrap gap-3 items-center">
                      {story.verses?.map((v: string, i: number) => (
                        <span key={i} className="px-4 py-2 bg-sky-50 text-sky-700 rounded-xl font-bold text-xs border border-sky-100 shadow-sm">
                          {v}
                        </span>
                      ))}
                      <div className="flex-1"></div>
                      <span className="flex items-center gap-2 text-amber-700 font-black uppercase text-sm tracking-wide group-hover:gap-3 transition-all">
                        Leer aventura completa
                        <ChevronLeft className="rotate-180" size={20} />
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Story Reader Modal */}
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
              className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[3rem] shadow-2xl overflow-y-auto"
            >
              <div className="sticky top-0 right-0 p-6 flex justify-end z-10">
                <button 
                  onClick={() => setSelectedStory(null)}
                  className="p-3 bg-white/80 backdrop-blur rounded-full shadow-lg text-stone-500 hover:text-stone-900 transition-all"
                >
                  <ChevronLeft className="rotate-90" size={24} />
                </button>
              </div>

              <div className="p-8 md:p-16 pt-0">
                <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
                   <div className="w-32 h-32 md:w-40 md:h-40 relative flex-shrink-0">
                    <div className="absolute inset-0 bg-white rounded-full shadow-lg border-4 border-amber-200"></div>
                    <div className="relative w-full h-full rounded-full overflow-hidden">
                      <Image src="/characters/efrain_final.png" alt="Efraín" fill className="object-cover" />
                    </div>
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-4xl md:text-5xl font-black text-stone-900 mb-2 leading-tight">{selectedStory.title}</h2>
                    <p className="text-amber-700 font-bold tracking-widest uppercase text-sm">Tesoro Guardado</p>
                  </div>
                </div>

                <div className="prose prose-stone max-w-none">
                  <p className="text-2xl text-stone-700 leading-relaxed first-letter:text-6xl first-letter:font-black first-letter:text-amber-600 first-letter:mr-4 first-letter:float-left whitespace-pre-wrap">
                    {selectedStory.content}
                  </p>
                  
                  <div className="mt-16 p-8 bg-amber-50/50 rounded-[2.5rem] border border-amber-100 flex items-start gap-6 shadow-inner">
                    <div className="p-4 bg-white rounded-2xl text-amber-600 shadow-sm">
                      <Heart size={32} fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-stone-800 mb-2 uppercase tracking-wide">Lección para el corazón</h3>
                      <p className="text-xl text-stone-600 leading-relaxed italic">"{selectedStory.lesson}"</p>
                    </div>
                  </div>

                  <div className="mt-12 flex flex-wrap gap-4 pt-8 border-t border-stone-100">
                    {selectedStory.verses?.map((v: string, i: number) => (
                      <span key={i} className="px-5 py-2 bg-sky-100 text-sky-800 rounded-xl font-bold text-sm">
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
