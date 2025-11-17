import { LandingContent } from '@/components/landing/LandingContent';
import { getCurrentSession, getDisplayName } from '@/lib/auth/session';

export default async function HomePage() {
  const session = await getCurrentSession();
  const displayName = getDisplayName(session);

  return (
    <LandingContent isAuthenticated={Boolean(session)} displayName={displayName} />
  );
}
