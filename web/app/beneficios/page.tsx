import Link from 'next/link';
import { ArrowLeft, Crown } from 'lucide-react';
import { Button } from '@/components/components/ui/button';
import { BenefitsDashboard } from '@/components/benefits';
import { BenefitsSection } from '@/components/landing/benefits/BenefitsSection';
import { getBenefitsSummaryAction } from '@/app/actions/benefits';
import { getCurrentSession } from '@/lib/auth/session';

export default async function BenefitsPage() {
  const session = await getCurrentSession();
  const isAuthenticated = !!session?.id;
  const summary = isAuthenticated ? await getBenefitsSummaryAction() : null;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" asChild className="gap-2 text-slate-400 hover:text-white">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Voltar para o Início
            </Link>
          </Button>
          {isAuthenticated && (
            <Button variant="outline" asChild className="gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
              <Link href="/app">
                <Crown className="size-4" />
                Ir para o Jogo
              </Link>
            </Button>
          )}
        </header>

        <div className="mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 sm:px-4 sm:py-1.5 sm:text-xs">
            <Crown className="size-3" />
            Programa de Benefícios
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:mt-4 sm:text-3xl lg:text-4xl">
            Seus Benefícios Exclusivos
          </h1>
          <p className="mt-2 text-sm text-slate-400 sm:text-base lg:max-w-2xl">
            Quanto mais você joga, mais benefícios desbloqueia! Resgate bônus, 
            acumule pontos e suba de nível para vantagens exclusivas.
          </p>
        </div>

        <main className="space-y-10 sm:space-y-16">
          <BenefitsDashboard 
            initialSummary={summary} 
            isAuthenticated={isAuthenticated} 
          />

          <div className="border-t border-slate-800 pt-10 sm:pt-16">
            <BenefitsSection />
          </div>
        </main>

        <footer className="mt-12 border-t border-white/5 pt-6 text-center text-xs text-slate-400 sm:mt-20 sm:pt-10 sm:text-sm">
          <p>&copy; {new Date().getFullYear()} Aviator Game. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  );
}
