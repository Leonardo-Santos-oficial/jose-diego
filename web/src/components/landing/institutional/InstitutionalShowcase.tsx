import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { ShieldCheck, Cpu, Headphones, Users, Banknote, TrendingUp } from 'lucide-react';

const clusters: Array<{
  title: string;
  description: string;
  stat: string;
  caption: string;
  icon: LucideIcon;
  bullets: string[];
}> = [
  {
    title: 'Dinheiro Virtual',
    description:
      'Comece com saldo fictício para treinar suas habilidades sem arriscar seu bolso.',
    stat: 'Grátis',
    caption: 'Modo Demo',
    icon: ShieldCheck,
    bullets: ['Sem depósito real', 'Recarregue quando quiser', 'Treine estratégias'],
  },
  {
    title: 'Tecnologia de Ponta',
    description:
      'Jogue sem travamentos, com gráficos leves e resposta instantânea em qualquer dispositivo.',
    stat: '100%',
    caption: 'Fluidez',
    icon: Cpu,
    bullets: ['Roda no celular', 'Baixo consumo de dados', 'Carregamento rápido'],
  },
  {
    title: 'Suporte Dedicado',
    description: 'Dúvidas sobre como jogar? Nossa equipe está pronta para ajudar no chat.',
    stat: '24/7',
    caption: 'Atendimento',
    icon: Headphones,
    bullets: ['Chat ao vivo', 'Dicas de jogo', 'Comunidade ativa'],
  },
];

const liveStats = [
  {
    label: 'Jogadores Online',
    value: '+5.2k',
    icon: Users,
    color: 'text-blue-400',
  },
  {
    label: 'Pago em 24h',
    value: 'R$ 1.2M+',
    icon: Banknote,
    color: 'text-emerald-400',
  },
  {
    label: 'Maior Vela Hoje',
    value: '1.500x',
    icon: TrendingUp,
    color: 'text-rose-400',
  },
];

export function InstitutionalShowcase() {
  return (
    <section id="institucional" className="flex flex-col gap-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-400">
          Recursos Exclusivos
        </p>
        <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
          Tudo o que você precisa para se divertir com segurança.
        </h2>
        <p className="max-w-3xl text-sm text-slate-300 sm:text-base">
          Nossa plataforma foi desenhada para oferecer a melhor experiência de jogo possível, focada na diversão e na comunidade.
        </p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {clusters.map(({ icon: Icon, ...cluster }) => (
          <article
            key={cluster.title}
            className="flex h-full flex-col gap-4 rounded-3xl border border-white/5 bg-slate-900/60 p-6 hover:bg-slate-900/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-slate-800/70 p-3 text-emerald-400">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
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
      <div className="flex flex-wrap items-center gap-8 rounded-3xl border border-white/5 bg-slate-950/60 px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Ao Vivo
        </p>
        <div className="flex flex-1 flex-wrap items-center justify-between gap-6">
          {liveStats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className={`rounded-full bg-slate-900 p-2 ${stat.color}`}>
                <stat.icon className="size-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-50 leading-none">{stat.value}</p>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
