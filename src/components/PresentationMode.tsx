import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Minimize2, 
  Dice5, 
  Trophy, 
  Sparkles, 
  Award, 
  Play, 
  Volume2, 
  VolumeX, 
  CheckCircle2,
  Users,
  Crown,
  Medal,
  PartyPopper,
  GitBranch,
  Swords
} from 'lucide-react';
import { Tournament, TournamentRound, Participant, PerformedRecord } from '../types';
import { playTickSound, playFanfareSound } from '../lib/audio';
import { advanceMatchWinner } from '../lib/bracketHelper';

interface PresentationModeProps {
  tournament: Tournament;
  currentRound: TournamentRound;
  onExit: () => void;
  onDrawComplete: (drawn: Participant[]) => void;
  onOpenScoreModal: (participant: Participant) => void;
  onUpdateTournament?: (updated: Tournament) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  tournament,
  currentRound,
  onExit,
  onDrawComplete,
  onOpenScoreModal,
  onUpdateTournament,
  soundEnabled,
  setSoundEnabled
}) => {
  const [viewMode, setViewMode] = useState<'draw' | 'bracket' | 'winners'>('draw');

  // Pool logic
  const roundPerformedIds = new Set(
    tournament.performedRecords
      .filter(r => r.roundId === currentRound.id)
      .map(r => r.participantId)
  );

  const eligibleParticipants = tournament.participants.filter(p => 
    currentRound.participantIds.includes(p.id)
  );

  const availablePool = eligibleParticipants.filter(p => !roundPerformedIds.has(p.id));

  // Batch count
  const [batchCount, setBatchCount] = useState<number>(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [animatedDisplay, setAnimatedDisplay] = useState<Participant[]>([]);

  const handleMatchWinnerClick = (roundId: string, matchId: string, winnerId: string) => {
    if (!onUpdateTournament) return;
    const { updatedTournament, isFinalWinner } = advanceMatchWinner(
      tournament,
      roundId,
      matchId,
      winnerId
    );

    if (soundEnabled) {
      if (isFinalWinner) {
        playFanfareSound();
      } else {
        playTickSound();
      }
    }

    if (isFinalWinner) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }

    onUpdateTournament(updatedTournament);
  };
  const [lastDrawn, setLastDrawn] = useState<Participant[]>([]);

  const hasWinners = currentRound.winners && currentRound.winners.length > 0;

  const startDraw = () => {
    if (availablePool.length === 0 || isDrawing) return;

    const countToDraw = Math.min(batchCount, availablePool.length);
    setIsDrawing(true);
    setLastDrawn([]);

    const shuffled = [...availablePool].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, countToDraw);

    let tickCount = 0;
    const maxTicks = 28;

    const tickInterval = setInterval(() => {
      tickCount++;
      const randomDisplay = Array.from({ length: countToDraw }).map(() => {
        const randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
        return eligibleParticipants[randomIndex] || availablePool[0];
      });

      setAnimatedDisplay(randomDisplay);

      if (soundEnabled && tickCount % 2 === 0) {
        playTickSound();
      }

      if (tickCount >= maxTicks) {
        clearInterval(tickInterval);
        setAnimatedDisplay(chosen);
        setLastDrawn(chosen);
        setIsDrawing(false);

        if (soundEnabled) {
          playFanfareSound();
        }
        confetti({
          particleCount: 140,
          spread: 85,
          origin: { y: 0.5 }
        });

        onDrawComplete(chosen);
      }
    }, 60);
  };

  const handleCelebrate = () => {
    if (soundEnabled) {
      playFanfareSound();
    }
    confetti({
      particleCount: 180,
      spread: 100,
      origin: { y: 0.5 }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden select-none">
      
      {/* Top Navigation Bar */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-6 backdrop-blur-md bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shadow-xs">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>{tournament.name}</span>
              <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-300 border border-indigo-500/30 font-mono font-bold">
                {currentRound.name}
              </span>
            </h1>
            <span className="text-[10px] text-slate-400">Mode Panggung & Proyektor</span>
          </div>
        </div>

        {/* View Mode Switcher (Undian vs Bagan vs Juara) */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 p-1">
          <button
            onClick={() => setViewMode('draw')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition-all ${
              viewMode === 'draw'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Dice5 className="h-3.5 w-3.5" />
            <span>Undian Tampil</span>
          </button>

          <button
            onClick={() => setViewMode('bracket')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition-all ${
              viewMode === 'bracket'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span>Bagan Pertandingan</span>
          </button>

          <button
            onClick={() => setViewMode('winners')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold transition-all ${
              viewMode === 'winners'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="h-3.5 w-3.5" />
            <span>Panggung Juara {hasWinners ? `(${currentRound.winners?.length})` : ''}</span>
          </button>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-indigo-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
          </button>
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-800"
          >
            <Minimize2 className="h-3.5 w-3.5" />
            <span>Tutup Layar</span>
          </button>
        </div>
      </div>

      {/* Main Stage Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Ambient Subtle Glows */}
        <div className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

        {viewMode === 'winners' ? (
          /* PANGGUNG JUARA / WINNERS PODIUM STAGE */
          <div className="w-full max-w-5xl text-center z-10 flex flex-col items-center">
            
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-500/30 px-5 py-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <Crown className="h-4 w-4 text-amber-400" />
              <span>PENGUMUMAN RESMI PEMENANG {currentRound.name.toUpperCase()}</span>
            </div>

            {!hasWinners ? (
              <div className="py-12 text-center">
                <Medal className="mx-auto h-16 w-16 text-slate-600 mb-3" />
                <h3 className="text-xl font-bold text-slate-300">
                  Pemenang Babak Belum Ditetapkan
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Silakan tutup fullscreen lalu klik tombol "Pilih Pemenang Babak" di Papan Skor untuk memilih juara babak ini.
                </p>
              </div>
            ) : (
              <div className="w-full my-4">
                
                {/* Podium Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end my-4">
                  {currentRound.winners?.slice(0, 3).map((winner, idx) => {
                    const participant = tournament.participants.find(p => p.id === winner.participantId);
                    if (!participant) return null;

                    const isFirst = idx === 0;
                    const isSecond = idx === 1;
                    const isThird = idx === 2;

                    return (
                      <div
                        key={winner.participantId}
                        className={`rounded-2xl border p-6 transform transition-all hover:scale-105 ${
                          isFirst
                            ? 'border-amber-400 bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 shadow-2xl shadow-amber-500/20 order-1 md:order-2 md:-translate-y-4'
                            : isSecond
                            ? 'border-slate-400/40 bg-gradient-to-b from-slate-700/20 via-slate-900 to-slate-950 shadow-xl order-2 md:order-1'
                            : 'border-amber-700/40 bg-gradient-to-b from-amber-900/20 via-slate-900 to-slate-950 shadow-xl order-3 md:order-3'
                        }`}
                      >
                        {/* Winner Title Badge */}
                        <div className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider mb-4 shadow-xs"
                          style={{
                            backgroundColor: isFirst ? '#f59e0b' : isSecond ? '#94a3b8' : '#b45309',
                            color: isFirst ? '#020617' : '#ffffff'
                          }}
                        >
                          {isFirst ? <Crown className="h-3.5 w-3.5" /> : <Medal className="h-3.5 w-3.5" />}
                          <span>{winner.title}</span>
                        </div>

                        {/* Avatar */}
                        <div
                          className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl text-4xl font-mono font-bold text-white shadow-xl ring-4 ring-white/10"
                          style={{ backgroundColor: participant.avatarColor }}
                        >
                          {participant.number}
                        </div>

                        <h3 className="mt-4 text-xl font-bold text-white truncate">
                          {participant.name}
                        </h3>
                        <p className="text-xs text-amber-300 font-medium mt-0.5 truncate">
                          {participant.organization || 'Peserta Lomba'}
                        </p>

                        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-[11px] uppercase tracking-wider text-slate-400">Total Skor</span>
                          <span className="font-mono text-lg font-bold text-amber-400">
                            {winner.score} Pts
                          </span>
                        </div>

                        {winner.notes && (
                          <p className="mt-2 text-[11px] italic text-slate-400">
                            "{winner.notes}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Celebrate Button */}
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleCelebrate}
                    className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-amber-600 transition-all active:scale-95"
                  >
                    <PartyPopper className="h-4 w-4" />
                    <span>Luncurkan Konfeti & Fanfare Juara</span>
                  </button>
                </div>

              </div>
            )}

          </div>
        ) : viewMode === 'bracket' ? (
          /* =========================================================================
             BAGAN PERTANDINGAN FULLSCREEN / PROYEKTOR
             ========================================================================= */
          <div className="w-full max-w-7xl h-full flex flex-col z-10 overflow-hidden">
            
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Bagan Pertandingan & Jalur Juara Proyektor
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {tournament.rounds.length} Babak Pertandingan
              </div>
            </div>

            {/* Horizontal Scrollable Stages Container */}
            <div className="flex-1 overflow-x-auto overflow-y-auto p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-2xl backdrop-blur-md">
              <div className="flex items-start gap-8 min-w-max py-2">
                {tournament.rounds.map((round, rIndex) => {
                  const isCurrent = round.id === currentRound.id;
                  const roundMatches = round.matchPairings || [];
                  const isLast = rIndex === tournament.rounds.length - 1;

                  return (
                    <div key={round.id} className="w-72 flex-shrink-0 flex flex-col">
                      {/* Column Header */}
                      <div className={`mb-4 rounded-xl border p-3 text-center transition-all ${
                        isCurrent
                          ? 'border-indigo-500 bg-indigo-950/60 shadow-lg shadow-indigo-500/20'
                          : 'border-slate-800 bg-slate-950/70'
                      }`}>
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                          Babak #{rIndex + 1}
                        </span>
                        <h3 className="text-sm font-bold text-white truncate mt-0.5">
                          {round.name}
                        </h3>
                        <div className="mt-1 flex items-center justify-center gap-2 text-[10px] text-indigo-300 font-semibold">
                          <span>{round.participantIds.length} Peserta</span>
                          {round.qualifiersCount > 0 && <span>• Top {round.qualifiersCount} Lolos</span>}
                        </div>
                      </div>

                      {/* Match / Participant List in Round */}
                      <div className="space-y-4">
                        {roundMatches.length > 0 ? (
                          roundMatches.map((m, mIdx) => {
                            const p1 = tournament.participants.find(p => p.id === m.participant1Id);
                            const p2 = tournament.participants.find(p => p.id === m.participant2Id);
                            const rec1 = p1 ? tournament.performedRecords.find(r => r.roundId === round.id && r.participantId === p1.id) : null;
                            const rec2 = p2 ? tournament.performedRecords.find(r => r.roundId === round.id && r.participantId === p2.id) : null;

                            return (
                              <div
                                key={m.id}
                                className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 shadow-lg hover:border-slate-700 transition-all"
                              >
                                <div className="text-[10px] font-mono text-slate-400 mb-2 border-b border-slate-800/80 pb-1 flex justify-between">
                                  <span>{m.title || `Duel #${mIdx + 1}`}</span>
                                  {m.winnerId && <span className="text-amber-400 font-bold">✓ Selesai</span>}
                                </div>

                                {/* P1 */}
                                <div 
                                  onClick={() => p1 && handleMatchWinnerClick(round.id, m.id, p1.id)}
                                  className={`flex items-center justify-between rounded-lg p-2 transition-all ${
                                    p1 ? 'cursor-pointer hover:ring-1 hover:ring-indigo-400' : ''
                                  } ${
                                    m.winnerId === p1?.id 
                                      ? 'bg-amber-500/20 border-2 border-amber-400/80 text-amber-300 shadow-md' 
                                      : 'bg-slate-900/60 border border-transparent'
                                  }`}
                                  title={p1 ? 'Klik untuk memilih pemenang & loloskan ke babak selanjutnya' : undefined}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {p1 ? (
                                      <>
                                        <div
                                          className="h-6 w-6 rounded flex items-center justify-center text-[10px] font-mono font-bold text-white shrink-0"
                                          style={{ backgroundColor: p1.avatarColor }}
                                        >
                                          {p1.number}
                                        </div>
                                        <span className="text-xs font-bold truncate text-white">
                                          {p1.name}
                                        </span>
                                        {m.winnerId === p1.id && <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                                      </>
                                    ) : (
                                      <span className="text-xs text-slate-500 italic">
                                        {rIndex === 0 ? 'Slot Kosong' : `Pemenang Match #${mIdx * 2 + 1}`}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-mono text-xs font-bold text-indigo-400 ml-2">
                                    {rec1?.hasScoreEntered ? rec1.totalScore : '-'}
                                  </span>
                                </div>

                                <div className="text-center my-1 text-[9px] font-mono text-slate-600 font-bold">VS</div>

                                {/* P2 */}
                                <div 
                                  onClick={() => p2 && handleMatchWinnerClick(round.id, m.id, p2.id)}
                                  className={`flex items-center justify-between rounded-lg p-2 transition-all ${
                                    p2 ? 'cursor-pointer hover:ring-1 hover:ring-indigo-400' : ''
                                  } ${
                                    m.winnerId === p2?.id 
                                      ? 'bg-amber-500/20 border-2 border-amber-400/80 text-amber-300 shadow-md' 
                                      : 'bg-slate-900/60 border border-transparent'
                                  }`}
                                  title={p2 ? 'Klik untuk memilih pemenang & loloskan ke babak selanjutnya' : undefined}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {p2 ? (
                                      <>
                                        <div
                                          className="h-6 w-6 rounded flex items-center justify-center text-[10px] font-mono font-bold text-white shrink-0"
                                          style={{ backgroundColor: p2.avatarColor }}
                                        >
                                          {p2.number}
                                        </div>
                                        <span className="text-xs font-bold truncate text-white">
                                          {p2.name}
                                        </span>
                                        {m.winnerId === p2.id && <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                                      </>
                                    ) : (
                                      <span className="text-xs text-slate-500 italic">
                                        {rIndex === 0 ? 'BYE (Lolos)' : `Pemenang Match #${mIdx * 2 + 2}`}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-mono text-xs font-bold text-indigo-400 ml-2">
                                    {rec2?.hasScoreEntered ? rec2.totalScore : '-'}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          // If no explicit matchups, list round participants & their scores
                          <div className="space-y-2">
                            {tournament.participants
                              .filter(p => round.participantIds.includes(p.id))
                              .map((p, idx) => {
                                const rec = tournament.performedRecords.find(r => r.roundId === round.id && r.participantId === p.id);
                                const isWinner = round.winners?.some(w => w.participantId === p.id);

                                return (
                                  <div
                                    key={p.id}
                                    className={`flex items-center justify-between rounded-xl border p-2.5 ${
                                      isWinner
                                        ? 'border-amber-500/50 bg-amber-500/10'
                                        : 'border-slate-800 bg-slate-950/70'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <div
                                        className="h-6 w-6 rounded flex items-center justify-center text-[10px] font-mono font-bold text-white shrink-0"
                                        style={{ backgroundColor: p.avatarColor }}
                                      >
                                        {p.number}
                                      </div>
                                      <span className="text-xs font-bold text-white truncate">
                                        {p.name}
                                      </span>
                                    </div>
                                    <span className="font-mono text-xs font-bold text-indigo-400 ml-2">
                                      {rec?.hasScoreEntered ? `${rec.totalScore} Pts` : 'Belum'}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Grand Champion Pillar in Presentation Mode */}
                <div className="w-64 flex-shrink-0 flex flex-col justify-center">
                  <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 p-6 text-center shadow-2xl">
                    <Trophy className="mx-auto h-12 w-12 text-amber-400 mb-2" />
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                      JUARA UTAMA
                    </span>
                    {tournament.rounds[tournament.rounds.length - 1]?.winners?.[0] ? (
                      (() => {
                        const grandWin = tournament.rounds[tournament.rounds.length - 1].winners![0];
                        const part = tournament.participants.find(p => p.id === grandWin.participantId);
                        return (
                          <div className="mt-3">
                            <div
                              className="mx-auto h-12 w-12 rounded-xl flex items-center justify-center font-mono text-lg font-bold text-white shadow-lg"
                              style={{ backgroundColor: part?.avatarColor || '#f59e0b' }}
                            >
                              {part?.number}
                            </div>
                            <h4 className="mt-2 text-sm font-bold text-white truncate">
                              {part?.name}
                            </h4>
                            <p className="text-[10px] text-amber-300 truncate">
                              {part?.organization || 'Pemenang Turnamen'}
                            </p>
                            <div className="mt-2 rounded bg-amber-400/20 py-1 font-mono text-xs font-bold text-amber-300">
                              {grandWin.score} Pts
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-xs text-slate-400 mt-2">Menunggu Babak Final</p>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        ) : (
          /* UNDIAN NOMOR TAMPIL STAGE */
          <div className="w-full max-w-5xl text-center z-10 flex flex-col items-center">
            
            {/* Header Status */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-900/90 border border-slate-800 px-5 py-1.5 text-xs text-slate-300 shadow-xl">
              <Users className="h-3.5 w-3.5 text-indigo-400" />
              <span>Sisa di Antrean Undian: <strong className="text-white font-mono">{availablePool.length}</strong> dari {eligibleParticipants.length} Peserta</span>
            </div>

            {/* Cards Showcase Display */}
            <div className="my-6 w-full min-h-[300px] flex items-center justify-center">
              {isDrawing ? (
                <div className="w-full">
                  <div className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-indigo-400 animate-pulse uppercase tracking-wider">
                    <Sparkles className="h-4 w-4 animate-spin" />
                    <span>Sedang Mengacak Peserta Tampil...</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-5">
                    {animatedDisplay.map((p, idx) => (
                      <div
                        key={idx}
                        className="w-64 rounded-2xl bg-slate-900 border-2 border-indigo-500 p-6 shadow-2xl animate-bounce"
                      >
                        <div
                          className="mx-auto flex h-20 w-20 items-center justify-center rounded-xl text-3xl font-mono font-bold text-white shadow-lg"
                          style={{ backgroundColor: p.avatarColor }}
                        >
                          {p.number}
                        </div>
                        <h3 className="mt-3 text-base font-bold text-white truncate">
                          {p.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {p.organization || 'Peserta Lomba'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : lastDrawn.length > 0 ? (
                <div className="w-full">
                  <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>PESERTA DIPANGGIL TAMPIL</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-5">
                    {lastDrawn.map((p) => {
                      const record = tournament.performedRecords.find(
                        r => r.roundId === currentRound.id && r.participantId === p.id
                      );

                      return (
                        <div
                          key={p.id}
                          className="w-72 rounded-2xl bg-slate-900 border-2 border-indigo-500 p-6 shadow-xl transform transition-all hover:scale-105"
                        >
                          <div
                            className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl text-4xl font-mono font-bold text-white shadow-xl ring-4 ring-indigo-500/30"
                            style={{ backgroundColor: p.avatarColor }}
                          >
                            {p.number}
                          </div>
                          <h2 className="mt-4 text-lg font-bold text-white truncate">
                            {p.name}
                          </h2>
                          {p.organization && (
                            <p className="text-xs font-medium text-indigo-300 mt-0.5 truncate">
                              {p.organization}
                            </p>
                          )}
                          <div className="mt-5 pt-3 border-t border-slate-800">
                            <button
                              onClick={() => onOpenScoreModal(p)}
                              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all"
                            >
                              <Award className="h-3.5 w-3.5" />
                              <span>{record?.hasScoreEntered ? `Skor: ${record.totalScore} Poin (Edit)` : 'Input Skor Juri'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : availablePool.length === 0 ? (
                <div className="text-center py-10">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Semua Peserta Telah Tampil di Babak Ini!
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Buka Papan Peringkat untuk memilih pemenang atau meloloskan peserta ke babak berikutnya.
                  </p>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-indigo-400 shadow-xl">
                    <Dice5 className="h-10 w-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Siap Mengundi Nomor Tampil
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Tentukan jumlah peserta lalu tekan tombol di bawah untuk mengundi nomor tampil panggung.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              
              {/* Batch count selector in presentation mode */}
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-800 p-1">
                <span className="text-[11px] font-semibold text-slate-400 px-2">Jumlah Undi:</span>
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    disabled={isDrawing || n > availablePool.length}
                    onClick={() => setBatchCount(n)}
                    className={`h-8 w-8 rounded-md text-xs font-mono font-bold transition-all ${
                      batchCount === n
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    } disabled:opacity-30`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Huge Draw Trigger Button */}
              <button
                id="btn-pres-draw"
                disabled={isDrawing || availablePool.length === 0}
                onClick={startDraw}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>{isDrawing ? 'Mengacak...' : `UNDI ${Math.min(batchCount, availablePool.length)} PESERTA TAMPIL`}</span>
              </button>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};
