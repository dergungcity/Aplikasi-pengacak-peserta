import React, { useState, useEffect } from 'react';
import { X, Award, Check, Sparkles, MessageSquare, Star, SlidersHorizontal } from 'lucide-react';
import { Participant, Tournament, TournamentRound, PerformedRecord } from '../types';
import { playScoreDing } from '../lib/audio';

interface ScoreInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
  tournament: Tournament;
  currentRound: TournamentRound;
  onSaveScore: (record: PerformedRecord) => void;
  soundEnabled: boolean;
}

export const ScoreInputModal: React.FC<ScoreInputModalProps> = ({
  isOpen,
  onClose,
  participant,
  tournament,
  currentRound,
  onSaveScore,
  soundEnabled
}) => {
  if (!isOpen || !participant) return null;

  // Find existing record if any
  const existingRecord = tournament.performedRecords.find(
    r => r.roundId === currentRound.id && r.participantId === participant.id
  );

  // Initialize scores for all criteria
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    tournament.scoringCriteria.forEach((crit) => {
      initial[crit.id] = existingRecord?.scores?.[crit.id] ?? Math.round(crit.maxScore * 0.8);
    });
    return initial;
  });

  const [notes, setNotes] = useState(existingRecord?.judgeNotes || '');

  // Calculate totals
  const totalScore = tournament.scoringCriteria.reduce((sum, crit) => {
    return sum + (scores[crit.id] || 0);
  }, 0);

  const maxPossibleScore = tournament.scoringCriteria.reduce((sum, crit) => {
    return sum + crit.maxScore;
  }, 0);

  const percentageScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

  const handleScoreChange = (criterionId: string, value: number, max: number) => {
    const clamped = Math.max(0, Math.min(max, value));
    setScores(prev => ({
      ...prev,
      [criterionId]: clamped
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const record: PerformedRecord = {
      participantId: participant.id,
      roundId: currentRound.id,
      drawnOrder: existingRecord?.drawnOrder || tournament.performedRecords.filter(r => r.roundId === currentRound.id).length + 1,
      drawnAt: existingRecord?.drawnAt || new Date().toISOString(),
      scores,
      totalScore,
      maxPossibleScore,
      percentageScore,
      judgeNotes: notes.trim(),
      hasScoreEntered: true,
      isWinnerOrQualified: existingRecord?.isWinnerOrQualified || false
    };

    if (soundEnabled) {
      playScoreDing();
    }

    onSaveScore(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Participant Header Info */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg text-lg font-mono font-bold text-white shadow-xs"
            style={{ backgroundColor: participant.avatarColor }}
          >
            {participant.number}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded dark:bg-indigo-950 dark:text-indigo-300">
                {currentRound.name}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {participant.name}
            </h2>
            {participant.organization && (
              <p className="text-xs text-slate-400">
                {participant.organization}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Criteria Sliders / Inputs */}
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {tournament.scoringCriteria.map((crit) => {
              const currentVal = scores[crit.id] ?? 0;
              return (
                <div key={crit.id} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-850">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {crit.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={crit.maxScore}
                        value={currentVal}
                        onChange={(e) => handleScoreChange(crit.id, Number(e.target.value), crit.maxScore)}
                        className="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-xs font-mono font-bold text-indigo-600 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-indigo-400"
                      />
                      <span className="text-xs text-slate-400 font-mono">/ {crit.maxScore}</span>
                    </div>
                  </div>

                  {/* Range slider for rapid input */}
                  <input
                    type="range"
                    min={0}
                    max={crit.maxScore}
                    value={currentVal}
                    onChange={(e) => handleScoreChange(crit.id, Number(e.target.value), crit.maxScore)}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg dark:bg-slate-700"
                  />
                </div>
              );
            })}
          </div>

          {/* Total Score Display Banner */}
          <div className="flex items-center justify-between rounded-lg bg-slate-900 p-4 text-white shadow-xs dark:bg-indigo-950 dark:border dark:border-indigo-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Skor Akhir</span>
              <div className="font-mono text-2xl font-bold">{totalScore} <span className="text-xs font-mono font-normal text-slate-400">/ {maxPossibleScore}</span></div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Persentase</span>
              <div className="font-mono text-xl font-bold text-indigo-400">{percentageScore.toFixed(1)}%</div>
            </div>
          </div>

          {/* Notes from Judges */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
              <span>Catatan / Komentar Juri (Opsional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Artikulasi vokal sangat jelas, penguasaan panggung sangat baik..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              id="btn-save-score"
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-indigo-700 transition-all"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Simpan Nilai Peserta</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
