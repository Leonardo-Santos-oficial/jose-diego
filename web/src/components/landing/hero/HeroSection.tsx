import { Button } from '@/components/components/ui/button';

type HeroSectionProps = {
  onAuthRequest?: () => void;
  isAuthenticated?: boolean;
};

const heroStats = [
  { label: 'Jogadores Online', value: '5.2k' },
  { label: 'Apostas Realizadas', value: '1.2M+' },
  { label: 'Maior Multiplicador', value: '500x' },
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
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-500">
          O Jogo Crash #1 do Mundo
        </p>
        <h1
          id="hero-heading"
          className="text-2xl font-semibold leading-tight text-slate-50 sm:text-4xl lg:text-5xl"
        >
          Decole para a Vitória no Aviator: Onde Você Controla a Sorte!
        </h1>
        <p className="max-w-4xl text-sm text-slate-200 sm:text-lg">
          Sinta a adrenalina subir junto com o avião. Faça sua aposta, observe o multiplicador crescer e decida o momento exato de saltar antes que ele voe para longe. Estratégia, emoção e diversão instantânea esperam por você.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          {!isAuthenticated && (
            <Button
              size="lg"
              onClick={onAuthRequest}
              className="w-full rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-orange-400 px-8 py-3 text-base font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-rose-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 sm:w-auto"
            >
              JOGAR AGORA GRÁTIS
            </Button>
          )}
          <a
            href="#como-funciona"
            className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-slate-700/60 bg-slate-900/60 px-6 py-3 text-base font-medium text-slate-100 shadow-sm backdrop-blur-xl transition-colors hover:bg-slate-900/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 sm:w-auto [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
          >
            Como Jogar
          </a>
        </div>
        <div className="mt-6 grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/5 bg-slate-900/60 px-5 py-4 backdrop-blur-sm"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                {stat.label}
              </p>
              <p className="text-xl font-bold text-rose-500">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
