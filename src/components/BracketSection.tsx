import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  GitBranch, 
  Trophy, 
  Crown, 
  Medal, 
  Users, 
  Sparkles, 
  Shuffle, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  ArrowRight, 
  Maximize2, 
  Minimize2, 
  Search, 
  Printer, 
  Layers, 
  Swords, 
  Check, 
  Award,
  Zap,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Clock,
  MapPin,
  RefreshCw,
  LayoutGrid,
  GitFork,
  Sliders
} from 'lucide-react';
import { 
  Tournament, 
  TournamentRound, 
  Participant, 
  PerformedRecord, 
  MatchPairing, 
  RoundWinner,
  BracketType
} from '../types';
import { playFanfareSound, playTickSound } from '../lib/audio';
import { 
  advanceMatchWinner, 
  shuffleOrSeedBracket, 
  generateBracketByFormat,
  BRACKET_FORMAT_OPTIONS 
} from '../lib/bracketHelper';

interface BracketSectionProps {
  tournament: Tournament;
  onUpdateTournament: (updated: Tournament) => void;
  onOpenScoreModal: (participant: Participant) => void;
  onOpenWinnerModal: (round: TournamentRound) => void;
  onOpenAdvanceRoundModal: () => void;
  onOpenEditTournament?: () => void;
  soundEnabled?: boolean;
}

export const BracketSection: React.FC<BracketSectionProps> = ({
  tournament,
  onUpdateTournament,
  onOpenScoreModal,
  onOpenWinnerModal,
  onOpenAdvanceRoundModal,
  onOpenEditTournament,
  soundEnabled = true
}) => {
  const [viewType, setViewType] = useState<'knockout' | 'progression'>('knockout');
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [editingMatch, setEditingMatch] = useState<{ roundId: string; match: MatchPairing } | null>(null);

  // Quick Format Switcher State
  const [selectedFormat, setSelectedFormat] = useState<BracketType>(tournament.bracketType || 'single_elimination');
  const [selectedSessionSize, setSelectedSessionSize] = useState<number>(
    tournament.participantsPerSession || (tournament.bracketType === 'multi_heats' ? 4 : 2)
  );
  const [selectedQualifiersPerSession, setSelectedQualifiersPerSession] = useState<number>(
    tournament.qualifiersPerSession || 1
  );

  const activeRound = tournament.rounds.find(r => r.id === tournament.currentRoundId) || tournament.rounds[0];

  // Lookup map for participants
  const participantMap = useMemo(() => {
    const map = new Map<string, Participant>();
    tournament.participants.forEach(p => map.set(p.id, p));
    return map;
  }, [tournament.participants]);

  // Lookup map for performed records
  const recordMap = useMemo(() => {
    const map = new Map<string, PerformedRecord>();
    tournament.performedRecords.forEach(rec => {
      map.set(`${rec.roundId}_${rec.participantId}`, rec);
    });
    return map;
  }, [tournament.performedRecords]);

  // Matchups fallback
  const getRoundMatchups = (round: TournamentRound): MatchPairing[] => {
    if (round.matchPairings && round.matchPairings.length > 0) {
      return round.matchPairings;
    }
    return [];
  };

  // Switch Format & Re-generate Bracket
  const handleApplyFormatChange = (
    newFormat: BracketType,
    newSessionSize: number,
    newQualifiers: number
  ) => {
    setSelectedFormat(newFormat);
    setSelectedSessionSize(newSessionSize);
    setSelectedQualifiersPerSession(newQualifiers);

    const updated = shuffleOrSeedBracket(
      tournament,
      'ordered',
      newFormat,
      newSessionSize,
      newQualifiers
    );
    if (soundEnabled) playTickSound();
    onUpdateTournament(updated);
  };

  // Advance Match Winner
  const handleSetMatchWinner = (roundId: string, matchId: string, winnerId: string) => {
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

  // Re-generate Bracket Tree
  const handleGenerateFullBracket = (mode: 'random' | 'seeded' | 'ordered' = 'ordered') => {
    const updated = shuffleOrSeedBracket(
      tournament,
      mode,
      selectedFormat,
      selectedSessionSize,
      selectedQualifiersPerSession
    );
    if (soundEnabled) {
      playTickSound();
    }
    onUpdateTournament(updated);
  };

  // Reset all winners
  const handleResetAllWinners = () => {
    if (!confirm('Reset semua status pemenang dan kosongkan bagan kembali ke babak awal?')) return;
    const updated = shuffleOrSeedBracket(
      tournament,
      'ordered',
      selectedFormat,
      selectedSessionSize,
      selectedQualifiersPerSession
    );
    onUpdateTournament(updated);
    if (soundEnabled) playTickSound();
  };

  // Save manual match editing
  const handleSaveEditedMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;

    const { roundId, match } = editingMatch;
    const targetRound = tournament.rounds.find(r => r.id === roundId);
    if (!targetRound) return;

    const currentMatches = getRoundMatchups(targetRound);
    const existingIndex = currentMatches.findIndex(m => m.id === match.id);
    let updatedMatches: MatchPairing[];

    if (existingIndex >= 0) {
      updatedMatches = currentMatches.map(m => m.id === match.id ? match : m);
    } else {
      updatedMatches = [...currentMatches, match];
    }

    const updatedRounds = tournament.rounds.map(r => {
      if (r.id === roundId) {
        return {
          ...r,
          matchPairings: updatedMatches
        };
      }
      return r;
    });

    onUpdateTournament({
      ...tournament,
      rounds: updatedRounds,
      updatedAt: new Date().toISOString()
    });

    setEditingMatch(null);
  };

  // Print bracket
  const handlePrintBracket = () => {
    window.print();
  };

  // Check if participant matches search
  const isParticipantHighlighted = (pId?: string) => {
    if (!searchTerm || !pId) return false;
    const p = participantMap.get(pId);
    if (!p) return false;
    const query = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.number.includes(query) ||
      p.organization?.toLowerCase().includes(query)
    );
  };

  // Final round champions
  const finalRound = tournament.rounds[tournament.rounds.length - 1];
  const finalWinners = finalRound?.winners || [];
  const grandChampion = finalWinners.find(w => w.rank === 1);
  const grandChampionParticipant = grandChampion ? participantMap.get(grandChampion.participantId) : null;

  const currentFormatConfig = BRACKET_FORMAT_OPTIONS.find(o => o.type === (tournament.bracketType || 'single_elimination')) || BRACKET_FORMAT_OPTIONS[0];

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      
      {/* 1. Header & Primary Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Visualisasi Bagan & Sesi Pertandingan
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white mt-1 flex items-center gap-2 font-display">
            <GitBranch className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Bagan Pertandingan & Sesi Turnamen</span>
          </h2>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Skema bagan duel 1v1, sesi gelombang panggung multi-peserta, atau grup penyisihan menuju gelar juara.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-200/80 p-1 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => setViewType('knockout')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-black transition-all ${
                viewType === 'knockout'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <Swords className="h-3.5 w-3.5" />
              <span>Bagan Pertandingan</span>
            </button>
            <button
              onClick={() => setViewType('progression')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-black transition-all ${
                viewType === 'progression'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Pohon Babak (Stages)</span>
            </button>
          </div>

          {/* Edit Lomba & Sesi Button */}
          {onOpenEditTournament && (
            <button
              onClick={onOpenEditTournament}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-black text-slate-800 shadow-xs hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              title="Edit nama lomba atau ubah penamaan babak/sesi"
            >
              <Edit3 className="h-4 w-4 text-indigo-600" />
              <span>Edit Nama & Sesi</span>
            </button>
          )}

          {/* Print Button */}
          <button
            onClick={handlePrintBracket}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-black text-slate-800 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
          >
            <Printer className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            <span className="hidden sm:inline">Cetak PDF</span>
          </button>

          {/* Advance Round */}
          <button
            onClick={onOpenAdvanceRoundModal}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Loloskan Babak</span>
          </button>
        </div>
      </div>

      {/* 2. BRACKET TYPE & PARTICIPANTS PER SESSION CONFIGURATION BAR */}
      <div className="rounded-2xl border-2 border-indigo-200 bg-white p-4 shadow-sm dark:border-indigo-900/60 dark:bg-slate-900">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Format Selector Pills */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Pilih Jenis Bagan:</span>
              </span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-mono font-extrabold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                {currentFormatConfig.title}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BRACKET_FORMAT_OPTIONS.map((opt) => {
                const isSelected = selectedFormat === opt.type;
                const IconComp = opt.type === 'single_elimination' 
                  ? Swords 
                  : opt.type === 'multi_heats' 
                  ? Users 
                  : opt.type === 'group_stage' 
                  ? LayoutGrid 
                  : GitFork;

                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => {
                      const newSize = opt.defaultParticipantsPerSession;
                      const newQual = (opt.type === 'multi_heats' || opt.type === 'group_stage') ? 2 : 1;
                      handleApplyFormatChange(opt.type, newSize, newQual);
                    }}
                    className={`flex items-center gap-2 rounded-xl border-2 p-2.5 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-xs ring-2 ring-indigo-400/20 font-black'
                        : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-850 font-bold text-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      <IconComp className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-black text-slate-950 dark:text-white truncate">
                        {opt.badge}
                      </div>
                      <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate">
                        {opt.type === 'single_elimination' ? '1v1 Duel' : opt.type === 'multi_heats' ? 'Sesi Gelombang' : opt.type === 'group_stage' ? 'Grup/Pool' : 'Gugur Ganda'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Session Size / Capacity Selector */}
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 border-t lg:border-t-0 lg:border-l border-slate-200 lg:pl-4 pt-3 lg:pt-0 dark:border-slate-800 shrink-0">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-extrabold text-slate-900 dark:text-white">
                  Kapasitas Peserta / Sesi:
                </label>
                <span className="font-mono text-[11px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
                  {selectedSessionSize} Peserta
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyFormatChange(selectedFormat, Math.max(2, selectedSessionSize - 1), selectedQualifiersPerSession)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 font-black text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  title="Kurangi 1 peserta per sesi"
                >
                  -
                </button>
                <input
                  type="number"
                  min={2}
                  max={32}
                  value={selectedSessionSize}
                  onChange={(e) => {
                    const val = Math.max(2, Math.min(32, Number(e.target.value) || 2));
                    handleApplyFormatChange(selectedFormat, val, selectedQualifiersPerSession);
                  }}
                  className="w-14 h-8 text-center font-mono font-black text-xs rounded-lg border-2 border-indigo-300 bg-white dark:border-indigo-700 dark:bg-slate-800 text-slate-950 dark:text-white focus:border-indigo-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleApplyFormatChange(selectedFormat, Math.min(32, selectedSessionSize + 1), selectedQualifiersPerSession)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 font-black text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  title="Tambah 1 peserta per sesi"
                >
                  +
                </button>

                <div className="flex items-center gap-1">
                  {[2, 3, 4, 5, 6, 8, 10].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleApplyFormatChange(selectedFormat, size, selectedQualifiersPerSession)}
                      className={`h-8 px-2 rounded-lg text-xs font-black transition-all ${
                        selectedSessionSize === size
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'border border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-extrabold text-slate-900 dark:text-white">
                  Lolos / Sesi:
                </label>
                <span className="font-mono text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded">
                  {selectedQualifiersPerSession} Lolos
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyFormatChange(selectedFormat, selectedSessionSize, Math.max(1, selectedQualifiersPerSession - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 font-black text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  title="Kurangi kuota lolos"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, selectedSessionSize - 1)}
                  value={selectedQualifiersPerSession}
                  onChange={(e) => {
                    const maxQ = Math.max(1, selectedSessionSize - 1);
                    const val = Math.max(1, Math.min(maxQ, Number(e.target.value) || 1));
                    handleApplyFormatChange(selectedFormat, selectedSessionSize, val);
                  }}
                  className="w-14 h-8 text-center font-mono font-black text-xs rounded-lg border-2 border-amber-300 bg-white dark:border-amber-700 dark:bg-slate-800 text-slate-950 dark:text-white focus:border-amber-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleApplyFormatChange(selectedFormat, selectedSessionSize, Math.min(selectedSessionSize - 1, selectedQualifiersPerSession + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 font-black text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  title="Tambah kuota lolos"
                >
                  +
                </button>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].filter(q => q < selectedSessionSize).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleApplyFormatChange(selectedFormat, selectedSessionSize, q)}
                      className={`h-8 px-2 rounded-lg text-xs font-black transition-all ${
                        selectedQualifiersPerSession === q
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'border border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Search & Seed Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border-2 border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        
        {/* Search / Highlight Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Sorot nama / nomor peserta di bagan..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-4 text-xs font-bold text-slate-950 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 font-bold text-slate-400 hover:text-slate-700 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Shuffle & Reset Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleGenerateFullBracket('ordered')}
              className="flex items-center gap-1 rounded-xl border-2 border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-extrabold text-indigo-900 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200 transition-colors"
              title="Bentuk bagan lengkap sesuai urutan nomor"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Bagan Penuh (1 s/d Final)</span>
            </button>
            <button
              onClick={() => handleGenerateFullBracket('random')}
              className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
              title="Acak posisi peserta di seluruh sesi/bagan"
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span>Acak Semua Slot</span>
            </button>
            <button
              onClick={() => handleGenerateFullBracket('seeded')}
              className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
              title="Pasangkan berdasarkan ranking skor / unggulan"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Unggulan (Seeded)</span>
            </button>
            <button
              onClick={handleResetAllWinners}
              className="flex items-center gap-1 rounded-xl border border-red-300 bg-red-50/70 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 transition-colors"
              title="Reset status pemenang kembali ke babak awal"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Pemenang</span>
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border-l border-slate-300 pl-2 dark:border-slate-700">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.1))}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Perkecil Bagan"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-mono font-extrabold text-slate-800 dark:text-slate-200 min-w-8 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Perbesar Bagan"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

      {/* 4. Main Interactive Canvas */}
      <div className="relative overflow-x-auto rounded-2xl border-2 border-slate-200 bg-slate-100/60 p-6 shadow-inner dark:border-slate-800 dark:bg-slate-950/60 min-h-[520px]">
        
        <div 
          className="transition-transform duration-200 origin-top-left"
          style={{ transform: `scale(${zoomLevel})`, minWidth: `${tournament.rounds.length * 340 + 300}px` }}
        >
          
          {viewType === 'knockout' ? (
            /* =========================================================================
               MODE 1: INTERACTIVE MATCH & SESSION CARDS (1v1, Multi-Heats, Group Stage)
               ========================================================================= */
            <div className="flex items-start gap-10 select-none py-2">
              
              {tournament.rounds.map((round, rIndex) => {
                const isCurrent = round.id === tournament.currentRoundId;
                const matches = getRoundMatchups(round);
                const isLastRound = rIndex === tournament.rounds.length - 1;

                return (
                  <div key={round.id} className="w-80 flex-shrink-0 flex flex-col">
                    
                    {/* Round Header Column Title */}
                    <div className="mb-5 rounded-2xl border-2 border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Babak {rIndex + 1}
                        </span>
                        {isCurrent && (
                          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-mono font-black uppercase text-white shadow-xs">
                            Babak Aktif
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-slate-950 dark:text-white truncate mt-1 font-display">
                        {round.name}
                      </h3>
                      <div className="mt-1 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                        <span>{round.participantIds.length} Peserta</span>
                        <span className="font-mono">{matches.length} Sesi / Match</span>
                      </div>
                    </div>

                    {/* Match Cards List */}
                    <div className="space-y-5 flex-1 flex flex-col justify-around">
                      {matches.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center text-xs font-bold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                          Belum ada sesi pertandingan
                        </div>
                      ) : (
                        matches.map((match, mIndex) => {
                          // Collect all participants in this match (handles 1v1 and Multi-Participants)
                          const allParticipantIds: string[] = match.participantIds && match.participantIds.length > 0
                            ? match.participantIds
                            : [match.participant1Id, match.participant2Id].filter(Boolean) as string[];

                          const isMultiSession = allParticipantIds.length > 2 || round.bracketType === 'multi_heats' || round.bracketType === 'group_stage';

                          return (
                            <div
                              key={match.id}
                              className="relative rounded-2xl border-2 border-slate-300 bg-white p-3.5 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600"
                            >
                              {/* Match Title & Edit */}
                              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2 text-xs font-black text-slate-800 dark:border-slate-800 dark:text-slate-200">
                                <span className="font-mono tracking-tight flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-indigo-600" />
                                  {match.title || `Match #${mIndex + 1}`}
                                </span>
                                <button
                                  onClick={() => setEditingMatch({ roundId: round.id, match })}
                                  className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 p-0.5"
                                  title="Edit Pasangan Match"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              {/* Participant Slots */}
                              <div className="space-y-2">
                                {allParticipantIds.length === 0 ? (
                                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-750 p-3 text-center text-xs font-bold text-slate-400 dark:text-slate-500 italic">
                                    {rIndex === 0 ? 'Slot Kosong' : `Menunggu Pemenang Babak #${rIndex}`}
                                  </div>
                                ) : (
                                  allParticipantIds.map((pId, pSlotIdx) => {
                                    const p = participantMap.get(pId);
                                    const rec = p ? recordMap.get(`${round.id}_${p.id}`) : null;
                                    const isWinner = match.winnerId === pId || (match.winnerIds && match.winnerIds.includes(pId));
                                    const isHighlighted = isParticipantHighlighted(pId);

                                    if (!p) {
                                      return (
                                        <div key={pSlotIdx} className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-750 p-2 text-xs text-slate-400 italic">
                                          <span className="h-6 w-6 rounded-lg border border-dashed border-slate-400 flex items-center justify-center text-[10px] font-mono font-bold">
                                            {pSlotIdx + 1}
                                          </span>
                                          <span>TBD / Menunggu</span>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div
                                        key={p.id}
                                        onClick={() => handleSetMatchWinner(round.id, match.id, p.id)}
                                        className={`flex items-center justify-between rounded-xl p-2.5 transition-all cursor-pointer ${
                                          isWinner
                                            ? 'bg-amber-100/80 border-2 border-amber-500 text-slate-950 dark:bg-amber-950/50 dark:border-amber-400 dark:text-amber-100 font-extrabold shadow-sm'
                                            : isHighlighted
                                            ? 'bg-indigo-50 border-2 border-indigo-600 dark:bg-indigo-950/60 dark:border-indigo-400'
                                            : 'bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 dark:bg-slate-850 dark:border-slate-750 dark:hover:border-indigo-600'
                                        }`}
                                        title={isWinner ? 'Batalkan status pemenang' : 'Klik untuk memilih pemenang & loloskan'}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                          <div
                                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-mono font-black text-white shadow-xs"
                                            style={{ backgroundColor: p.avatarColor }}
                                          >
                                            {p.number}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="text-xs font-extrabold text-slate-950 dark:text-white truncate flex items-center gap-1">
                                              <span>{p.name}</span>
                                              {isWinner && <Crown className="h-3.5 w-3.5 text-amber-500 inline shrink-0" />}
                                            </div>
                                            {p.organization && (
                                              <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 truncate">
                                                {p.organization}
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Score & Action Button */}
                                        <div className="flex items-center gap-2 ml-2" onClick={(e) => e.stopPropagation()}>
                                          <button
                                            onClick={() => onOpenScoreModal(p)}
                                            className="text-right hover:opacity-80 transition-opacity"
                                            title="Input / Edit Nilai"
                                          >
                                            <span className={`font-mono text-xs font-black ${
                                              rec?.hasScoreEntered ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                                            }`}>
                                              {rec?.hasScoreEntered ? rec.totalScore : '-'}
                                            </span>
                                          </button>
                                          <button
                                            onClick={() => handleSetMatchWinner(round.id, match.id, p.id)}
                                            className={`rounded-lg p-1.5 transition-all ${
                                              isWinner
                                                ? 'bg-amber-500 text-slate-950 shadow-xs'
                                                : 'text-slate-400 hover:text-amber-600 hover:bg-slate-200 dark:hover:bg-slate-800'
                                            }`}
                                            title={isWinner ? 'Batalkan Pemenang' : 'Pilih Pemenang & Loloskan'}
                                          >
                                            <Check className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              {/* Branch Connector Line */}
                              {!isLastRound && (
                                <div className="hidden lg:block absolute -right-5 top-1/2 w-5 h-[2px] bg-slate-300 dark:bg-slate-700 pointer-events-none" />
                              )}

                            </div>
                          );
                        })
                      )}
                    </div>

                  </div>
                );
              })}

              {/* GRAND CHAMPION APEX NODE */}
              <div className="w-72 flex-shrink-0 flex flex-col justify-center select-none">
                <div className="rounded-3xl border-3 border-amber-400 bg-gradient-to-b from-amber-400/20 via-white to-amber-400/10 p-6 text-center shadow-xl dark:from-amber-950/60 dark:via-slate-900 dark:to-slate-900 dark:border-amber-500">
                  
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg">
                    <Trophy className="h-8 w-8" />
                  </div>

                  <span className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 block mb-1">
                    JUARA UTAMA TURNAMEN
                  </span>

                  {grandChampionParticipant ? (
                    <div>
                      <div
                        className="mx-auto my-3 flex h-14 w-14 items-center justify-center rounded-2xl font-mono text-xl font-black text-white shadow-md"
                        style={{ backgroundColor: grandChampionParticipant.avatarColor }}
                      >
                        {grandChampionParticipant.number}
                      </div>
                      <h4 className="text-lg font-black text-slate-950 dark:text-white truncate font-display">
                        {grandChampionParticipant.name}
                      </h4>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400 truncate mt-0.5">
                        {grandChampionParticipant.organization || 'Pemenang Utama'}
                      </p>
                      <div className="mt-4 rounded-xl bg-amber-400/30 py-1.5 font-mono text-sm font-black text-amber-950 dark:text-amber-200 border border-amber-400/40">
                        {grandChampion?.score || 0} Poin
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 my-3">
                        Menunggu Penentuan Babak Final
                      </p>
                      <button
                        onClick={() => finalRound && onOpenWinnerModal(finalRound)}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 shadow-md hover:bg-amber-400 transition-colors cursor-pointer"
                      >
                        <Crown className="h-4 w-4" />
                        <span>Pilih Juara</span>
                      </button>
                    </div>
                  )}

                </div>
              </div>

            </div>
          ) : (
            /* =========================================================================
               MODE 2: PROGRESSION STAGE TREE (QUALIFIER PIPELINE ACROSS ALL ROUNDS)
               ========================================================================= */
            <div className="flex items-start gap-8 select-none py-2">
              {tournament.rounds.map((round, rIdx) => {
                const isCurrent = round.id === tournament.currentRoundId;
                const roundParticipants = tournament.participants.filter(p => round.participantIds.includes(p.id));
                const qualifiersCount = round.qualifiersCount || 3;
                const roundWinners = round.winners || [];
                const winnerMap = new Map<string, RoundWinner>(roundWinners.map(w => [w.participantId, w]));

                const rankedRoundParticipants = [...roundParticipants].sort((a, b) => {
                  const recA = recordMap.get(`${round.id}_${a.id}`);
                  const recB = recordMap.get(`${round.id}_${b.id}`);
                  const scoreA = recA?.hasScoreEntered ? recA.totalScore : -1;
                  const scoreB = recB?.hasScoreEntered ? recB.totalScore : -1;
                  return scoreB - scoreA;
                });

                return (
                  <div key={round.id} className="w-84 flex-shrink-0 flex flex-col">
                    <div className="mb-4 rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Tahap {rIdx + 1}
                        </span>
                        {isCurrent ? (
                          <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-mono font-black uppercase text-white">
                            Babak Aktif
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-mono font-black uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {round.status}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-slate-950 dark:text-white mt-1 font-display">
                        {round.name}
                      </h3>
                      <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                        <span>{roundParticipants.length} Peserta</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          Top {qualifiersCount} Lolos
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
                      {rankedRoundParticipants.map((p, idx) => {
                        const rec = recordMap.get(`${round.id}_${p.id}`);
                        const hasScore = rec?.hasScoreEntered;
                        const isWinner = winnerMap.has(p.id);
                        const winnerInfo = winnerMap.get(p.id);
                        const isQualified = idx < qualifiersCount && hasScore;
                        const isHighlighted = isParticipantHighlighted(p.id);

                        return (
                          <div
                            key={p.id}
                            className={`rounded-2xl border-2 p-3 transition-all ${
                              isHighlighted
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60'
                                : isWinner
                                ? 'border-amber-400 bg-amber-50 dark:border-amber-500 dark:bg-amber-950/30 font-bold'
                                : isQualified
                                ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-700 dark:bg-emerald-950/30'
                                : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-black ${
                                  idx === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                                }`}>
                                  #{idx + 1}
                                </span>
                                <div
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-mono font-black text-white shadow-xs"
                                  style={{ backgroundColor: p.avatarColor }}
                                >
                                  {p.number}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-xs font-extrabold text-slate-950 dark:text-white truncate">
                                    {p.name}
                                  </h4>
                                  {p.organization && (
                                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                                      {p.organization}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <button
                                  onClick={() => onOpenScoreModal(p)}
                                  className="hover:opacity-80"
                                  title="Input / Edit Nilai"
                                >
                                  <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                                    {hasScore ? `${rec.totalScore} Pts` : 'Belum dinilai'}
                                  </span>
                                </button>
                                <div className="mt-0.5">
                                  {winnerInfo ? (
                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black text-slate-950">
                                      👑 {winnerInfo.title}
                                    </span>
                                  ) : isQualified ? (
                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-200 px-2 py-0.5 text-[9px] font-black text-emerald-950 dark:bg-emerald-900 dark:text-emerald-200">
                                      ✓ Lolos
                                    </span>
                                  ) : hasScore ? (
                                    <span className="text-[9px] font-bold text-slate-500">
                                      Gugur
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                                      Menunggu
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* Manual Match Editing Modal */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-black text-slate-950 dark:text-white mb-1 font-display">
              Atur Pertandingan / Sesi Bagan
            </h3>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-4">
              Sesuaikan judul match, peserta yang bertanding, dan arena/jadwal pertandingan.
            </p>

            <form onSubmit={handleSaveEditedMatch} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                  Judul / Nomor Match
                </label>
                <input
                  type="text"
                  value={editingMatch.match.title || ''}
                  onChange={(e) => setEditingMatch({
                    ...editingMatch,
                    match: { ...editingMatch.match, title: e.target.value }
                  })}
                  placeholder="Contoh: Semifinal A, Pertandingan #1, Sesi 1"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-950 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                  Peserta 1
                </label>
                <select
                  value={editingMatch.match.participant1Id || ''}
                  onChange={(e) => setEditingMatch({
                    ...editingMatch,
                    match: { ...editingMatch.match, participant1Id: e.target.value || undefined }
                  })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-950 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">-- Kosong / TBD --</option>
                  {tournament.participants.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.number} - {p.name} {p.organization ? `(${p.organization})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                  Peserta 2 (Lawan)
                </label>
                <select
                  value={editingMatch.match.participant2Id || ''}
                  onChange={(e) => setEditingMatch({
                    ...editingMatch,
                    match: { ...editingMatch.match, participant2Id: e.target.value || undefined }
                  })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-950 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">-- Kosong / BYE / TBD --</option>
                  {tournament.participants.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.number} - {p.name} {p.organization ? `(${p.organization})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="rounded-xl px-4 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-indigo-700 shadow-xs cursor-pointer"
                >
                  Simpan Pasangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
