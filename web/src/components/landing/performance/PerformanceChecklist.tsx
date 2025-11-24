import { Zap, Lock, FileCheck } from 'lucide-react';

const checklist = [
  {
    title: 'Saques Instantâneos',
    description:
      'Receba seus ganhos via PIX em segundos, diretamente na sua conta bancária, sem burocracia.',
    icon: Zap,
    status: 'Rápido',
  },
  {
    title: 'Segurança Total',
    description:
      'Seus dados e transações são protegidos com criptografia de ponta a ponta (SSL).',
    icon: Lock,
    status: 'Seguro',
  },
  {
    title: 'Transparência',
    description:
      'Histórico de partidas auditável e resultados gerados de forma comprovadamente justa.',
    icon: FileCheck,
    status: 'Justo',
  },
];

export function PerformanceChecklist() {
  return (
    <section
      id="beneficios"
      className="rounded-[32px] border border-white/5 bg-slate-950/60 p-8"
    >
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-200">
          Confiança
        </p>
        <h2 className="text-2xl font-semibold text-slate-50">Por que somos a melhor escolha?</h2>
        <p className="text-sm text-slate-300">
          Garantimos um ambiente justo, rápido e seguro para que você só se preocupe em ganhar.
        </p>
      </header>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {checklist.map(({ icon: Icon, title, description, status }) => (
          <article
            key={title}
            className="flex h-full flex-col gap-3 rounded-2xl border border-white/5 bg-slate-900/60 p-5"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-slate-800/70 p-3 text-amber-200">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
                  {status}
                </p>
                <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
              </div>
            </div>
            <p className="text-sm text-slate-300">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
