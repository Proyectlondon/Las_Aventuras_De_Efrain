'use client';

import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Sparkles } from 'lucide-react';

const characters = [
  { id: 'efrain', image: '/characters/efrain_final.png', color: 'bg-amber-100' },
  { id: 'jesus', image: '/characters/jesus.png', color: 'bg-sky-100' },
  { id: 'abuela', image: '/characters/abuela.png', color: 'bg-stone-100' },
  { id: 'abuelo', image: '/characters/abuelo.png', color: 'bg-stone-200' },
  { id: 'mama', image: '/characters/mama.png', color: 'bg-rose-50' },
  { id: 'papa', image: '/characters/papa.png', color: 'bg-sky-50' },
  { id: 'samuel', image: '/characters/samuel.png', color: 'bg-green-100' },
  { id: 'susana', image: '/characters/susana.png', color: 'bg-rose-100' },
  { id: 'najar', image: '/characters/najar.png', color: 'bg-amber-200' },
  { id: 'asno', image: '/characters/asno.png', color: 'bg-amber-50' },
  { id: 'caballo', image: '/characters/caballo.png', color: 'bg-stone-50' },
  { id: 'chivo', image: '/characters/chivo.png', color: 'bg-orange-50' },
  { id: 'collie', image: '/characters/collie.png', color: 'bg-blue-50' },
  { id: 'galli_pato', image: '/characters/galli_pato.png', color: 'bg-yellow-50' },
  { id: 'toro', image: '/characters/toro.png', color: 'bg-red-50' },
  { id: 'vaca', image: '/characters/vaca.png', color: 'bg-emerald-50' },
  { id: 'oveja', image: '/characters/oveja.png', color: 'bg-white' },
];

export default function CharactersPage() {
  const t = useTranslations('Common.characters');
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-stone-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <Link 
          href={`/${locale}/`}
          className="inline-flex items-center gap-2 text-stone-600 hover:text-amber-700 transition-colors font-bold mb-12 group"
        >
          <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-all">
            <ChevronLeft size={24} />
          </div>
          Volver a la exploración
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-stone-900 mb-4 tracking-tight">
            Amigos de Efraín
          </h1>
          <p className="text-xl text-stone-600 max-w-2xl mx-auto">
            Todos los personajes que acompañan a nuestro pequeño explorador en sus aventuras bíblicas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {characters.map((char, index) => (
            <motion.div
              key={char.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -10 }}
              className="bg-white rounded-[3rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col h-full group"
            >
              <div className="p-8 pb-4 flex flex-col items-center">
                <div className={`w-48 h-48 rounded-full ${char.color} relative overflow-hidden shadow-inner border-4 border-white group-hover:scale-105 transition-transform duration-500`}>
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
                  <Image 
                    src={char.image} 
                    alt={t(`${char.id}.name`)} 
                    fill 
                    className="object-contain p-4 drop-shadow-lg"
                  />
                </div>
              </div>
              
              <div className="p-8 pt-4 flex-1 flex flex-col text-center">
                <h2 className="text-2xl font-bold text-stone-900 mb-3">
                  {t(`${char.id}.name`)}
                </h2>
                <p className="text-base text-stone-600 leading-relaxed">
                  {t(`${char.id}.description`)}
                </p>
                <div className="mt-auto pt-6">
                   <div className="h-1 w-8 bg-amber-500 rounded-full mx-auto"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
