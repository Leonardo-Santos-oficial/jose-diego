import { 
  Zap, 
  ShieldCheck, 
  Users, 
  Gift, 
  Headphones, 
  FileCheck, 
  type LucideIcon 
} from 'lucide-react';

// Interface Segregation Principle (ISP): Defining a clear contract for the benefit data
interface Benefit {
  title: string;
  description: string;
  icon: LucideIcon;
  highlight?: boolean;
}

// Data separation (Separation of Concerns)
const benefitsData: Benefit[] = [
  {
    title: 'Saque Instantâneo',
    description: 'Não espere para aproveitar seus ganhos. Processamento automático via PIX em segundos.',
    icon: Zap,
    highlight: true,
  },
  {
    title: 'Segurança de Dados',
    description: 'Proteção total com criptografia de ponta a ponta e conformidade com LGPD.',
    icon: ShieldCheck,
  },
  {
    title: 'Comunidade VIP',
    description: 'Acesso exclusivo a grupos de estratégias e dicas com os melhores jogadores.',
    icon: Users,
  },
  {
    title: 'Bônus Diários',
    description: 'Recompensas recorrentes e missões especiais para multiplicar sua banca.',
    icon: Gift,
    highlight: true,
  },
  {
    title: 'Suporte 24/7',
    description: 'Equipe brasileira pronta para atender você a qualquer hora do dia ou da noite.',
    icon: Headphones,
  },
  {
    title: 'Jogo Justo',
    description: 'Tecnologia Provably Fair que permite auditar cada rodada independentemente.',
    icon: FileCheck,
  },
];

// Single Responsibility Principle (SRP): This component only renders a single card
function BenefitCard({ title, description, icon: Icon, highlight }: Benefit) {
  return (
    <article 
      className={`
        group relative flex flex-col gap-4 rounded-3xl border p-6 transition-all duration-300
        ${highlight 
          ? 'border-rose-500/30 bg-gradient-to-b from-rose-500/10 to-slate-900/60 hover:border-rose-500/50' 
          : 'border-white/5 bg-slate-900/60 hover:border-white/10 hover:bg-slate-900/80'
        }
      `}
    >
      <div className="flex items-center gap-4">
        <div className={`
          rounded-2xl p-3 transition-colors
          ${highlight ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800/50 text-emerald-400'}
        `}>
          <Icon className="size-6" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-slate-50 group-hover:text-white">
          {title}
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-slate-300 group-hover:text-slate-200">
        {description}
      </p>
    </article>
  );
}

// Main Component acting as a Composite of BenefitCards
export function BenefitsSection() {
  return (
    <section 
      id="beneficios" 
      className="flex flex-col gap-12 py-16"
      aria-label="Benefícios da Plataforma"
    >
      <header className="flex flex-col gap-4 text-center md:text-left">
        <div className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 md:self-start">
          <Zap className="size-3" />
          Vantagens Exclusivas
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
          Por que escolher nossa plataforma?
        </h2>
        <p className="max-w-2xl text-base text-slate-400">
          Desenvolvemos um ecossistema completo focado na experiência do jogador, 
          unindo tecnologia, segurança e as melhores oportunidades de lucro.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {benefitsData.map((benefit) => (
          <BenefitCard 
            key={benefit.title} 
            {...benefit} 
          />
        ))}
      </div>
    </section>
  );
}
