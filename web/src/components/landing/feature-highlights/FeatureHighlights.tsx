import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/components/ui/card';

const highlights = [
  {
    title: 'Saldo em tempo real',
    body: 'Wallet virtual sincronizada com Supabase usando ações de servidor e RLS.',
    tag: 'US-201 · REQ-SEC-11',
  },
  {
    title: 'RTP controlado',
    body: 'Loop do Aviator com algoritmo configurável e histórico colorido (US-307).',
    tag: 'US-304/307',
  },
  {
    title: 'Chat WSS',
    body: 'Suporte administrador/usuário com persistência e notificações em WSS seguro.',
    tag: 'US-401 · REQ-SEC-07',
  },
];

export function FeatureHighlights() {
  return (
    <section id="como-funciona" className="flex flex-col gap-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">
          Como o demo funciona
        </p>
        <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
          Arquitetura pensada para Clean Code e SOLID.
        </h2>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map((item) => (
          <Card key={item.title} className="border-slate-700/60 bg-slate-900/70">
            <CardHeader>
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-300">
                {item.tag}
              </span>
              <CardTitle className="mt-2 text-lg text-slate-50">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-300">{item.body}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
