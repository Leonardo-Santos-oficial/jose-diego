import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/components/ui/button';
import { BenefitsSection } from '@/components/landing/benefits/BenefitsSection';

export default function BenefitsPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-12 flex items-center justify-between">
          <Button variant="ghost" asChild className="gap-2 text-slate-400 hover:text-white">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Voltar para o Início
            </Link>
          </Button>
        </header>
        
        <main>
          <BenefitsSection />
        </main>

        <footer className="mt-20 border-t border-white/5 pt-10 text-center text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} Aviator Game. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  );
}
