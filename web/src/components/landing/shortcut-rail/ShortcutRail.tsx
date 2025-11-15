import Link from 'next/link';

type Shortcut = {
  label: string;
  description: string;
  status: string;
  href: string;
};

const shortcuts: Shortcut[] = [
  { label: 'Aviator', description: 'Crash game', status: 'Disponível', href: '/app' },
  {
    label: 'Carteira',
    description: 'Saldo virtual',
    status: 'Em construção',
    href: '#wallet',
  },
  { label: 'Admin', description: 'Controle total', status: 'Protegido', href: '#admin' },
];

function ShortcutCard({ label, description, status, href }: Shortcut) {
  const card = (
    <>
      <span className="text-base font-semibold">{label}</span>
      <span className="text-sm text-slate-300">{description}</span>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-200">
        {status}
      </span>
    </>
  );

  const className =
    'group flex flex-col gap-1 rounded-2xl border border-transparent bg-slate-900/70 px-5 py-4 text-slate-100 transition duration-150 hover:-translate-y-0.5 hover:border-rose-300/60 focus-visible:border-rose-300/60 focus-visible:outline-none';

  if (href.startsWith('/')) {
    return (
      <Link href={href} className={className} prefetch={false}>
        {card}
      </Link>
    );
  }

  return (
    <a href={href} className={className}>
      {card}
    </a>
  );
}

export function ShortcutRail() {
  return (
    <aside
      aria-label="Atalhos para módulos"
      className="flex min-w-0 flex-col gap-4 border-r border-slate-700/30 bg-slate-950/80 px-6 py-8 backdrop-blur-2xl lg:sticky lg:top-0"
    >
      {shortcuts.map((shortcut) => (
        <ShortcutCard key={shortcut.label} {...shortcut} />
      ))}
    </aside>
  );
}
