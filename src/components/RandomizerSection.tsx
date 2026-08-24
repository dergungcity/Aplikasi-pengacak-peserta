import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Dice5, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  Award, 
  Users, 
  Play, 
  Flame, 
  HelpCircle,
  Download
} from 'lucide-react';
import { Participant, Tournament, TournamentRound, DrawStyle } from '../types';
import { playTickSound, playFanfareSound } from '../lib/audio';

interface RandomizerSectionProps {
  tournament: Tournament;
  currentRound: TournamentRound;
  onDrawComplete: (drawnParticipants: Participant[]) => void;
  onOpenScoreModal: (participant: Participant) => void;
  soundEnabled: boolean;
  onResetRoundDraws: () => void;
  onOpenParticipantManager?: () => void;
}

export const RandomizerSection: React.FC<RandomizerSectionProps> = ({
  tournament,
  currentRound,
  onDrawComplete,
  onOpenScoreModal,
  soundEnabled,
  onResetRoundDraws,
  onOpenParticipantManager
}) => {
  // Determine available pool for current round
  const roundPerformedIds = new Set(
    tournament.performedRecords
      .filter(r => r.roundId === currentRound.id)
      .map(r => r.participantId)
  );

  const eligibleParticipants = tournament.participants.filter(p => 
    currentRound.participantIds.includes(p.id)
  );

  const availablePool = eligibleParticipants.filter(p => !roundPerformedIds.has(p.id));
  const performedParticipants = eligibleParticipants.filter(p => roundPerformedIds.has(p.id));

  // Batch count state
  const [batchCount, setBatchCount] = useState<number>(1);
  const [drawStyle, setDrawStyle] = useState<DrawStyle>('slot');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Animation states
  const [isDrawing, setIsDrawing] = useState(false);
  const [animatedDisplay, setAnimatedDisplay] = useState<Participant[]>([]);
  const [lastDrawn, setLastDrawn] = useState<Participant[]>([]);

  const effectiveBatchCount = Math.min(batchCount, availablePool.length);

  // Trigger Confetti
  const triggerCelebration = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  const startDraw = () => {
    if (availablePool.length === 0 || isDrawing) return;

    const countToDraw = Math.min(batchCount, availablePool.length);
    setIsDrawing(true);
    setLastDrawn([]);

    // Pick random participants
    const shuffled = [...availablePool].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, countToDraw);

    let tickCount = 0;
    const maxTicks = 25;
    const intervalTime = 60;

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
        triggerCelebration();

        onDrawComplete(chosen);
      }
    }, intervalTime);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Geometric Header with Pool Status */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900 p-6 text-white shadow-sm border border-slate-800">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Babak Berjalan:
              </span>
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-md text-xs font-bold uppercase tracking-wider">
                {currentRound.name}
              </span>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                (Target Lolos: <strong className="text-white">Top {currentRound.qualifiersCount}</strong>)
              </span>
            </div>
            <h1 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-white">
              Sistem Undian Urutan & Penjurian
            </h1>
            <p className="mt-1 text-xs text-slate-400 max-w-xl">
              Peserta yang terpilih akan otomatis diarsipkan dari pool antrean babak ini untuk menjamin keadilan undian.
            </p>
          </div>

          {/* Monospace Pool Indicator */}
          <div className="flex items-center gap-4 bg-slate-850 border border-slate-800 rounded-lg p-3 sm:px-5">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none mb-1">
                Sisa di Pool
              </p>
              <p className="text-xl font-mono font-bold leading-none text-indigo-400">
                {String(availablePool.length).padStart(3, '0')} <span className="text-xs text-slate-500 font-sans">/ {String(eligibleParticipants.length).padStart(3, '0')}</span>
              </p>
            </div>
            <div className="h-8 w-px bg-slate-750" />
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none mb-1">
                Sudah Tampil
              </p>
              <p className="text-xl font-mono font-bold leading-none text-emerald-400">
                {String(performedParticipants.length).padStart(3, '0')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Draw Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Left 8 Cols: Raffle Stage */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            
            {/* Geometric Subtle Background Motif */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <div className="w-64 h-64 border-[24px] border-indigo-600 rounded-full" />
            </div>

            {/* Stage Title */}
            <div className="text-center">
              <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                {isDrawing ? 'Mengacak Peserta...' : lastDrawn.length > 0 ? 'Peserta Terpilih Tampil' : 'Panggung Undian Peserta'}
              </h2>
            </div>

            {/* Showcase Stage Arena */}
            <div className="my-6 min-h-[190px] flex flex-col items-center justify-center content-center">
              
              {availablePool.length === 0 && lastDrawn.length === 0 ? (
                <div className="text-center py-6">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Semua Peserta Selesai Tampil
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm">
                    Seluruh peserta pada babak ini telah diundi. Silakan buka tab <strong>Skor & Babak</strong> untuk evaluasi hasil.
                  </p>
                </div>
              ) : isDrawing ? (
                <div className="w-full text-center space-y-4">
                  <div className="flex flex-wrap justify-center gap-4">
                    {animatedDisplay.map((p, idx) => (
                      <div
                        key={idx}
                        className="px-6 py-5 bg-indigo-600 text-white rounded-lg shadow-lg flex flex-col items-center min-w-[190px] animate-pulse border border-indigo-500"
                      >
                        <span className="text-xs opacity-75 font-mono mb-1 tracking-wider">#{p.number}</span>
                        <span className="text-lg font-bold truncate max-w-[160px]">{p.name}</span>
                        <span className="text-[10px] text-indigo-200 mt-0.5 truncate max-w-[160px]">{p.organization || 'Peserta'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : lastDrawn.length > 0 ? (
                <div className="w-full text-center space-y-4">
                  <div className="flex flex-wrap justify-center gap-4">
                    {lastDrawn.map((p) => {
                      const record = tournament.performedRecords.find(
                        r => r.roundId === currentRound.id && r.participantId === p.id
                      );
                      const hasScore = record?.hasScoreEntered;

                      return (
                        <div
                          key={p.id}
                          className="px-6 py-5 bg-indigo-600 text-white rounded-lg shadow-lg flex flex-col items-center min-w-[200px] border border-indigo-500/60 transform transition-transform hover:scale-102"
                        >
                          <span className="text-xs opacity-75 font-mono mb-1 tracking-wider">#{p.number}</span>
                          <span className="text-xl font-bold truncate max-w-[180px]">{p.name}</span>
                          {p.organization && (
                            <span className="text-[11px] text-indigo-200 mt-0.5 truncate max-w-[180px]">{p.organization}</span>
                          )}

                          <div className="mt-4 w-full pt-3 border-t border-indigo-500/40">
                            <button
                              id={`btn-score-lastdrawn-${p.id}`}
                              onClick={() => onOpenScoreModal(p)}
                              className="w-full py-1.5 px-3 bg-white text-indigo-700 hover:bg-indigo-50 rounded-md text-xs font-bold shadow-xs transition-colors"
                            >
                              {hasScore ? `Skor: ${record.totalScore} Poin` : 'Input Nilai Juri'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                    <Dice5 className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Siap Mengundi {effectiveBatchCount} Peserta
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 max-w-sm">
                    Tentukan jumlah peserta lalu klik tombol eksekusi undian di bawah.
                  </p>
                </div>
              )}

            </div>

            {/* Controls Bar: Batch count input & Generate Raffle Button */}
            <div className="w-full max-w-lg mx-auto pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
              
              {/* Batch Size Selection */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-850">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Jumlah Peserta Per Sesi Undian:</span>
                  </label>
                  <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                    {effectiveBatchCount} Peserta Terpilih
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Stepper Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isDrawing || batchCount <= 1}
                      onClick={() => setBatchCount(prev => Math.max(1, prev - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white font-black text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-xs"
                      title="Kurangi 1 peserta"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, availablePool.length)}
                      value={batchCount}
                      disabled={isDrawing || availablePool.length === 0}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(availablePool.length || 1, Number(e.target.value) || 1));
                        setBatchCount(val);
                      }}
                      className="w-14 h-9 text-center font-mono font-black text-xs rounded-lg border-2 border-indigo-300 bg-white dark:border-indigo-700 dark:bg-slate-800 text-slate-950 dark:text-white focus:border-indigo-600 focus:outline-none shadow-xs"
                    />
                    <button
                      type="button"
                      disabled={isDrawing || batchCount >= availablePool.length}
                      onClick={() => setBatchCount(prev => Math.min(availablePool.length, prev + 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white font-black text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-xs"
                      title="Tambah 1 peserta"
                    >
                      +
                    </button>
                  </div>

                  {/* Preset Pills */}
                  <div className="flex-1 flex items-center gap-1 overflow-x-auto min-w-[200px]">
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                      <button
                        key={num}
                        id={`btn-batch-${num}`}
                        disabled={isDrawing || num > availablePool.length}
                        onClick={() => setBatchCount(num)}
                        className={`flex-1 min-w-[32px] py-1.5 text-xs font-black rounded-lg border transition-all ${
                          batchCount === num
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-400/30'
                            : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <span>Sisa antrean: <strong>{availablePool.length}</strong> peserta</span>
                  {availablePool.length > 0 && (
                    <span>
                      Est. <strong>{Math.ceil(availablePool.length / Math.max(1, batchCount))}</strong> sesi undian tersisa
                    </span>
                  )}
                </div>
              </div>

              {/* Raffle Execution Button */}
              <button
                id="btn-start-draw"
                disabled={isDrawing || availablePool.length === 0}
                onClick={startDraw}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all h-[44px] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>{isDrawing ? 'Mengundi...' : `Undi Sesi Sekarang (${effectiveBatchCount} Peserta)`}</span>
              </button>
            </div>

            <p className="mt-4 text-center text-[11px] text-slate-400 italic">
              *Peserta yang terpilih akan secara otomatis dikeluarkan dari antrean undian babak ini.
            </p>

          </div>

          {/* Bottom Table: Peserta Yang Sudah Tampil */}
          {performedParticipants.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Rekap Tampil ({performedParticipants.length} Peserta)
                  </h3>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Diarsipkan dari Pool
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {performedParticipants.map((p) => {
                  const record = tournament.performedRecords.find(
                    r => r.roundId === currentRound.id && r.participantId === p.id
                  );

                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-slate-50/60 p-3 hover:bg-white transition-all dark:border-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-slate-500">#{p.number}</span>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {p.name}
                          </h5>
                          <span className="text-[10px] text-slate-400">
                            {p.organization || `Urutan #${record?.drawnOrder || '-'}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {record?.hasScoreEntered ? (
                          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {record.totalScore} Pts
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded dark:bg-amber-950 dark:text-amber-400">
                            Belum Dinilai
                          </span>
                        )}

                        <button
                          id={`btn-score-list-${p.id}`}
                          onClick={() => onOpenScoreModal(p)}
                          className="rounded-md bg-white p-1 text-slate-600 border border-slate-200 shadow-xs hover:text-indigo-600 hover:border-indigo-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                          title="Input Nilai"
                        >
                          <Award className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right 4 Cols: Live Scoring & Pool Database Panel */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col">
            
            {/* Header: Live Scoring with Auto-Saving */}
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex justify-between items-center dark:bg-slate-850 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Antrean Undian ({availablePool.length})
                </h3>
              </div>
              {onOpenParticipantManager && (
                <button
                  type="button"
                  onClick={onOpenParticipantManager}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Kelola / Hapus</span>
                </button>
              )}
            </div>

            {/* List of remaining participants in pool */}
            <div className="p-3 max-h-[420px] overflow-y-auto space-y-1.5">
              {availablePool.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Semua peserta telah terpilih.
                </div>
              ) : (
                availablePool.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 text-xs hover:border-slate-200 hover:bg-white transition-all dark:border-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[11px] font-bold text-slate-400">
                        #{p.number}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                          {p.name}
                        </div>
                        {p.organization && (
                          <div className="text-[10px] text-slate-400">
                            {p.organization}
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      Pos {idx + 1}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Reset Action */}
            {performedParticipants.length > 0 && (
              <div className="p-3 bg-slate-50 border-t border-slate-100 dark:bg-slate-850 dark:border-slate-800">
                {showConfirmReset ? (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 dark:bg-rose-950/40 dark:border-rose-800 animate-in fade-in text-center space-y-2">
                    <p className="text-[11px] font-bold text-rose-800 dark:text-rose-200">
                      Reset urutan tampil babak ini?
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowConfirmReset(false)}
                        className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onResetRoundDraws();
                          setShowConfirmReset(false);
                        }}
                        className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded hover:bg-rose-700 cursor-pointer"
                      >
                        Ya, Reset
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(true)}
                    className="w-full py-1.5 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Reset Undian Babak Ini
                  </button>
                )}
              </div>
            )}

          </div>

          {/* Quick Guide Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-850">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Protokol Sistem Lomba</span>
            </h4>
            <ol className="list-decimal list-inside text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <li>Pilih kuantitas undi (1 - 4 peserta).</li>
              <li>Jalankan <strong>Generate Raffle</strong>.</li>
              <li>Peserta langsung dipindahkan ke antrean tampil.</li>
              <li>Input evaluasi skor pada tab Skor & Babak.</li>
            </ol>
          </div>

        </div>

      </div>

    </div>
  );
};
