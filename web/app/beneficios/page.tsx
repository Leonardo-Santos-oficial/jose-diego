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
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8 flex items-center justify-between">
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

        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Crown className="size-3" />
            Programa de Benefícios
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Seus Benefícios Exclusivos
          </h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Quanto mais você joga, mais benefícios desbloqueia! Resgate bônus, 
            acumule pontos e suba de nível para vantagens exclusivas.
          </p>
        </div>

        <main className="space-y-16">
          <BenefitsDashboard 
            initialSummary={summary} 
            isAuthenticated={isAuthenticated} 
          />

          <div className="border-t border-slate-800 pt-16">
            <BenefitsSection />
          </div>
        </main>

        <footer className="mt-20 border-t border-white/5 pt-10 text-center text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} Aviator Game. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  );
}
