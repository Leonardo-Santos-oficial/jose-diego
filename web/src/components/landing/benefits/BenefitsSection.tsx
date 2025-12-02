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
        group relative flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-300 sm:gap-4 sm:rounded-3xl sm:p-6
        ${highlight 
          ? 'border-rose-500/30 bg-gradient-to-b from-rose-500/10 to-slate-900/60 hover:border-rose-500/50' 
          : 'border-white/5 bg-slate-900/60 hover:border-white/10 hover:bg-slate-900/80'
        }
      `}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`
          rounded-xl p-2.5 transition-colors sm:rounded-2xl sm:p-3
          ${highlight ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800/50 text-emerald-400'}
        `}>
          <Icon className="size-5 sm:size-6" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-slate-50 group-hover:text-white sm:text-lg">
          {title}
        </h3>
      </div>
      <p className="text-xs leading-relaxed text-slate-300 group-hover:text-slate-200 sm:text-sm">
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
      className="flex flex-col gap-8 py-8 sm:gap-12 sm:py-16"
      aria-label="Benefícios da Plataforma"
    >
      <header className="flex flex-col gap-3 text-center sm:gap-4 md:text-left">
        <div className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 sm:px-4 sm:py-1.5 sm:text-xs md:self-start">
          <Zap className="size-3" />
          Vantagens Exclusivas
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl lg:text-4xl">
          Por que escolher nossa plataforma?
        </h2>
        <p className="text-sm text-slate-400 sm:text-base lg:max-w-2xl">
          Desenvolvemos um ecossistema completo focado na experiência do jogador, 
          unindo tecnologia, segurança e as melhores oportunidades de lucro.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
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
