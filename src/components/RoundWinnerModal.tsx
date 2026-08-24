import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Trophy, 
  Award, 
  Crown, 
  Sparkles, 
  Plus, 
  Trash2, 
  Medal, 
  CheckCircle2, 
  RotateCcw,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { Tournament, TournamentRound, Participant, PerformedRecord, RoundWinner } from '../types';
import { playFanfareSound } from '../lib/audio';

interface RoundWinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  round: TournamentRound;
  onSaveWinners: (roundId: string, winners: RoundWinner[]) => void;
  soundEnabled: boolean;
}

const PRESET_TITLES = [
  'Juara 1',
  'Juara 2',
  'Juara 3',
  'Juara Harapan 1',
  'Juara Harapan 2',
  'Juara Favorit',
  'Peserta Terbaik',
  'Best Performance',
  'Pemenang Babak'
];

export const RoundWinnerModal: React.FC<RoundWinnerModalProps> = ({
  isOpen,
  onClose,
  tournament,
  round,
  onSaveWinners,
  soundEnabled
}) => {
  // Get participants in this round
  const roundParticipants = tournament.participants.filter(p => 
    round.participantIds.includes(p.id)
  );

  // Get performed records for scores
  const records = tournament.performedRecords.filter(r => r.roundId === round.id);
  const recordMap = new Map<string, PerformedRecord>();
  records.forEach(r => recordMap.set(r.participantId, r));

  // Sort participants by totalScore desc
  const rankedParticipants = [...roundParticipants].sort((a, b) => {
    const scoreA = recordMap.get(a.id)?.hasScoreEntered ? recordMap.get(a.id)!.totalScore : -1;
    const scoreB = recordMap.get(b.id)?.hasScoreEntered ? recordMap.get(b.id)!.totalScore : -1;
    return scoreB - scoreA;
  });

  const [winners, setWinners] = useState<RoundWinner[]>([]);

  // Initialize from existing round winners or auto-suggest top 3
  useEffect(() => {
    if (!isOpen) return;

    if (round.winners && round.winners.length > 0) {
      setWinners(round.winners);
    } else {
      // Auto-suggest top 3 from leaderboard if available
      const topCount = Math.min(3, rankedParticipants.length);
      const initial: RoundWinner[] = [];

      for (let i = 0; i < topCount; i++) {
        const p = rankedParticipants[i];
        const rec = recordMap.get(p.id);
        const title = i === 0 ? 'Juara 1' : i === 1 ? 'Juara 2' : i === 2 ? 'Juara 3' : `Juara ${i + 1}`;
        initial.push({
          participantId: p.id,
          rank: i + 1,
          title,
          score: rec?.hasScoreEntered ? rec.totalScore : 0,
          notes: ''
        });
      }
      setWinners(initial);
    }
  }, [isOpen, round, tournament]);

  if (!isOpen) return null;

  const handleAutoPopulateTop = (count: number) => {
    const newWinners: RoundWinner[] = [];
    const targetCount = Math.min(count, rankedParticipants.length);

    for (let i = 0; i < targetCount; i++) {
      const p = rankedParticipants[i];
      const rec = recordMap.get(p.id);
      const title = i === 0 ? 'Juara 1' : i === 1 ? 'Juara 2' : i === 2 ? 'Juara 3' : `Juara Harapan ${i - 2}`;
      newWinners.push({
        participantId: p.id,
        rank: i + 1,
        title,
        score: rec?.hasScoreEntered ? rec.totalScore : 0,
        notes: ''
      });
    }
    setWinners(newWinners);
  };

  const handleAddWinnerSlot = () => {
    const nextRank = winners.length + 1;
    // Find first participant not already in winners
    const existingIds = new Set(winners.map(w => w.participantId));
    const available = rankedParticipants.find(p => !existingIds.has(p.id)) || rankedParticipants[0];

    const rec = available ? recordMap.get(available.id) : null;
    const defaultTitle = nextRank === 1 ? 'Juara 1' : nextRank === 2 ? 'Juara 2' : nextRank === 3 ? 'Juara 3' : `Juara Harapan ${nextRank - 3}`;

    setWinners([
      ...winners,
      {
        participantId: available?.id || '',
        rank: nextRank,
        title: defaultTitle,
        score: rec?.hasScoreEntered ? rec.totalScore : 0,
        notes: ''
      }
    ]);
  };

  const handleUpdateWinner = (index: number, updates: Partial<RoundWinner>) => {
    setWinners(prev => {
      const copy = [...prev];
      const updatedItem = { ...copy[index], ...updates };

      // If participantId changed, update score automatically
      if (updates.participantId) {
        const rec = recordMap.get(updates.participantId);
        updatedItem.score = rec?.hasScoreEntered ? rec.totalScore : 0;
      }

      copy[index] = updatedItem;
      return copy;
    });
  };

  const handleRemoveWinner = (index: number) => {
    setWinners(prev => {
      const filtered = prev.filter((_, idx) => idx !== index);
      // Re-index ranks
      return filtered.map((w, idx) => ({ ...w, rank: idx + 1 }));
    });
  };

  const handleClearAll = () => {
    if (confirm('Hapus semua pemenang yang telah ditetapkan di babak ini?')) {
      setWinners([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicate participants in winners list
    const participantIds = winners.map(w => w.participantId).filter(Boolean);
    const uniqueIds = new Set(participantIds);
    if (participantIds.length !== uniqueIds.size) {
      alert('Peringatan: Terdapat peserta yang dipilih lebih dari sekali sebagai pemenang. Silakan periksa kembali.');
      return;
    }

    if (soundEnabled) {
      playFanfareSound();
    }

    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 }
    });

    onSaveWinners(round.id, winners);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="relative my-8 w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block">
              Penetapan & Penghargaan Babak
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Pilih Pemenang {round.name}
            </h2>
            <p className="text-xs text-slate-400">
              Tentukan gelar juara dan pemenang untuk babak ini secara otomatis atau pilih manual.
            </p>
          </div>
        </div>

        {/* Quick Auto-Select Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 border border-slate-100 dark:bg-slate-850 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Pilih Otomatis (Top Skor):
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleAutoPopulateTop(1)}
              className="rounded-md bg-white px-2.5 py-1 text-xs font-mono font-bold text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            >
              Top 1
            </button>
            <button
              type="button"
              onClick={() => handleAutoPopulateTop(3)}
              className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-mono font-bold text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
            >
              Top 3 (Juara 1, 2, 3)
            </button>
            <button
              type="button"
              onClick={() => handleAutoPopulateTop(5)}
              className="rounded-md bg-white px-2.5 py-1 text-xs font-mono font-bold text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            >
              Top 5 (+ Harapan)
            </button>
            {winners.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-md px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Winners List Slots */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {winners.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl dark:border-slate-800">
                <Medal className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Belum ada pemenang yang dipilih untuk babak ini
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klik tombol "Top 3" di atas atau klik "Tambah Pemenang" di bawah.
                </p>
              </div>
            ) : (
              winners.map((winner, index) => {
                const selectedParticipant = tournament.participants.find(p => p.id === winner.participantId);
                const rec = winner.participantId ? recordMap.get(winner.participantId) : null;

                const isGold = index === 0;
                const isSilver = index === 1;
                const isBronze = index === 2;

                return (
                  <div
                    key={index}
                    className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-lg border p-3 transition-all ${
                      isGold
                        ? 'border-amber-300 bg-amber-50/40 dark:border-amber-700/50 dark:bg-amber-950/20'
                        : isSilver
                        ? 'border-slate-300 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/40'
                        : isBronze
                        ? 'border-amber-600/30 bg-amber-900/5 dark:border-amber-700/30 dark:bg-amber-950/10'
                        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-850'
                    }`}
                  >
                    {/* Rank / Medal Badge */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg font-mono font-bold text-sm shadow-xs ${
                        isGold
                          ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                          : isSilver
                          ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white'
                          : isBronze
                          ? 'bg-amber-700 text-white'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}>
                        {isGold ? <Crown className="h-4 w-4" /> : `#${index + 1}`}
                      </div>

                      {/* Title selector / Custom Title */}
                      <div className="flex-1 sm:w-36">
                        <input
                          type="text"
                          value={winner.title}
                          onChange={(e) => handleUpdateWinner(index, { title: e.target.value })}
                          placeholder="Gelar Juara"
                          list={`titles-list-${index}`}
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        <datalist id={`titles-list-${index}`}>
                          {PRESET_TITLES.map((t, idx) => (
                            <option key={idx} value={t} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    {/* Participant Dropdown Selector */}
                    <div className="flex-1 w-full">
                      <select
                        value={winner.participantId}
                        onChange={(e) => handleUpdateWinner(index, { participantId: e.target.value })}
                        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="">-- Pilih Peserta --</option>
                        {rankedParticipants.map((p, pIdx) => {
                          const pRec = recordMap.get(p.id);
                          const scoreText = pRec?.hasScoreEntered ? `${pRec.totalScore} Poin` : 'Belum dinilai';
                          return (
                            <option key={p.id} value={p.id}>
                              #{p.number} - {p.name} {p.organization ? `(${p.organization})` : ''} - [{scoreText}] (Rank #{pIdx + 1})
                            </option>
                          );
                        })}
                      </select>
                      {selectedParticipant?.organization && (
                        <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                          Instansi: {selectedParticipant.organization}
                        </span>
                      )}
                    </div>

                    {/* Score display & Notes */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {rec?.hasScoreEntered ? `${rec.totalScore} Poin` : '-'}
                        </span>
                        <span className="block text-[9px] font-mono text-slate-400">
                          {rec?.hasScoreEntered ? `${rec.percentageScore.toFixed(0)}%` : 'No score'}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveWinner(index)}
                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                        title="Hapus baris juara"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Add More Winner Slot Button */}
          <button
            type="button"
            onClick={handleAddWinnerSlot}
            className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-dashed border-slate-300 py-2 text-xs font-bold text-slate-600 hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-400 dark:hover:text-indigo-400 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Posisi Juara / Gelar Khusus</span>
          </button>

          {/* Submit & Cancel Buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              id="btn-save-round-winners"
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-amber-600 transition-all"
            >
              <Trophy className="h-4 w-4" />
              <span>Simpan & Umumkan Pemenang</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
