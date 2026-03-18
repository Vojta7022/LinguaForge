import { useEffect } from 'react';
import { useSRSStore } from '@/stores/srsStore';
import { useAuthStore } from '@/stores/authStore';

export function useSRS() {
  const { dueCards, dueCount, isLoading, loadDueCards, recordReview } = useSRSStore();
  const { session } = useAuthStore();

  useEffect(() => {
    if (session?.user_id) {
      loadDueCards(session.user_id);
    }
  }, [session?.user_id, loadDueCards]);

  return { dueCards, dueCount, isLoading, recordReview };
}
