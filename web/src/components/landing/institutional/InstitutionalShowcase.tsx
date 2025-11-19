import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { ShieldCheck, Cpu, Headphones } from 'lucide-react';

const clusters: Array<{
  title: string;
  description: string;
  stat: string;
  caption: string;
  icon: LucideIcon;
  bullets: string[];
}> = [
  {
    title: 'Governança e Compliance',
    description:
      'Fluxos de saque aprovados apenas por sessões com papel admin e auditoria Supabase.',
    stat: 'RLS 100%',
    caption: 'Cobertura de políticas',
    icon: ShieldCheck,
    bullets: ['RLS em wallets/withdraw', 'Alertas Slack pg_net', 'Auditoria por trigger'],
  },
  {
    title: 'Resiliência e Infraestrutura',
    description:
      'Proxy Edge + Next.js 16 com Supabase Realtime configurado para baixa latência.',
    stat: '99.95%',
    caption: 'Objetivo de uptime',
    icon: Cpu,
    bullets: ['Proxy consolidado', 'Cache controlado', 'Loop Aviator serverless'],
  },
  {
    title: 'Suporte e Operações',
    description: 'Inbox admin com chat WSS, status de saques e telemetria de jogadores.',
    stat: '3 canais',
    caption: 'Chat, saldo, auditoria',
    icon: Headphones,
    bullets: ['Chat admin/user', 'Timeline realtime', 'Playwright E2E'],
  },
];

const partners = [
  {
    name: 'HUD demo',
    src: '/aviator/images/img_logo_3-default-000.png',
    width: 140,
    height: 36,
  },
  {
    name: 'HUD progress',
    src: '/aviator/images/img_hudprogressbar-default-001.png',
    width: 120,
    height: 32,
  },
  {
    name: 'Plane',
    src: '/aviator/images/plane.png',
    width: 90,
    height: 36,
  },
];

export function InstitutionalShowcase() {
  return (
    <section id="institucional" className="flex flex-col gap-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-200">
          Institucional
        </p>
        <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
          Infra pronta para demos executivas e due diligence.
        </h2>
        <p className="max-w-3xl text-sm text-slate-300 sm:text-base">
          Cada pilar reutiliza os mesmos componentes de autenticação, modal e Supabase
          client, mostrando como o PRD mantém consistência visual e operacional.
        </p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {clusters.map(({ icon: Icon, ...cluster }) => (
          <article
            key={cluster.title}
            className="flex h-full flex-col gap-4 rounded-3xl border border-white/5 bg-slate-900/60 p-6"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-slate-800/70 p-3 text-emerald-200">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-300">
                  {cluster.caption}
                </p>
                <p className="text-2xl font-semibold text-slate-50">{cluster.stat}</p>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-50">{cluster.title}</h3>
              <p className="text-sm text-slate-300">{cluster.description}</p>
            </div>
            <ul className="mt-auto space-y-2 text-sm text-slate-200">
              {cluster.bullets.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-300" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-6 rounded-3xl border border-white/5 bg-slate-950/60 px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
          Assets otimizados
        </p>
        {partners.map((partner) => (
          <Image
            key={partner.name}
            src={partner.src}
            alt={partner.name}
            width={partner.width}
            height={partner.height}
            className="h-auto w-auto opacity-80 drop-shadow"
            priority={partner.name === 'HUD demo'}
          />
        ))}
      </div>
    </section>
  );
}
