import { Participant, TournamentRound, MatchPairing, Tournament, RoundWinner, BracketType } from '../types';

export interface BracketFormatOption {
  type: BracketType;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  iconName: string;
  defaultParticipantsPerSession: number;
  allowedSessionSizes: number[];
}

export const BRACKET_FORMAT_OPTIONS: BracketFormatOption[] = [
  {
    type: 'single_elimination',
    title: 'Sistem Gugur Tunggal (Knockout 1v1)',
    subtitle: 'Duel Head-to-Head langsung',
    description: 'Pemenang setiap match 1 lawan 1 langsung melaju ke babak selanjutnya hingga Grand Final.',
    badge: 'Klasik & Cepat',
    iconName: 'Swords',
    defaultParticipantsPerSession: 2,
    allowedSessionSizes: [2]
  },
  {
    type: 'multi_heats',
    title: 'Sistem Sesi / Gelombang (Multi-Heats)',
    subtitle: 'Banyak peserta per sesi panggung/lomba',
    description: 'Cocok untuk lomba seni, vokal, pidato, tahfidz, atau lari dengan 3-8 peserta tampil per sesi.',
    badge: 'Fleksibel Sesi',
    iconName: 'Users',
    defaultParticipantsPerSession: 4,
    allowedSessionSizes: [3, 4, 5, 6, 8]
  },
  {
    type: 'group_stage',
    title: 'Sistem Grup / Pool (Group Stage)',
    subtitle: 'Penyisihan Grup lalu Gugur',
    description: 'Peserta dibagi ke Grup A, B, C, D. Peringkat terbaik dari tiap grup lolos ke babak Final.',
    badge: 'Turnamen & Pool',
    iconName: 'LayoutGrid',
    defaultParticipantsPerSession: 4,
    allowedSessionSizes: [3, 4, 5, 6]
  },
  {
    type: 'double_elimination',
    title: 'Sistem Gugur Ganda (Double Elimination)',
    subtitle: 'Bagan Pemenang & Bagan Gugur',
    description: 'Peserta yang kalah di babak awal memiliki kesempatan kedua di Losers Bracket menuju Grand Final.',
    badge: 'Kesempatan Kedua',
    iconName: 'GitFork',
    defaultParticipantsPerSession: 2,
    allowedSessionSizes: [2]
  }
];

/**
 * Main dispatcher to generate full tournament bracket rounds based on chosen format.
 */
export function generateBracketByFormat(
  participants: Participant[],
  format: BracketType = 'single_elimination',
  participantsPerSession: number = 2,
  qualifiersPerSession: number = 1
): TournamentRound[] {
  const count = participants.length;
  if (count === 0) {
    return [
      {
        id: `r_${Date.now()}_1`,
        roundNumber: 1,
        name: 'Babak Penyisihan',
        status: 'active',
        qualifiersCount: 1,
        participantIds: [],
        matchPairings: [],
        bracketType: format,
        participantsPerSession,
        qualifiersPerSession
      }
    ];
  }

  switch (format) {
    case 'multi_heats':
      return generateMultiHeatsRounds(participants, participantsPerSession || 4, qualifiersPerSession || 2);
    case 'group_stage':
      return generateGroupStageRounds(participants, participantsPerSession || 4, qualifiersPerSession || 2);
    case 'double_elimination':
      return generateDoubleEliminationRounds(participants);
    case 'single_elimination':
    default:
      return generateSingleEliminationRounds(participants);
  }
}

/**
 * Backward compatibility alias
 */
export function generateFullBracketRounds(
  participants: Participant[],
  customQualifiers?: number
): TournamentRound[] {
  return generateSingleEliminationRounds(participants);
}

/**
 * 1. Single Elimination (1v1 Binary Tree)
 */
export function generateSingleEliminationRounds(participants: Participant[]): TournamentRound[] {
  const count = participants.length;
  let capacity = 2;
  while (capacity < count) {
    capacity *= 2;
  }

  const totalRounds = Math.max(1, Math.log2(capacity));
  const rounds: TournamentRound[] = [];
  const now = Date.now();

  const getRoundName = (rIdx: number, total: number, matchCount: number) => {
    const remaining = total - 1 - rIdx;
    if (remaining === 0) return 'Babak Grand Final';
    if (remaining === 1) return 'Babak Semifinal (4 Besar)';
    if (remaining === 2) return 'Babak Perempat Final (8 Besar)';
    if (remaining === 3) return 'Babak 16 Besar';
    if (remaining === 4) return 'Babak 32 Besar';
    return `Babak ${rIdx + 1} (${matchCount * 2} Slot)`;
  };

  let currentMatchesCount = capacity / 2;
  for (let r = 0; r < totalRounds; r++) {
    const roundId = `round_${now}_${r + 1}`;
    const roundMatches: MatchPairing[] = [];

    for (let m = 0; m < currentMatchesCount; m++) {
      const matchTitle = r === totalRounds - 1
        ? 'Grand Final'
        : r === totalRounds - 2
        ? `Semifinal #${m + 1}`
        : r === totalRounds - 3
        ? `Perempat Final #${m + 1}`
        : `Duel #${m + 1}`;

      roundMatches.push({
        id: `match_${roundId}_${m + 1}`,
        roundId,
        matchNumber: m + 1,
        title: matchTitle,
        participant1Id: undefined,
        participant2Id: undefined,
        winnerId: undefined,
        bracketGroup: 'winners'
      });
    }

    rounds.push({
      id: roundId,
      roundNumber: r + 1,
      name: getRoundName(r, totalRounds, currentMatchesCount),
      status: r === 0 ? 'active' : 'waiting',
      qualifiersCount: Math.max(1, Math.floor(currentMatchesCount)),
      participantIds: r === 0 ? participants.map(p => p.id) : [],
      matchPairings: roundMatches,
      bracketType: 'single_elimination',
      participantsPerSession: 2,
      qualifiersPerSession: 1
    });

    currentMatchesCount = Math.floor(currentMatchesCount / 2);
  }

  // Populate Round 1 pairings
  const r1Matches = rounds[0].matchPairings || [];
  const numMatches = r1Matches.length;
  let pIdx = 0;

  for (let m = 0; m < numMatches; m++) {
    const match = r1Matches[m];

    if (pIdx < count) {
      match.participant1Id = participants[pIdx]?.id;
      pIdx++;
    }

    const remainingParticipants = count - pIdx;
    const remainingMatches = numMatches - (m + 1);

    if (remainingParticipants > remainingMatches && pIdx < count) {
      match.participant2Id = participants[pIdx]?.id;
      pIdx++;
    } else {
      match.participant2Id = undefined;
    }

    // Auto-advance BYE
    if (match.participant1Id && !match.participant2Id) {
      match.winnerId = match.participant1Id;

      if (rounds.length > 1) {
        const nextMIdx = Math.floor(m / 2);
        const isSlot1 = m % 2 === 0;
        const nextRound = rounds[1];

        if (nextRound && nextRound.matchPairings && nextRound.matchPairings[nextMIdx]) {
          if (isSlot1) {
            nextRound.matchPairings[nextMIdx].participant1Id = match.participant1Id;
          } else {
            nextRound.matchPairings[nextMIdx].participant2Id = match.participant1Id;
          }
          if (!nextRound.participantIds.includes(match.participant1Id)) {
            nextRound.participantIds.push(match.participant1Id);
          }
        }
      }
    }
  }

  return rounds;
}

/**
 * 2. Multi-Heats / Sesi Gelombang (e.g. 3-8 participants per session)
 */
export function generateMultiHeatsRounds(
  participants: Participant[],
  heatSize: number = 4,
  qualifiersPerHeat: number = 2
): TournamentRound[] {
  const safeHeatSize = Math.max(2, heatSize);
  const safeQualifiers = Math.min(safeHeatSize - 1, Math.max(1, qualifiersPerHeat));
  const count = participants.length;
  const now = Date.now();
  const rounds: TournamentRound[] = [];

  // Calculate Sessions for Round 1 (Penyisihan Gelombang)
  const totalHeatsR1 = Math.max(1, Math.ceil(count / safeHeatSize));
  const r1Matches: MatchPairing[] = [];
  const r1RoundId = `round_${now}_1`;

  // Distribute participants across heats
  const heatsParticipantBuckets: string[][] = Array.from({ length: totalHeatsR1 }, () => []);
  participants.forEach((p, idx) => {
    const bucketIdx = idx % totalHeatsR1;
    heatsParticipantBuckets[bucketIdx].push(p.id);
  });

  for (let h = 0; h < totalHeatsR1; h++) {
    const pIds = heatsParticipantBuckets[h];
    r1Matches.push({
      id: `heat_${r1RoundId}_${h + 1}`,
      roundId: r1RoundId,
      matchNumber: h + 1,
      title: `Sesi Gelombang #${h + 1} (${pIds.length} Peserta)`,
      participantIds: pIds,
      participant1Id: pIds[0] || undefined,
      participant2Id: pIds[1] || undefined,
      winnerIds: [],
      bracketGroup: 'heats'
    });
  }

  const r1QualifiersCount = totalHeatsR1 * safeQualifiers;

  rounds.push({
    id: r1RoundId,
    roundNumber: 1,
    name: `Babak Penyisihan Sesi (${totalHeatsR1} Gelombang)`,
    status: 'active',
    qualifiersCount: r1QualifiersCount,
    participantIds: participants.map(p => p.id),
    matchPairings: r1Matches,
    bracketType: 'multi_heats',
    participantsPerSession: safeHeatSize,
    qualifiersPerSession: safeQualifiers
  });

  // If qualifiers > heatSize, generate Semifinal / Final sessions
  if (r1QualifiersCount > safeHeatSize) {
    // Intermediate Semifinal Round
    const totalHeatsR2 = Math.max(1, Math.ceil(r1QualifiersCount / safeHeatSize));
    const r2RoundId = `round_${now}_2`;
    const r2Matches: MatchPairing[] = [];

    for (let h = 0; h < totalHeatsR2; h++) {
      r2Matches.push({
        id: `heat_${r2RoundId}_${h + 1}`,
        roundId: r2RoundId,
        matchNumber: h + 1,
        title: `Semifinal Sesi #${h + 1}`,
        participantIds: [],
        winnerIds: [],
        bracketGroup: 'heats'
      });
    }

    rounds.push({
      id: r2RoundId,
      roundNumber: 2,
      name: `Babak Semifinal (${totalHeatsR2} Sesi)`,
      status: 'waiting',
      qualifiersCount: safeHeatSize,
      participantIds: [],
      matchPairings: r2Matches,
      bracketType: 'multi_heats',
      participantsPerSession: safeHeatSize,
      qualifiersPerSession: safeQualifiers
    });

    // Grand Final Session
    const r3RoundId = `round_${now}_3`;
    rounds.push({
      id: r3RoundId,
      roundNumber: 3,
      name: 'Babak Grand Final Panggung',
      status: 'waiting',
      qualifiersCount: 1,
      participantIds: [],
      matchPairings: [
        {
          id: `heat_${r3RoundId}_final`,
          roundId: r3RoundId,
          matchNumber: 1,
          title: 'Grand Final All-Star',
          participantIds: [],
          winnerIds: [],
          bracketGroup: 'heats'
        }
      ],
      bracketType: 'multi_heats',
      participantsPerSession: safeHeatSize,
      qualifiersPerSession: 1
    });
  } else {
    // Direct Grand Final Session
    const r2RoundId = `round_${now}_2`;
    rounds.push({
      id: r2RoundId,
      roundNumber: 2,
      name: 'Babak Grand Final',
      status: 'waiting',
      qualifiersCount: 1,
      participantIds: [],
      matchPairings: [
        {
          id: `heat_${r2RoundId}_final`,
          roundId: r2RoundId,
          matchNumber: 1,
          title: 'Sesi Grand Final',
          participantIds: [],
          winnerIds: [],
          bracketGroup: 'heats'
        }
      ],
      bracketType: 'multi_heats',
      participantsPerSession: safeHeatSize,
      qualifiersPerSession: 1
    });
  }

  return rounds;
}

/**
 * 3. Group Stage / Pool (Grup A, B, C, D)
 */
export function generateGroupStageRounds(
  participants: Participant[],
  groupSize: number = 4,
  qualifiersPerGroup: number = 2
): TournamentRound[] {
  const safeGroupSize = Math.max(3, groupSize);
  const count = participants.length;
  const numGroups = Math.max(2, Math.ceil(count / safeGroupSize));
  const groupNames = ['Grup A', 'Grup B', 'Grup C', 'Grup D', 'Grup E', 'Grup F', 'Grup G', 'Grup H'];
  const now = Date.now();

  const r1RoundId = `round_${now}_1`;
  const r1Matches: MatchPairing[] = [];

  // Distribute into groups
  const groupBuckets: string[][] = Array.from({ length: numGroups }, () => []);
  participants.forEach((p, idx) => {
    groupBuckets[idx % numGroups].push(p.id);
  });

  for (let g = 0; g < numGroups; g++) {
    const pIds = groupBuckets[g];
    const gName = groupNames[g] || `Grup ${g + 1}`;
    r1Matches.push({
      id: `group_${r1RoundId}_${g + 1}`,
      roundId: r1RoundId,
      matchNumber: g + 1,
      title: `${gName} (${pIds.length} Peserta)`,
      participantIds: pIds,
      participant1Id: pIds[0] || undefined,
      participant2Id: pIds[1] || undefined,
      winnerIds: [],
      bracketGroup: `group_${String.fromCharCode(97 + (g % 4))}` as any
    });
  }

  const rounds: TournamentRound[] = [
    {
      id: r1RoundId,
      roundNumber: 1,
      name: `Babak Penyisihan Grup (${numGroups} Pool)`,
      status: 'active',
      qualifiersCount: numGroups * qualifiersPerGroup,
      participantIds: participants.map(p => p.id),
      matchPairings: r1Matches,
      bracketType: 'group_stage',
      participantsPerSession: safeGroupSize,
      qualifiersPerSession: qualifiersPerGroup
    }
  ];

  // Knockout Stage: Semifinal & Final
  const r2RoundId = `round_${now}_2`;
  const semiMatches: MatchPairing[] = [];
  const semiCount = Math.max(1, Math.floor((numGroups * qualifiersPerGroup) / 2));

  for (let s = 0; s < semiCount; s++) {
    semiMatches.push({
      id: `knockout_${r2RoundId}_${s + 1}`,
      roundId: r2RoundId,
      matchNumber: s + 1,
      title: `Knockout Duel #${s + 1}`,
      participant1Id: undefined,
      participant2Id: undefined,
      winnerId: undefined,
      bracketGroup: 'winners'
    });
  }

  rounds.push({
    id: r2RoundId,
    roundNumber: 2,
    name: 'Babak Playoff Knockout',
    status: 'waiting',
    qualifiersCount: Math.max(2, semiCount),
    participantIds: [],
    matchPairings: semiMatches,
    bracketType: 'group_stage',
    participantsPerSession: 2,
    qualifiersPerSession: 1
  });

  // Grand Final
  const r3RoundId = `round_${now}_3`;
  rounds.push({
    id: r3RoundId,
    roundNumber: 3,
    name: 'Babak Grand Final',
    status: 'waiting',
    qualifiersCount: 1,
    participantIds: [],
    matchPairings: [
      {
        id: `knockout_${r3RoundId}_final`,
        roundId: r3RoundId,
        matchNumber: 1,
        title: 'Championship Grand Final',
        participant1Id: undefined,
        participant2Id: undefined,
        winnerId: undefined,
        bracketGroup: 'winners'
      }
    ],
    bracketType: 'group_stage',
    participantsPerSession: 2,
    qualifiersPerSession: 1
  });

  return rounds;
}

/**
 * 4. Double Elimination (Winners & Losers Brackets)
 */
export function generateDoubleEliminationRounds(participants: Participant[]): TournamentRound[] {
  const count = participants.length;
  let capacity = 2;
  while (capacity < count) {
    capacity *= 2;
  }

  const now = Date.now();
  const r1RoundId = `round_${now}_1`;
  const r1Matches: MatchPairing[] = [];
  const numMatches = capacity / 2;

  // Round 1: Upper Bracket
  let pIdx = 0;
  for (let m = 0; m < numMatches; m++) {
    const p1 = pIdx < count ? participants[pIdx]?.id : undefined;
    pIdx++;
    const remaining = count - pIdx;
    const remainingMatches = numMatches - (m + 1);
    const p2 = (remaining > remainingMatches && pIdx < count) ? participants[pIdx]?.id : undefined;
    if (p2) pIdx++;

    r1Matches.push({
      id: `de_w_${r1RoundId}_${m + 1}`,
      roundId: r1RoundId,
      matchNumber: m + 1,
      title: `Winners R1 Match #${m + 1}`,
      participant1Id: p1,
      participant2Id: p2,
      winnerId: (p1 && !p2) ? p1 : undefined,
      bracketGroup: 'winners'
    });
  }

  const rounds: TournamentRound[] = [
    {
      id: r1RoundId,
      roundNumber: 1,
      name: 'Winners Bracket Round 1',
      status: 'active',
      qualifiersCount: numMatches,
      participantIds: participants.map(p => p.id),
      matchPairings: r1Matches,
      bracketType: 'double_elimination',
      participantsPerSession: 2,
      qualifiersPerSession: 1
    }
  ];

  // Round 2: Losers Bracket R1 & Winners Semis
  const r2RoundId = `round_${now}_2`;
  const r2Matches: MatchPairing[] = [];

  // Winners Semis
  for (let w = 0; w < Math.max(1, Math.floor(numMatches / 2)); w++) {
    r2Matches.push({
      id: `de_w_${r2RoundId}_${w + 1}`,
      roundId: r2RoundId,
      matchNumber: w + 1,
      title: `Winners Semifinal #${w + 1}`,
      participant1Id: undefined,
      participant2Id: undefined,
      bracketGroup: 'winners'
    });
  }

  // Losers Round
  for (let l = 0; l < Math.max(1, Math.floor(numMatches / 2)); l++) {
    r2Matches.push({
      id: `de_l_${r2RoundId}_${l + 1}`,
      roundId: r2RoundId,
      matchNumber: l + 1 + Math.floor(numMatches / 2),
      title: `Losers Bracket Match #${l + 1}`,
      participant1Id: undefined,
      participant2Id: undefined,
      bracketGroup: 'losers'
    });
  }

  rounds.push({
    id: r2RoundId,
    roundNumber: 2,
    name: 'Babak Semifinal & Losers Round',
    status: 'waiting',
    qualifiersCount: 4,
    participantIds: [],
    matchPairings: r2Matches,
    bracketType: 'double_elimination',
    participantsPerSession: 2,
    qualifiersPerSession: 1
  });

  // Grand Final
  const r3RoundId = `round_${now}_3`;
  rounds.push({
    id: r3RoundId,
    roundNumber: 3,
    name: 'Babak Grand Final',
    status: 'waiting',
    qualifiersCount: 1,
    participantIds: [],
    matchPairings: [
      {
        id: `de_gf_${r3RoundId}_1`,
        roundId: r3RoundId,
        matchNumber: 1,
        title: 'Grand Final (Winners Champion vs Losers Champion)',
        participant1Id: undefined,
        participant2Id: undefined,
        bracketGroup: 'winners'
      }
    ],
    bracketType: 'double_elimination',
    participantsPerSession: 2,
    qualifiersPerSession: 1
  });

  return rounds;
}

/**
 * Clear a participant from all downstream rounds starting after fromRoundIndex.
 */
export function clearDownstreamParticipant(
  rounds: TournamentRound[],
  fromRoundIndex: number,
  participantId: string
) {
  for (let r = fromRoundIndex + 1; r < rounds.length; r++) {
    const round = rounds[r];
    if (!round.matchPairings) continue;

    for (let m = 0; m < round.matchPairings.length; m++) {
      const match = round.matchPairings[m];
      let matchHadWinner = false;

      if (match.participant1Id === participantId) {
        match.participant1Id = undefined;
        if (match.winnerId === participantId) {
          match.winnerId = undefined;
          matchHadWinner = true;
        }
      }

      if (match.participant2Id === participantId) {
        match.participant2Id = undefined;
        if (match.winnerId === participantId) {
          match.winnerId = undefined;
          matchHadWinner = true;
        }
      }

      if (match.participantIds) {
        match.participantIds = match.participantIds.filter(id => id !== participantId);
      }

      if (match.winnerIds && match.winnerIds.includes(participantId)) {
        match.winnerIds = match.winnerIds.filter(id => id !== participantId);
        matchHadWinner = true;
      }

      if (matchHadWinner) {
        clearDownstreamParticipant(rounds, r, participantId);
      }
    }

    round.participantIds = round.participantIds.filter(id => id !== participantId);

    if (round.winners) {
      round.winners = round.winners.filter(w => w.participantId !== participantId);
    }
  }
}

/**
 * Handles clicking a match or heat winner with universal format support.
 */
export function advanceMatchWinner(
  tournament: Tournament,
  roundId: string,
  matchId: string,
  winnerParticipantId: string
): { updatedTournament: Tournament; isFinalWinner: boolean } {
  const rIndex = tournament.rounds.findIndex(r => r.id === roundId);
  if (rIndex < 0) return { updatedTournament: tournament, isFinalWinner: false };

  const newRounds: TournamentRound[] = JSON.parse(JSON.stringify(tournament.rounds));
  const currentRound = newRounds[rIndex];
  if (!currentRound.matchPairings) return { updatedTournament: tournament, isFinalWinner: false };

  const mIndex = currentRound.matchPairings.findIndex(m => m.id === matchId);
  if (mIndex < 0) return { updatedTournament: tournament, isFinalWinner: false };

  const currentMatch = currentRound.matchPairings[mIndex];
  const isFinalRound = rIndex === newRounds.length - 1;
  const isMultiParticipant = (currentMatch.participantIds && currentMatch.participantIds.length > 2) ||
    currentRound.bracketType === 'multi_heats' || currentRound.bracketType === 'group_stage';

  let isFinalWinner = false;

  if (isMultiParticipant) {
    // Multi-participant / Heat / Group mode
    currentMatch.winnerIds = currentMatch.winnerIds || [];
    const isAlreadyWinner = currentMatch.winnerIds.includes(winnerParticipantId);

    if (isAlreadyWinner) {
      currentMatch.winnerIds = currentMatch.winnerIds.filter(id => id !== winnerParticipantId);
      clearDownstreamParticipant(newRounds, rIndex, winnerParticipantId);
      if (isFinalRound && currentRound.winners) {
        currentRound.winners = currentRound.winners.filter(w => w.participantId !== winnerParticipantId);
      }
    } else {
      currentMatch.winnerIds.push(winnerParticipantId);

      if (!isFinalRound) {
        const nextRound = newRounds[rIndex + 1];
        if (nextRound) {
          if (!nextRound.participantIds.includes(winnerParticipantId)) {
            nextRound.participantIds.push(winnerParticipantId);
          }

          // Slot into next round matches
          if (nextRound.matchPairings && nextRound.matchPairings.length > 0) {
            const targetMatch = nextRound.matchPairings[mIndex % nextRound.matchPairings.length];
            if (targetMatch) {
              if (targetMatch.participantIds) {
                if (!targetMatch.participantIds.includes(winnerParticipantId)) {
                  targetMatch.participantIds.push(winnerParticipantId);
                }
              } else {
                if (!targetMatch.participant1Id) {
                  targetMatch.participant1Id = winnerParticipantId;
                } else if (!targetMatch.participant2Id) {
                  targetMatch.participant2Id = winnerParticipantId;
                }
              }
            }
          }
          if (nextRound.status === 'waiting') {
            nextRound.status = 'active';
          }
        }
      } else {
        // Final Round Winner
        isFinalWinner = true;
        const winnerScore = tournament.performedRecords.find(
          rec => rec.roundId === roundId && rec.participantId === winnerParticipantId
        )?.totalScore || 100;

        const currentRank = (currentRound.winners?.length || 0) + 1;
        const title = currentRank === 1 ? 'Juara 1 (Grand Champion)' : currentRank === 2 ? 'Juara 2' : `Juara ${currentRank}`;

        currentRound.winners = currentRound.winners || [];
        currentRound.winners.push({
          participantId: winnerParticipantId,
          rank: currentRank,
          title,
          score: winnerScore
        });
      }
    }
  } else {
    // 1v1 Classic Head-to-Head Duel Mode
    const isAlreadyWinner = currentMatch.winnerId === winnerParticipantId;
    const oldWinnerId = currentMatch.winnerId;

    if (isAlreadyWinner) {
      currentMatch.winnerId = undefined;
      clearDownstreamParticipant(newRounds, rIndex, winnerParticipantId);

      if (isFinalRound && currentRound.winners) {
        currentRound.winners = [];
        currentRound.status = 'active';
      }
    } else {
      if (oldWinnerId && oldWinnerId !== winnerParticipantId) {
        clearDownstreamParticipant(newRounds, rIndex, oldWinnerId);
      }

      currentMatch.winnerId = winnerParticipantId;

      if (!isFinalRound) {
        const nextRIndex = rIndex + 1;
        const nextRound = newRounds[nextRIndex];
        const nextMIndex = Math.floor(mIndex / 2);
        const isSlot1 = mIndex % 2 === 0;

        if (nextRound && nextRound.matchPairings && nextRound.matchPairings[nextMIndex]) {
          const nextMatch = nextRound.matchPairings[nextMIndex];

          if (isSlot1) {
            nextMatch.participant1Id = winnerParticipantId;
          } else {
            nextMatch.participant2Id = winnerParticipantId;
          }

          if (!nextRound.participantIds.includes(winnerParticipantId)) {
            nextRound.participantIds.push(winnerParticipantId);
          }

          if (nextRound.status === 'waiting') {
            nextRound.status = 'active';
          }
        }
      } else {
        isFinalWinner = true;
        const runnerUpId = currentMatch.participant1Id === winnerParticipantId
          ? currentMatch.participant2Id
          : currentMatch.participant1Id;

        const winnerScores = tournament.performedRecords.find(
          rec => rec.roundId === roundId && rec.participantId === winnerParticipantId
        )?.totalScore || 100;

        const runnerUpScores = runnerUpId
          ? (tournament.performedRecords.find(
              rec => rec.roundId === roundId && rec.participantId === runnerUpId
            )?.totalScore || 90)
          : 0;

        const winnersList: RoundWinner[] = [
          {
            participantId: winnerParticipantId,
            rank: 1,
            title: 'Juara 1 (Grand Champion)',
            score: winnerScores
          }
        ];

        if (runnerUpId) {
          winnersList.push({
            participantId: runnerUpId,
            rank: 2,
            title: 'Juara 2 (Runner-Up)',
            score: runnerUpScores
          });
        }

        currentRound.winners = winnersList;
        currentRound.status = 'completed';
      }
    }
  }

  const updatedTournament: Tournament = {
    ...tournament,
    rounds: newRounds,
    updatedAt: new Date().toISOString()
  };

  return { updatedTournament, isFinalWinner };
}

/**
 * Re-shuffles or re-seeds participant positions in chosen format.
 */
export function shuffleOrSeedBracket(
  tournament: Tournament,
  mode: 'random' | 'seeded' | 'ordered',
  newFormat?: BracketType,
  participantsPerSession?: number,
  qualifiersPerSession?: number
): Tournament {
  let sortedParticipants = [...tournament.participants];

  if (mode === 'random') {
    sortedParticipants.sort(() => Math.random() - 0.5);
  } else if (mode === 'seeded') {
    const scoreMap = new Map<string, number>();
    tournament.performedRecords.forEach(rec => {
      scoreMap.set(rec.participantId, (scoreMap.get(rec.participantId) || 0) + rec.totalScore);
    });

    sortedParticipants.sort((a, b) => {
      const scoreA = scoreMap.get(a.id) ?? -1;
      const scoreB = scoreMap.get(b.id) ?? -1;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.number.localeCompare(b.number);
    });
  } else {
    sortedParticipants.sort((a, b) => a.number.localeCompare(b.number));
  }

  const activeFormat = newFormat || tournament.bracketType || 'single_elimination';
  const activeSessionSize = participantsPerSession || tournament.participantsPerSession || 2;
  const activeQualifiers = qualifiersPerSession || tournament.qualifiersPerSession || 1;

  const newRounds = generateBracketByFormat(
    sortedParticipants,
    activeFormat,
    activeSessionSize,
    activeQualifiers
  );

  return {
    ...tournament,
    bracketType: activeFormat,
    participantsPerSession: activeSessionSize,
    qualifiersPerSession: activeQualifiers,
    rounds: newRounds,
    currentRoundId: newRounds[0]?.id || tournament.currentRoundId,
    updatedAt: new Date().toISOString()
  };
}
