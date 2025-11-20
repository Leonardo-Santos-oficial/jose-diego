const links = [
  { label: 'Início', href: '/', description: 'Landing e onboarding' },
  { label: 'Jogo Aviator', href: '/app', description: 'Área autenticada' },
  { label: 'Perfil', href: '/profile', description: 'Atualize dados e Pix' },
  { label: 'Painel Admin', href: '/admin', description: 'Operações internas' },
  {
    label: 'Apostas',
    href: '/admin/bets',
    description: 'Histórico global',
  },
  {
    label: 'Saques',
    href: '/admin/withdrawals',
    description: 'Aprovação de solicitações',
  },
];

type SidebarNavProps = {
  isAuthenticated: boolean;
};

export function SidebarNav({ isAuthenticated }: SidebarNavProps) {
  return (
    <aside
      className="flex h-full min-w-[280px] flex-col gap-3 border-r border-slate-800/60 bg-slate-950/80 p-6 shadow-inner lg:min-h-screen"
      aria-label="Navegação principal"
    >
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          aria-disabled={!isAuthenticated && link.href !== '/'}
          className="rounded-2xl border border-transparent bg-slate-900/70 px-5 py-4 text-slate-100 transition hover:-translate-y-0.5 hover:border-teal-300/60 focus-visible:border-teal-300/60 focus-visible:outline-none aria-disabled:pointer-events-none aria-disabled:opacity-40"
        >
          <span className="text-base font-semibold">{link.label}</span>
          <small className="block text-sm text-slate-300">{link.description}</small>
        </a>
      ))}
    </aside>
  );
}
