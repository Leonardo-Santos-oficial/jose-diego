import Link from 'next/link';

type Shortcut = {
  label: string;
  description: string;
  status: string;
  href: string;
  action?: 'auth-required';
};

const shortcuts: Shortcut[] = [
  { label: 'Aviator', description: 'Crash game', status: 'Disponível', href: '/app' },
  {
    label: 'Carteira',
    description: 'Saldo virtual',
    status: 'Em construção',
    href: '/app',
    action: 'auth-required',
  },
  { label: 'Admin', description: 'Controle total', status: 'Protegido', href: '/admin' },
];

type ShortcutRailProps = {
  isAuthenticated: boolean;
  onAuthRequest: () => void;
};

function ShortcutCard({
  label,
  description,
  status,
  href,
  action,
  isAuthenticated,
  onAuthRequest,
}: Shortcut & ShortcutRailProps) {
  const cardContent = (
    <>
      <span className="text-base font-semibold">{label}</span>
      <span className="text-sm text-slate-300">{description}</span>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-200">
        {status}
      </span>
    </>
  );

  const className =
    'group flex min-w-[160px] flex-col gap-1 rounded-2xl border border-transparent bg-slate-900/70 px-5 py-4 text-slate-100 transition duration-150 hover:-translate-y-0.5 hover:border-rose-300/60 focus-visible:border-rose-300/60 focus-visible:outline-none sm:min-w-0';

  if (action === 'auth-required' && !isAuthenticated) {
    return (
      <button type="button" onClick={onAuthRequest} className={className}>
        {cardContent}
      </button>
    );
  }

  return (
    <Link href={href} className={className} prefetch={false}>
      {cardContent}
    </Link>
  );
}

export function ShortcutRail({ isAuthenticated, onAuthRequest }: ShortcutRailProps) {
  return (
    <aside
      aria-label="Atalhos para módulos"
      className="flex snap-x snap-mandatory gap-4 overflow-x-auto border-b border-slate-700/30 bg-slate-950/80 px-4 py-6 backdrop-blur-2xl scrollbar-hide md:sticky md:top-4 md:grid md:grid-cols-1 md:border-b-0 md:border-r md:px-6 md:py-8"
    >
      {shortcuts.map((shortcut) => (
        <div key={shortcut.label} className="snap-start">
          <ShortcutCard
            {...shortcut}
            isAuthenticated={isAuthenticated}
            onAuthRequest={onAuthRequest}
          />
        </div>
      ))}
    </aside>
  );
}
