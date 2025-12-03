import { getRecentModerationActions } from '@/app/actions/moderation';
import { AdminModerationDashboard } from './AdminModerationDashboard';

export async function AdminModerationSection() {
  const actions = await getRecentModerationActions();

  return <AdminModerationDashboard initialActions={actions} />;
}
