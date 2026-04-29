'use client';

import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

const scenes = [
  { id: 'casa_cocina', category: 'house', image: '/modelsheets/escenarios/CASA_COCINA_000.png' },
  { id: 'casa_sala', category: 'house', image: '/modelsheets/escenarios/CASA_SALA_000.png' },
  { id: 'casa_habitacion', category: 'house', image: '/modelsheets/escenarios/CASA_HABITACIÓN.png' },
  { id: 'casa_exterior', category: 'house', image: '/modelsheets/escenarios/CASA_EXTERIOR_000.png' },
  { id: 'ciudad_mercado_1', category: 'city', image: '/modelsheets/escenarios/CIUDAD_MERCADO_000.png' },
  { id: 'ciudad_mercado_2', category: 'city', image: '/modelsheets/escenarios/CIUDAD_MERCADO_001.png' },
  { id: 'ciudad_mercado_3', category: 'city', image: '/modelsheets/escenarios/CIUDAD_MERCADO_002.png' },
  { id: 'ciudad_mercado_4', category: 'city', image: '/modelsheets/escenarios/CIUDAD_MERCADO_003.png' }
];

export default function ScenesPage() {
  const t = useTranslations('Common.scenes');
  const locale = useLocale();

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
            Escenarios Bíblicos
          </h1>
          <p className="text-xl text-[#6B4F3A] max-w-2xl mx-auto">
            Descubre los lugares fascinantes donde Efraín y sus amigos aprenden de la Palabra.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
          {scenes.map((scene, index) => (
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="card-warm-gradient rounded-[2rem] shadow-xl overflow-hidden border border-[#E8D5BC] flex flex-col group"
            >
              <div className="relative w-full aspect-video overflow-hidden border-b-4 border-[#C8953D]/20">
                <Image 
                  src={scene.image} 
                  alt={t(`${scene.id}.name`)} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-8 flex flex-col items-start bg-white/50 backdrop-blur-sm">
                <div className="inline-block px-3 py-1 bg-[#F5E6C8] text-[#8B7355] text-xs font-bold uppercase tracking-widest rounded-full mb-3">
                  {scene.category === 'house' ? 'Casa de Efraín' : 'Ciudad Antigua'}
                </div>
                <h3 className="text-3xl font-bold text-[#3D2B1F] mb-3">
                  {t(`${scene.id}.name`)}
                </h3>
                <p className="text-lg text-[#6B4F3A] leading-relaxed">
                  {t(`${scene.id}.description`)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
