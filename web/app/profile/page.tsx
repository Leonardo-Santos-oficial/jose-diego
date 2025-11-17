import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { getCurrentSession } from '@/lib/auth/session';
import { getUserProfile } from '@/modules/profile/server/getUserProfile';

export const metadata: Metadata = {
  title: 'Perfil do Jogador',
  description: 'Atualize seu nome de exibição e chave Pix para saques simulados.',
};

export default async function ProfilePage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/');
  }

  const profile = await getUserProfile(session.user.id);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <ProfileForm
        initialDisplayName={profile.displayName}
        initialPixKey={profile.pixKey}
        userEmail={session.user.email ?? ''}
      />
    </div>
  );
}
