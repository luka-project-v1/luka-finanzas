'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { LukaBrand } from './luka-logo';

export function MobileHeader() {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, []);

  function handleBack() {
    router.back();
  }

  return (
    <header className="
      md:hidden
      sticky top-0 z-10
      h-16 flex items-center px-4
      bg-neu/80 backdrop-blur-md
      border-b border-neu
    ">
      {canGoBack ? (
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-neu-surface shadow-soft-in active:shadow-soft-out transition-all"
          aria-label="Volver atrás"
        >
          <ChevronLeft className="w-5 h-5 text-white/70" />
        </button>
      ) : (
        <div className="w-10" />
      )}
      
      <div className="flex-1 flex justify-center">
        <LukaBrand className="text-xl" />
      </div>
      
      <div className="w-10" />
    </header>
  );
}
