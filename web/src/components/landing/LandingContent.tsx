'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOutAction } from '@/app/actions/auth';
import { Button } from '@/components/components/ui/button';
import { AuthModal } from './auth-modal/AuthModal';
import { CallToActionStrip } from './cta/CallToActionStrip';
import { FeatureHighlights } from './feature-highlights/FeatureHighlights';
import { HeroSection } from './hero/HeroSection';
import { InstitutionalShowcase } from './institutional/InstitutionalShowcase';
import { PerformanceChecklist } from './performance/PerformanceChecklist';
import { ShortcutRail } from './shortcut-rail/ShortcutRail';

type LandingContentProps = {
  isAuthenticated: boolean;
  displayName: string;
};

export function LandingContent({ isAuthenticated, displayName }: LandingContentProps) {
  const [modalRequested, setModalRequested] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSigningOut, startSignOut] = useTransition();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      // Fallback: Se o Supabase redirecionar para a raiz com o código (Site URL),
      // forçamos o redirecionamento para o handler de callback correto.
      const next = searchParams.get('next') ?? '/app';
      window.location.href = `/auth/callback?code=${code}&next=${next}`;
      return;
    }

    const authError = searchParams.get('authError');
    if (authError) {
      // Exibir erro vindo do callback OAuth (ex: cancelado, falha de troca de token)
      console.error('Erro de login social:', authError);
      setLogoutError(authError);
    }
  }, [searchParams]);

  const modalOpen = useMemo(
    () => !isAuthenticated && modalRequested,
    [isAuthenticated, modalRequested]
  );

  const handleAuthRequest = useCallback(() => {
    if (isAuthenticated) {
      return;
    }
    setModalRequested(true);
  }, [isAuthenticated]);

  const handleCloseModal = useCallback(() => {
    setModalRequested(false);
  }, []);

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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 md:gap-6 md:py-10">
        <main className="flex flex-1 flex-col gap-8 md:gap-12">
          <HeroSection
            onAuthRequest={handleAuthRequest}
            isAuthenticated={isAuthenticated}
          />
          {logoutError && (
            <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 p-4 text-center text-sm text-rose-200">
              {logoutError}
            </div>
          )}
          <InstitutionalShowcase />
          <FeatureHighlights />
          <PerformanceChecklist />
          <CallToActionStrip onAuthRequest={handleAuthRequest} />
        </main>
      </div>
      <AuthModal open={modalOpen} onClose={handleCloseModal} />
    </div>
  );
}
