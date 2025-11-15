import { Button } from '@/components/components/ui/button';

type HeroSectionProps = {
  onAuthRequest?: () => void;
};

export function HeroSection({ onAuthRequest }: HeroSectionProps) {
  return (
    <section className="relative isolate min-h-[520px] overflow-hidden rounded-[32px] shadow-[0_25px_80px_rgba(2,6,23,0.9)]">
      <video
        className="absolute inset-0 size-full object-cover opacity-35 saturate-[0.6] blur-[1px]"
        autoPlay
        loop
        muted
        playsInline
        poster="https://images.unsplash.com/photo-1470104240373-bc1812eddc9f?auto=format&fit=crop&w=1200&q=60"
      >
        <source
          src="https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4"
          type="video/mp4"
        />
      </video>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-transparent" />
      <div className="relative z-10 flex flex-col gap-6 px-6 py-12 sm:px-12 sm:py-16 lg:px-20">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-200">
          Demo Aviator · RTP 97%
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl lg:text-5xl">
          Experimente o crash game com saldo virtual e controle total.
        </h1>
        <p className="max-w-3xl text-base text-slate-200 sm:text-lg">
          Cadastre-se, receba créditos fictícios, teste o Aviator com até duas apostas por
          rodada e converse com o suporte em tempo real. Nenhum pagamento real é
          processado.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button
            size="lg"
            onClick={onAuthRequest}
            className="rounded-full bg-gradient-to-r from-rose-500 via-rose-400 to-orange-300 px-8 py-3 text-base font-semibold text-slate-950 shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            Login / Cadastrar
          </Button>
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="rounded-full border border-slate-700/60 bg-slate-900/60 px-6 py-3 text-base text-slate-100 backdrop-blur-xl hover:bg-slate-900/80"
          >
            <a href="#como-funciona">Ver como funciona</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
