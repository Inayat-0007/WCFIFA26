// ─── Auth Types ──────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  isAdmin: boolean;
  totalPoints: number;
  createdAt: string;
  updatedAt?: string;
  _count?: { memberships: number; fantasyTeams: number };
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ─── League Types ─────────────────────────────────────────────────────────────
export interface League {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  maxMembers: number;
  createdAt: string;
  owner?: Pick<User, 'id' | 'name' | 'avatar'>;
  members?: LeagueMember[];
  _count?: { members: number };
}

export interface LeagueMember {
  id: string;
  leagueId: string;
  userId: string;
  joinedAt: string;
  user: Pick<User, 'id' | 'name' | 'avatar' | 'totalPoints'>;
}

// ─── Match Types ──────────────────────────────────────────────────────────────
export type MatchStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'POSTPONED';
export type EventType = 'GOAL' | 'ASSIST' | 'YELLOW_CARD' | 'RED_CARD' | 'PENALTY_MISS' | 'CLEAN_SHEET' | 'SUBSTITUTION';

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag?: string;
  awayFlag?: string;
  group?: string;
  round: string;
  kickoffTime: string;
  venue?: string;
  city?: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  minute?: number;
  events?: MatchEvent[];
  matchPlayers?: MatchPlayer[];
  hasUserTeam?: boolean;
  _count?: { events: number; fantasyTeams: number };
}

export interface MatchEvent {
  id: string;
  matchId: string;
  playerId?: string;
  type: EventType;
  minute: number;
  detail?: string;
  createdAt: string;
}

// ─── Player Types ─────────────────────────────────────────────────────────────
export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  id: string;
  name: string;
  displayName?: string;
  country: string;
  countryCode?: string;
  position: Position;
  image?: string;
  price: number;
  basePoints: number;
  matchPlayers?: MatchPlayer[];
}

export interface MatchPlayer {
  id: string;
  matchId: string;
  playerId: string;
  fantasyPoints: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  cleanSheet: boolean;
  penaltyMisses: number;
  player?: Player;
}

// ─── Fantasy Team Types ───────────────────────────────────────────────────────
export interface FantasyTeam {
  id: string;
  userId: string;
  matchId: string;
  captainId: string;
  viceCaptainId: string;
  totalPoints: number;
  budgetUsed: number;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  teamPlayers: TeamPlayer[];
  match?: Pick<Match, 'status' | 'kickoffTime' | 'homeTeam' | 'awayTeam'>;
}

export interface TeamPlayer {
  id: string;
  fantasyTeamId: string;
  playerId: string;
  player: Player & { matchPlayers?: Pick<MatchPlayer, 'fantasyPoints' | 'goals' | 'assists'>[] };
}

// ─── Leaderboard Types ────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string | null;
  totalPoints: number;
  matchesPlayed?: number;
  teamId?: string;
}

// ─── Notification Types ───────────────────────────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
