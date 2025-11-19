import { Button } from '@/components/components/ui/button';

type CallToActionStripProps = {
  onAuthRequest?: () => void;
};

export function CallToActionStrip({ onAuthRequest }: CallToActionStripProps) {
  return (
    <section className="rounded-[32px] border border-rose-200/20 bg-gradient-to-r from-rose-500/20 via-orange-400/10 to-yellow-300/10 px-8 py-10">
      <div className="flex flex-col gap-6 text-slate-50 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-200">
            Pronto para testar?
          </p>
          <h2 className="text-2xl font-semibold">
            Reabra o modal de autenticação e gere um saldo demo em segundos.
          </h2>
          <p className="text-sm text-slate-100/80">
            O mesmo CTA é usado em todo o site para garantir consistência visual e de
            métricas.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            className="w-full rounded-full bg-slate-950 px-6 py-3 text-base sm:w-auto"
            onClick={onAuthRequest}
          >
            Abrir modal
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="w-full rounded-full border-white/10 bg-white/5 px-6 py-3 text-base text-slate-100 hover:bg-white/10 hover:text-white sm:w-auto"
          >
            <a href="#performance">Checklist Lighthouse</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
