import { useEffect } from 'react';
import { useSRSStore } from '@/stores/srsStore';
import { useAuthStore } from '@/stores/authStore';

export function useSRS() {
  const { dueCards, dueCount, isLoading, loadDueCards, recordReview } = useSRSStore();
  const { session } = useAuthStore();

  useEffect(() => {
    if (session?.user.id) {
      loadDueCards(session.user.id);
    }
  }, [session?.user.id, loadDueCards]);

  return { dueCards, dueCount, isLoading, recordReview };
}
