'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Sparkles, ChevronRight, Heart } from 'lucide-react';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const locale = useLocale();
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
          },
        });
        if (error) throw error;
        alert('¡Revisa tu correo para confirmar tu cuenta!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(`/${locale}`);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF7] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] shadow-2xl shadow-amber-900/10 border border-amber-100 overflow-hidden"
        >
          <div className="bg-gradient-to-b from-amber-500 to-orange-500 p-12 text-center relative">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <Sparkles className="w-full h-full p-4" />
            </div>
            <div className="w-24 h-24 bg-white rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl rotate-3">
              <span className="text-4xl font-black text-amber-600">E</span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Efraín</h1>
            <p className="text-amber-100 font-medium italic">Tu compañero en la Palabra</p>
          </div>

          <form onSubmit={handleAuth} className="p-10 space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                <input 
                  type="email"
                  placeholder="Correo electrónico"
                  className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                <input 
                  type="password"
                  placeholder="Contraseña"
                  className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-amber-600/20 hover:bg-amber-700 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? 'Cargando...' : isRegister ? 'Crear mi cuenta' : 'Entrar a la aventura'}
              <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>

            <div className="text-center pt-4">
              <button 
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-stone-500 font-bold hover:text-amber-700 transition-colors"
              >
                {isRegister ? '¿Ya tienes cuenta? Entrar' : '¿Eres nuevo? Regístrate aquí'}
              </button>
            </div>
          </form>

          <div className="p-6 bg-stone-50 border-t border-stone-100 flex items-center justify-center gap-2 text-stone-400 text-sm font-bold uppercase tracking-widest">
            <Heart size={16} fill="currentColor" className="text-rose-300" />
            <span>Unidos por la Palabra</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
