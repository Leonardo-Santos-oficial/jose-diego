import { Gauge, Image as ImageIcon, FileCheck } from 'lucide-react';

const checklist = [
  {
    title: 'Metadata completa',
    description:
      'Open Graph, Twitter Cards e canonical configurados em app/layout.tsx para boost de SEO.',
    icon: Gauge,
    status: 'Feito',
  },
  {
    title: 'Imagens otimizadas',
    description:
      'Logos e pôster do hero servidos via /public com Next/Image e poster no elemento <video>.',
    icon: ImageIcon,
    status: 'Feito',
  },
  {
    title: 'Auditoria Lighthouse',
    description:
      'Script npm run lighthouse:landing coleta relatório HTML (./test-results/lighthouse-report.html).',
    icon: FileCheck,
    status: 'Script pronto',
  },
];

export function PerformanceChecklist() {
  return (
    <section
      id="performance"
      className="rounded-[32px] border border-white/5 bg-slate-950/60 p-8"
    >
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-200">
          Performance & SEO
        </p>
        <h2 className="text-2xl font-semibold text-slate-50">Checklist auditável</h2>
        <p className="text-sm text-slate-300">
          Execute o script Lighthouse sempre que atualizar a landing para garantir scores
          &gt; 90 nas categorias principais.
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
