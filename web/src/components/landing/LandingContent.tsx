'use client';

import { useState } from 'react';
import { AuthModal } from './auth-modal/AuthModal';
import { FeatureHighlights } from './feature-highlights/FeatureHighlights';
import { HeroSection } from './hero/HeroSection';
import { ShortcutRail } from './shortcut-rail/ShortcutRail';

export function LandingContent() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#020617]">
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
