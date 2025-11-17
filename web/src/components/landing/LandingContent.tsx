'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signOutAction } from '@/app/actions/auth';
import { Button } from '@/components/components/ui/button';
import { AuthModal } from './auth-modal/AuthModal';
import { FeatureHighlights } from './feature-highlights/FeatureHighlights';
import { HeroSection } from './hero/HeroSection';
import { ShortcutRail } from './shortcut-rail/ShortcutRail';

type LandingContentProps = {
  isAuthenticated: boolean;
  displayName: string;
};

export function LandingContent({ isAuthenticated, displayName }: LandingContentProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const router = useRouter();
  const [isSigningOut, startSignOut] = useTransition();

  useEffect(() => {
    if (isAuthenticated) {
      setModalOpen(false);
    }
  }, [isAuthenticated]);

  const handleLogout = useCallback(() => {
    setLogoutError(null);
    startSignOut(async () => {
      const result = await signOutAction();

      if (result.status === 'error') {
        setLogoutError(result.message ?? 'Erro ao encerrar sessão.');
        return;
      }

      router.refresh();
    });
  }, [router, startSignOut]);

  return (
    <div className="min-h-screen bg-[#020617]">
      <header className="border-b border-white/5 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold text-slate-100">
              {isAuthenticated ? `Bem-vindo, ${displayName}` : 'Crie sua conta demo gratuita'}
            </p>
            {logoutError ? (
              <p className="text-xs text-rose-300">{logoutError}</p>
            ) : (
              <p className="text-xs text-slate-400">
                {isAuthenticated
                  ? 'Saldo virtual liberado. Continue testando ou encerre a sessão quando quiser.'
                  : 'Ganhe créditos fictícios e teste o Aviator sem risco.'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                variant="secondary"
                onClick={handleLogout}
                disabled={isSigningOut}
                className="rounded-full border border-slate-700/70 bg-slate-900/70 px-5 text-slate-100 hover:bg-slate-800"
              >
                {isSigningOut ? 'Saindo...' : 'Logout'}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setModalOpen(true)}
                className="rounded-full border border-white/10 bg-transparent px-5 text-slate-100 hover:bg-white/10"
              >
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:gap-6">
        <div className="md:w-72 lg:w-80">
          <ShortcutRail />
        </div>
        <main className="flex flex-1 flex-col gap-12">
          <HeroSection onAuthRequest={() => setModalOpen(true)} />
          <FeatureHighlights />
        </main>
      </div>
      <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
