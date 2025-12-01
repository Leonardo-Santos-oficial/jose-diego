import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { getCurrentSession } from '@/lib/auth/session';
import { getUserProfile } from '@/modules/profile/server/getUserProfile';

export const metadata: Metadata = {
  title: 'Perfil do Jogador',
  description: 'Atualize seu nome de exibição e dados para saque.',
};

export default async function ProfilePage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/');
  }

  const profile = await getUserProfile(session.id);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-3 sm:gap-6 sm:p-4 md:p-8">
      <ProfileForm
        userId={session.id}
        initialDisplayName={profile.displayName}
        initialPixKey={profile.pixKey}
        initialPreferredMethod={profile.preferredWithdrawMethod}
        initialBankAccount={profile.bankAccount}
        initialAvatarUrl={profile.avatarUrl}
        userEmail={session.email ?? ''}
      />
    </div>
  );
}
