import { Button } from '@/components/components/ui/button';

type HeroSectionProps = {
  onAuthRequest?: () => void;
  isAuthenticated?: boolean;
};

const heroStats = [
  { label: 'Latência média do realtime', value: '< 80 ms' },
  { label: 'Testes Lighthouse desktop', value: '90+ score' },
  { label: 'Usuários simultâneos simulados', value: '5k' },
];

export function HeroSection({ onAuthRequest, isAuthenticated }: HeroSectionProps) {
  return (
    <section
      className="relative isolate min-h-[480px] overflow-hidden rounded-[24px] border border-white/5 shadow-[0_25px_80px_rgba(2,6,23,0.9)] sm:min-h-[540px] sm:rounded-[32px]"
      aria-labelledby="hero-heading"
    >
      <video
        className="absolute inset-0 size-full object-cover opacity-40 saturate-[0.85] blur-[0.5px]"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/aviator/images/img_bg.png"
        aria-hidden
      >
        <source src="/aviator/videos/hero.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-950/70 to-transparent" />
      <div className="relative z-10 flex flex-col gap-6 px-5 py-10 sm:px-12 sm:py-16 lg:px-20">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-200">
          Demo Aviator · RTP 97% · Infra global
        </p>
        <h1
          id="hero-heading"
          className="text-2xl font-semibold leading-tight text-slate-50 sm:text-4xl lg:text-5xl"
        >
          Experimente o crash game com vídeo hero responsivo e telemetria em tempo real.
        </h1>
        <p className="max-w-4xl text-sm text-slate-200 sm:text-lg">
          Cadastre-se, receba créditos fictícios, teste o Aviator com até duas apostas por
          rodada e converse com o suporte em tempo real. Nenhum pagamento real é
          processado, mas toda a experiência replica o core banking e os guardrails de
          segurança do PRD.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          {!isAuthenticated && (
            <Button
              size="lg"
              onClick={onAuthRequest}
              className="w-full rounded-full bg-gradient-to-r from-rose-500 via-rose-400 to-orange-300 px-8 py-3 text-base font-semibold text-slate-950 shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:ring-offset-2 sm:w-auto"
            >
              Login / Cadastrar
            </Button>
          )}
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="w-full rounded-full border border-slate-700/60 bg-slate-900/60 px-6 py-3 text-base text-slate-100 backdrop-blur-xl hover:bg-slate-900/80 sm:w-auto"
          >
            <a href="#institucional">Ver como funciona</a>
          </Button>
        </div>
        <div className="mt-6 grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/5 bg-slate-900/60 px-5 py-4"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                {stat.label}
              </p>
              <p className="text-xl font-semibold text-slate-50">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
