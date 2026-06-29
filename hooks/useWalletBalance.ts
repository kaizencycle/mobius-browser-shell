import { useAsyncData } from './useAsyncData';
import { fetchWalletBalance, getCachedWalletBalance } from '../src/lib/api/cpc';
import { getOnboardingState } from '../src/lib/storage';

export function useWalletBalance(civicId?: string | null) {
  const id = civicId ?? getOnboardingState().civic_id;

  return useAsyncData(
    async () => {
      if (!id) return null;
      const live = await fetchWalletBalance(id);
      if (live) return live;
      return getCachedWalletBalance(id);
    },
    [id],
    60_000,
  );
}
