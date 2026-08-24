export interface Participant {
  id: string;
  number: string;
  name: string;
  organization?: string;
  notes?: string;
  avatarColor: string;
}

export interface ScoringCriterion {
  id: string;
  name: string;
  maxScore: number;
  weight?: number; // percentage or multiplier (default 1)
}

export interface PerformanceScore {
  criterionId: string;
  criterionName: string;
  score: number;
  maxScore: number;
}

export interface RoundWinner {
  participantId: string;
  rank: number; // 1, 2, 3, etc.
  title: string; // e.g. "Juara 1", "Juara 2", "Juara 3", "Juara Harapan 1", "Pemenang Babak", etc.
  score: number;
  notes?: string;
}

export type BracketType = 
  | 'single_elimination' 
  | 'double_elimination' 
  | 'group_stage' 
  | 'multi_heats';

export interface MatchPairing {
  id: string;
  roundId: string;
  matchNumber: number;
  title?: string; // e.g. "Match 1", "Quarterfinal A", "Semifinal 1", "Grand Final", "Sesi Gelombang 1", "Grup A"
  participant1Id?: string;
  participant2Id?: string;
  winnerId?: string;
  // Multi-participant support for Heats & Group stages (e.g. 3, 4, 6, 8 per session)
  participantIds?: string[];
  winnerIds?: string[];
  scheduledTime?: string;
  arenaOrTable?: string;
  notes?: string;
  bracketGroup?: 'winners' | 'losers' | 'group_a' | 'group_b' | 'group_c' | 'group_d' | 'heats';
}

export interface PerformedRecord {
  participantId: string;
  roundId: string;
  drawnOrder: number;
  drawnAt: string;
  scores: Record<string, number>; // criterionId -> score value
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  judgeNotes?: string;
  hasScoreEntered: boolean;
  isWinnerOrQualified?: boolean;
  winnerTitle?: string;
}

export interface TournamentRound {
  id: string;
  roundNumber: number;
  name: string; // e.g. "Babak Penyisihan", "Babak Semifinal", "Babak Final"
  status: 'waiting' | 'active' | 'completed';
  qualifiersCount: number; // How many will pass to next round
  participantIds: string[]; // Participants eligible for this round
  winners?: RoundWinner[]; // Pemenang yang ditetapkan untuk babak ini
  matchPairings?: MatchPairing[]; // Pasangan duel/head-to-head pertandingan dalam babak ini
  bracketType?: BracketType;
  participantsPerSession?: number;
  qualifiersPerSession?: number;
}

export interface Tournament {
  id: string;
  userId: string;
  name: string;
  category: string;
  description?: string;
  scoringCriteria: ScoringCriterion[];
  rounds: TournamentRound[];
  currentRoundId: string;
  participants: Participant[];
  performedRecords: PerformedRecord[];
  bracketType?: BracketType;
  participantsPerSession?: number; // e.g. 2 (1v1), 3, 4 (Kuartet), 5, 6, 8 (Sesi Panggung/Heat)
  qualifiersPerSession?: number; // e.g. 1 or 2 per heat/group
  shareCode?: string; // 6-digit sync code for cross-device access (e.g. TRN-8291)
  panitiaName?: string; // Name of panitia for easy search across devices
  creatorEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export type DrawStyle = 'slot' | 'cards' | 'wheel' | 'box';

export interface UserAuth {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}
