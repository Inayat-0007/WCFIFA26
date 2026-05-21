import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { LeaderboardEntry } from '@/types';

interface UseLeaderboardOptions {
  matchId?: string;
  leagueId?: string;
  limit?: number;
}

interface UseLeaderboardReturn {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useLeaderboard(options: UseLeaderboardOptions = {}): UseLeaderboardReturn {
  const { matchId, leagueId, limit = 50 } = options;
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      let url = `/leaderboard/global?limit=${limit}`;
      if (matchId) url = `/leaderboard/match/${matchId}`;
      else if (leagueId) url = `/leaderboard/league/${leagueId}`;
      const res = await api.get(url);
      setEntries(res.data.data || []);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [matchId, leagueId, limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { entries, isLoading, error, refresh: fetchLeaderboard };
}
