'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { Loader2, Sparkles } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    // Supabase client automatically handles the hash in the URL and establishes the session.
    // We just wait a brief moment for it to process, then redirect to the main app.
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error during auth callback:', error);
      }

      // Redirect back to the main page after a short delay for smooth UX
      setTimeout(() => {
        router.push(`/${locale}`);
      }, 1500);
    };

    handleAuthCallback();
  }, [router, locale]);

  return (
    <div className="min-h-screen bg-[#FDFCF7] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 bg-amber-200 rounded-full animate-ping opacity-50"></div>
        <div className="relative w-full h-full bg-white rounded-full shadow-xl flex items-center justify-center text-amber-600 border-4 border-amber-100">
          <Loader2 className="animate-spin" size={32} />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-2 rounded-full shadow-lg">
          <Sparkles size={20} />
        </div>
      </div>
      
      <h1 className="text-3xl font-black text-stone-900 mb-4 tracking-tight">
        Preparando tu campamento...
      </h1>
      <p className="text-stone-600 text-lg font-medium max-w-md">
        Estamos guardando tus llaves mágicas para que tus tesoros estén seguros.
      </p>
    </div>
  );
}
