'use client';

import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Sparkles } from 'lucide-react';

const characters = [
  // MAIN
  { id: 'efrain', category: 'main', image: '/modelsheets/efrain/EFRAIN.png', color: 'bg-[#C8953D]/20 border-[#C8953D]' },
  { id: 'jesus', category: 'main', image: '/modelsheets/jesus/JESUS_011.png', color: 'bg-[#F5E6C8]/40 border-[#F5E6C8]' },
  { id: 'samuel', category: 'main', image: '/modelsheets/samuel/SAMUEL_013.png', color: 'bg-[#7D8B69]/20 border-[#7D8B69]' },
  { id: 'susana', category: 'main', image: '/modelsheets/susana/SUSANA_007.png', color: 'bg-[#C17B5B]/20 border-[#C17B5B]' },
  { id: 'najar', category: 'main', image: '/modelsheets/najar/NAJAR_002.png', color: 'bg-[#D4A574]/30 border-[#D4A574]' },
  { id: 'mama', category: 'main', image: '/modelsheets/mama/MAMA_004.png', color: 'bg-[#E8A87C]/30 border-[#E8A87C]' },
  { id: 'papa', category: 'main', image: '/modelsheets/papa/PAPA_003.png', color: 'bg-[#8B7355]/20 border-[#8B7355]' },
  { id: 'abuela', category: 'main', image: '/modelsheets/abuela/ABUELA_017.png', color: 'bg-[#9B8579]/20 border-[#9B8579]' },
  { id: 'abuelo', category: 'main', image: '/modelsheets/abuelo/ABUELO_010.png', color: 'bg-[#A89080]/20 border-[#A89080]' },
  // ANIMALS
  { id: 'oveja', category: 'animal', image: '/modelsheets/oveja/OVEJA_003.png', color: 'bg-[#F5E6C8]/40 border-[#F5E6C8]' },
  { id: 'toro', category: 'animal', image: '/modelsheets/toro/TORO_000.png', color: 'bg-[#C17B5B]/20 border-[#C17B5B]' },
  { id: 'asno', category: 'animal', image: '/modelsheets/asno/ASNO_003.png', color: 'bg-[#A89080]/20 border-[#A89080]' },
  { id: 'caballo', category: 'animal', image: '/modelsheets/caballo/CABALLO_013.png', color: 'bg-[#8B6914]/20 border-[#8B6914]' },
  { id: 'vaca', category: 'animal', image: '/modelsheets/vaca/VACA_003.png', color: 'bg-[#D4C4A8]/30 border-[#D4C4A8]' },
  { id: 'chivo', category: 'animal', image: '/modelsheets/chivo/CHIVO_005.png', color: 'bg-[#B8A88A]/30 border-[#B8A88A]' },
  { id: 'collie', category: 'animal', image: '/modelsheets/collie/COLLIE_010.png', color: 'bg-[#C8953D]/20 border-[#C8953D]' },
  { id: 'galli_pato', category: 'animal', image: '/modelsheets/galli_pato/GALLO_000.png', color: 'bg-[#D4A017]/20 border-[#D4A017]' },
  // SECONDARY
  { id: 'nina', category: 'secondary', image: '/modelsheets/personajes_recurrentes/nina/NINA_000.png', color: 'bg-[#E8A87C]/30 border-[#E8A87C]' },
  { id: 'tejedora', category: 'secondary', image: '/modelsheets/personajes_recurrentes/gente/TEJEDORA_006.png', color: 'bg-[#9B8579]/20 border-[#9B8579]' },
  { id: 'vendedor', category: 'secondary', image: '/modelsheets/personajes_recurrentes/gente/VENDEDOR_000.png', color: 'bg-[#A89080]/20 border-[#A89080]' },
  { id: 'ciervo', category: 'secondary', image: '/modelsheets/personajes_recurrentes/animales/CIERVO_000.png', color: 'bg-[#8B7355]/20 border-[#8B7355]' },
  { id: 'cerdo', category: 'secondary', image: '/modelsheets/personajes_recurrentes/animales/CERDO_000.png', color: 'bg-[#C4A882]/30 border-[#C4A882]' },
  { id: 'ternero', category: 'secondary', image: '/modelsheets/personajes_recurrentes/animales/TERNERO_001.png', color: 'bg-[#D4C4A8]/30 border-[#D4C4A8]' },
];

const CharacterGrid = ({ title, chars, t }: { title: string, chars: any[], t: any }) => (
  <div className="mb-16">
    <h2 className="text-3xl font-bold text-[#6B4F3A] mb-8 border-b-2 border-[#E8D5BC] pb-2 inline-block">
      {title}
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {chars.map((char, index) => (
        <motion.div
          key={char.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ y: -5 }}
          className="card-warm-gradient rounded-3xl shadow-xl overflow-hidden border border-[#E8D5BC] flex flex-col h-full group"
        >
          <div className="p-8 pb-4 flex flex-col items-center">
            <div className={`w-40 h-40 rounded-full ${char.color} relative overflow-hidden shadow-inner border-4 group-hover:scale-105 transition-transform duration-500`}>
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
              <Image 
                src={char.image} 
                alt={t(`${char.id}.name`)} 
                fill 
                className="object-contain p-2 drop-shadow-lg"
              />
            </div>
          </div>
          
          <div className="p-8 pt-4 flex-1 flex flex-col text-center">
            <h3 className="text-2xl font-bold text-[#3D2B1F] mb-3">
              {t(`${char.id}.name`)}
            </h3>
            <p className="text-base text-[#6B4F3A] leading-relaxed">
              {t(`${char.id}.description`)}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default function CharactersPage() {
  const t = useTranslations('Common.characters');
  const locale = useLocale();

  const mainChars = characters.filter(c => c.category === 'main');
  const animalChars = characters.filter(c => c.category === 'animal');
  const secondaryChars = characters.filter(c => c.category === 'secondary');

  return (
    <div className="min-h-screen bg-pastoral-pattern p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <Link 
          href={`/${locale}/`}
          className="inline-flex items-center gap-2 text-stone-600 hover:text-amber-700 transition-colors font-bold mb-12 group"
        >
          <div className="p-2 bg-white rounded-full shadow-sm border border-[#E8D5BC] group-hover:shadow-md transition-all">
            <ChevronLeft size={24} />
          </div>
          Volver a la exploración
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-[#3D2B1F] mb-4 tracking-tight">
            Amigos de Efraín
          </h1>
          <p className="text-xl text-[#6B4F3A] max-w-2xl mx-auto">
            Todos los personajes que acompañan a nuestro pequeño explorador en sus aventuras bíblicas.
          </p>
        </motion.div>

        <CharacterGrid title="Principales" chars={mainChars} t={t} />
        <CharacterGrid title="Animales Bíblicos" chars={animalChars} t={t} />
        <CharacterGrid title="Pobladores" chars={secondaryChars} t={t} />
      </div>
    </div>
  );
}
