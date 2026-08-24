import React, { useState } from 'react';
import { X, Sparkles, CheckSquare, Square, ArrowRight, Trophy, AlertTriangle, Users } from 'lucide-react';
import { Tournament, TournamentRound, Participant, PerformedRecord } from '../types';

interface AdvanceRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  onConfirmAdvance: (newRound: TournamentRound) => void;
}

export const AdvanceRoundModal: React.FC<AdvanceRoundModalProps> = ({
  isOpen,
  onClose,
  tournament,
  onConfirmAdvance
}) => {
  const currentRound = tournament.rounds.find(r => r.id === tournament.currentRoundId) || tournament.rounds[0];

  // Get performed records for current round
  const records = tournament.performedRecords.filter(r => r.roundId === currentRound.id);
  const recordMap = new Map<string, PerformedRecord>();
  records.forEach(r => recordMap.set(r.participantId, r));

  // Current round participants sorted by score
  const currentParticipants = tournament.participants.filter(p => 
    currentRound.participantIds.includes(p.id)
  );

  const rankedParticipants = [...currentParticipants].sort((a, b) => {
    const scoreA = recordMap.get(a.id)?.hasScoreEntered ? recordMap.get(a.id)!.totalScore : -1;
    const scoreB = recordMap.get(b.id)?.hasScoreEntered ? recordMap.get(b.id)!.totalScore : -1;
    return scoreB - scoreA;
  });

  const nextRoundNumber = tournament.rounds.length + 1;
  const defaultNextName = nextRoundNumber === 2 
    ? 'Babak Semifinal' 
    : nextRoundNumber === 3 
    ? 'Babak Final & Perebutan Juara' 
    : `Babak ${nextRoundNumber}`;

  const [roundName, setRoundName] = useState(defaultNextName);
  const [targetQualifiers, setTargetQualifiers] = useState(
    Math.max(1, Math.floor(currentRound.qualifiersCount / 2)) || 1
  );
  const [nextSessionSize, setNextSessionSize] = useState<number>(
    currentRound.participantsPerSession || tournament.participantsPerSession || 2
  );

  // Pre-select top N qualifiers
  const initialSelected = rankedParticipants
    .slice(0, currentRound.qualifiersCount || 3)
    .map(p => p.id);

  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectTop = (n: number) => {
    setSelectedIds(rankedParticipants.slice(0, n).map(p => p.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      alert('Pilih minimal 1 peserta yang lolos ke babak selanjutnya.');
      return;
    }

    const newRound: TournamentRound = {
      id: `r_${Date.now()}_${nextRoundNumber}`,
      roundNumber: nextRoundNumber,
      name: `${roundName.trim()} (${selectedIds.length} Peserta)`,
      status: 'active',
      qualifiersCount: Math.min(targetQualifiers, selectedIds.length),
      participantIds: selectedIds,
      bracketType: currentRound.bracketType || tournament.bracketType,
      participantsPerSession: nextSessionSize,
      qualifiersPerSession: Math.max(1, Math.min(nextSessionSize - 1, targetQualifiers))
    };

    onConfirmAdvance(newRound);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="relative my-8 w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Progresi Kompetisi
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Loloskan Peserta ke Babak Berikutnya
            </h2>
            <p className="text-xs text-slate-400">
              Pilih peserta pemenang dari <strong>{currentRound.name}</strong> untuk masuk ke babak selanjutnya.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Next Round Name, Target Qualifiers & Session Size */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Babak Baru
              </label>
              <input
                id="input-next-round-name"
                type="text"
                required
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                placeholder="Contoh: Babak Semifinal / Final"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Peserta / Sesi
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setNextSessionSize(prev => Math.max(2, prev - 1))}
                  className="w-7 h-7 rounded border border-slate-200 bg-slate-100 font-bold text-slate-700 text-xs"
                >
                  -
                </button>
                <input
                  id="input-next-session-size"
                  type="number"
                  min={2}
                  max={32}
                  value={nextSessionSize}
                  onChange={(e) => setNextSessionSize(Math.max(2, Math.min(32, Number(e.target.value) || 2)))}
                  className="flex-1 text-center rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-mono text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setNextSessionSize(prev => Math.min(32, prev + 1))}
                  className="w-7 h-7 rounded border border-slate-200 bg-slate-100 font-bold text-slate-700 text-xs"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Juara / Lolos
              </label>
              <input
                id="input-next-qualifiers-count"
                type="number"
                min={1}
                max={selectedIds.length || 10}
                value={targetQualifiers}
                onChange={(e) => setTargetQualifiers(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-mono text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Pilih Peserta Lolos ({selectedIds.length} Dipilih)
            </label>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleSelectTop(currentRound.qualifiersCount)}
                className="rounded-md bg-indigo-50 px-2 py-1 font-mono font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
              >
                Top {currentRound.qualifiersCount} (Default)
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(rankedParticipants.map(p => p.id))}
                className="rounded-md bg-slate-100 px-2 py-1 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 font-bold"
              >
                Pilih Semua
              </button>
            </div>
          </div>

          {/* Participant Qualification List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {rankedParticipants.map((p, idx) => {
              const rec = recordMap.get(p.id);
              const isSelected = selectedIds.includes(p.id);

              return (
                <div
                  key={p.id}
                  onClick={() => toggleSelect(p.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 dark:border-indigo-500 dark:bg-indigo-950/30'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-slate-500">
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-mono font-bold text-white shadow-xs"
                      style={{ backgroundColor: p.avatarColor }}
                    >
                      {p.number}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.organization || `Peringkat #${idx + 1}`}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {rec?.hasScoreEntered ? `${rec.totalScore} Poin` : 'Belum Dinilai'}
                    </span>
                    <span className="block text-[9px] font-mono text-slate-400 uppercase">
                      Rank #{idx + 1}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              id="btn-confirm-advance-round"
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-indigo-700 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>Mulai Babak Baru ({selectedIds.length} Peserta)</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
