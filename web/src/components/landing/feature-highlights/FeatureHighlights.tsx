import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/components/ui/card';

const highlights = [
  {
    title: 'Controle Total',
    body: 'Você decide quando parar. Retire seus ganhos a qualquer momento antes do avião voar para longe.',
    tag: 'ESTRATÉGIA',
  },
  {
    title: 'Multiplicadores Altos',
    body: 'O céu é o limite! Veja sua aposta multiplicar 10x, 100x ou até mais em questão de segundos.',
    tag: 'LUCRO',
  },
  {
    title: 'Chat Ao Vivo',
    body: 'Converse com outros jogadores, compartilhe estratégias e celebre as grandes vitórias juntos.',
    tag: 'SOCIAL',
  },
];

export function FeatureHighlights() {
  return (
    <section id="como-funciona" className="flex flex-col gap-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-400">
          Por que jogar Aviator?
        </p>
        <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
          Mais do que um jogo, uma experiência de pura emoção.
        </h2>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map((item) => (
          <Card key={item.title} className="border-slate-700/60 bg-slate-900/70 hover:border-rose-500/30 transition-colors">
            <CardHeader>
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">
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
