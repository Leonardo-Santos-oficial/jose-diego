import { MousePointerClick, TrendingUp, Coins, Zap, History, MessageCircle } from 'lucide-react';

const steps = [
  {
    title: '1. Faça sua Aposta',
    description:
      'Selecione o valor que deseja apostar antes do início da rodada. Você pode fazer até duas apostas simultâneas.',
    icon: Coins,
  },
  {
    title: '2. Acompanhe o Voo',
    description:
      'O avião decola e o multiplicador começa a subir. Quanto mais alto ele for, maior será o seu prêmio.',
    icon: TrendingUp,
  },
  {
    title: '3. Retire seus Ganhos',
    description:
      'Clique em "Cash Out" antes que o avião voe para longe. Se não retirar a tempo, a aposta é perdida.',
    icon: MousePointerClick,
  },
];

const features = [
  {
    title: 'Aposta Automática',
    description:
      'Configure o jogo para apostar automaticamente o mesmo valor em todas as rodadas, sem precisar clicar a cada vez.',
    icon: Zap,
  },
  {
    title: 'Histórico de Rodadas',
    description:
      'Analise os resultados anteriores na parte superior da tela para identificar padrões e ajustar sua estratégia.',
    icon: History,
  },
  {
    title: 'Chat ao Vivo',
    description:
      'Converse com outros jogadores em tempo real, compartilhe dicas e celebre suas vitórias juntos.',
    icon: MessageCircle,
  },
];

export function HowToPlay() {
  return (
    <section id="como-funciona" className="flex flex-col gap-20 py-10">
      <div className="flex flex-col gap-10">
        <header className="space-y-3 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-400">
            Tutorial Rápido
          </p>
          <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
            Aprenda a jogar em 3 passos simples
          </h2>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            O Aviator é fácil de entender e emocionante de jogar. Siga estes passos e comece a ganhar hoje mesmo.
          </p>
        </header>

        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article
                key={step.title}
                className="relative flex flex-col gap-4 rounded-3xl border border-white/5 bg-slate-900/60 p-6 transition-colors hover:bg-slate-900/80"
              >
                <div className="absolute -top-3 -right-3 flex size-8 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-400 ring-4 ring-slate-950">
                  {index + 1}
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl bg-slate-800/70 p-3 text-emerald-400">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="text-lg font-semibold text-slate-50">{step.title}</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-10">
        <header className="space-y-3 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-400">
            Funcionalidades
          </p>
          <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
            Ferramentas para maximizar seus ganhos
          </h2>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Use as ferramentas profissionais do Aviator para criar estratégias vencedoras e automatizar seus lucros.
          </p>
        </header>

        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-slate-900/40 p-6 transition-colors hover:bg-slate-900/60"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl bg-slate-800/50 p-3 text-rose-400">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="text-lg font-semibold text-slate-50">{feature.title}</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
