import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Award, 
  ArrowRight, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  Search, 
  Layers, 
  Medal,
  Crown,
  Printer,
  Edit3,
  PartyPopper,
  Star
} from 'lucide-react';
import { Tournament, TournamentRound, Participant, PerformedRecord, RoundWinner } from '../types';
import { playFanfareSound } from '../lib/audio';

interface LeaderboardSectionProps {
  tournament: Tournament;
  selectedRoundId: string;
  onSelectRound: (roundId: string) => void;
  onOpenScoreModal: (participant: Participant) => void;
  onOpenAdvanceRoundModal: () => void;
  onOpenWinnerModal: (round: TournamentRound) => void;
  onOpenEditTournament?: () => void;
  soundEnabled?: boolean;
}

export const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({
  tournament,
  selectedRoundId,
  onSelectRound,
  onOpenScoreModal,
  onOpenAdvanceRoundModal,
  onOpenWinnerModal,
  onOpenEditTournament,
  soundEnabled = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const activeRound = tournament.rounds.find(r => r.id === selectedRoundId) || tournament.rounds[0];
  const isCurrentActiveRound = activeRound?.id === tournament.currentRoundId;

  // Get participants for this selected round
  const roundParticipants = tournament.participants.filter(p => 
    activeRound.participantIds.includes(p.id)
  );

  // Get performed records for this round
  const records = tournament.performedRecords.filter(r => r.roundId === activeRound.id);
  const recordMap = new Map<string, PerformedRecord>();
  records.forEach(r => recordMap.set(r.participantId, r));

  // Map winners for easy lookup
  const winnerMap = new Map<string, RoundWinner>();
  if (activeRound.winners && activeRound.winners.length > 0) {
    activeRound.winners.forEach(w => winnerMap.set(w.participantId, w));
  }

  // Sort participants by totalScore desc, then by drawnOrder
  const rankedParticipants = [...roundParticipants].sort((a, b) => {
    const recA = recordMap.get(a.id);
    const recB = recordMap.get(b.id);
    const scoreA = recA?.hasScoreEntered ? recA.totalScore : -1;
    const scoreB = recB?.hasScoreEntered ? recB.totalScore : -1;

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    return (recA?.drawnOrder || 999) - (recB?.drawnOrder || 999);
  });

  const filteredRanked = rankedParticipants.filter(p => {
    const matchName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchNum = p.number.includes(searchTerm);
    const matchOrg = p.organization?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchName || matchNum || matchOrg;
  });

  const scoredCount = records.filter(r => r.hasScoreEntered).length;
  const qualifiersCount = activeRound.qualifiersCount || 3;
  const hasWinners = activeRound.winners && activeRound.winners.length > 0;

  // Trigger celebration fanfare and confetti
  const handleCelebrateWinners = () => {
    if (soundEnabled) {
      playFanfareSound();
    }
    confetti({
      particleCount: 160,
      spread: 100,
      origin: { y: 0.5 }
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Peringkat', 'Status Juara', 'Nomor', 'Nama Peserta', 'Instansi', ...tournament.scoringCriteria.map(c => c.name), 'Total Skor', 'Status Lolos', 'Catatan Juri'];
    const rows = rankedParticipants.map((p, index) => {
      const rec = recordMap.get(p.id);
      const rank = rec?.hasScoreEntered ? index + 1 : '-';
      const winner = winnerMap.get(p.id);
      const isQualified = index < qualifiersCount && rec?.hasScoreEntered;
      const critScores = tournament.scoringCriteria.map(c => rec?.scores?.[c.id] ?? 0);
      return [
        rank,
        `"${winner?.title || '-'}"`,
        `"${p.number}"`,
        `"${p.name}"`,
        `"${p.organization || ''}"`,
        ...critScores,
        rec?.hasScoreEntered ? rec.totalScore : 0,
        isQualified ? 'LOLOS KE BABAK BERIKUTNYA' : (rec?.hasScoreEntered ? 'TIDAK LOLOS' : 'BELUM DINILAI'),
        `"${rec?.judgeNotes || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_skor_${tournament.name.replace(/\s+/g, '_')}_${activeRound.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Winners Summary / Certificates
  const handlePrintWinners = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Action Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Database Penjurian & Pemenang
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Papan Peringkat & Juara Babak
          </h2>
          <p className="text-xs text-slate-400">
            Kalkulasi skor real-time, penentuan juara babak, dan kualifikasi ke babak berikutnya.
          </p>
        </div>

        {/* Action Buttons: Pick Winner, Export & Advance Round */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Pick / Manage Winners Button */}
          <button
            id="btn-pick-round-winners"
            onClick={() => onOpenWinnerModal(activeRound)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider shadow-xs transition-all ${
              hasWinners
                ? 'bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600'
                : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300'
            }`}
            title="Pilih dan tetapkan juara untuk babak ini"
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>{hasWinners ? 'Edit Pemenang Babak' : 'Pilih Pemenang Babak'}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            title="Download file Excel/CSV rekap nilai"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Advance Round Button */}
          {isCurrentActiveRound && (
            <button
              id="btn-advance-round"
              onClick={onOpenAdvanceRoundModal}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-indigo-700 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Loloskan ke Babak Lanjut</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Round Selection Tabs & Edit Sesi Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {tournament.rounds.map((round, idx) => {
            const isSelected = round.id === activeRound.id;
            const isCurrent = round.id === tournament.currentRoundId;
            const roundRecs = tournament.performedRecords.filter(r => r.roundId === round.id && r.hasScoreEntered);
            const roundHasWinners = round.winners && round.winners.length > 0;

            return (
              <button
                key={round.id}
                onClick={() => onSelectRound(round.id)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs dark:bg-indigo-600 dark:text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Babak {idx + 1}: {round.name}</span>
                {roundHasWinners && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-slate-950 text-[10px]" title="Sudah ada penetapan pemenang">
                    👑
                  </span>
                )}
                {isCurrent && (
                  <span className={`rounded px-1.5 py-0.2 text-[9px] uppercase font-mono font-bold tracking-wider ${
                    isSelected ? 'bg-indigo-500/30 text-indigo-200' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  }`}>
                    Aktif
                  </span>
                )}
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
                }`}>
                  {roundRecs.length}/{round.participantIds.length}
                </span>
              </button>
            );
          })}
        </div>

        {onOpenEditTournament && (
          <button
            type="button"
            onClick={onOpenEditTournament}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:border-indigo-300 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
            title="Edit nama lomba atau ubah penamaan babak/sesi"
          >
            <Edit3 className="h-3.5 w-3.5 text-indigo-600" />
            <span>Edit Nama Sesi / Babak</span>
          </button>
        )}
      </div>

      {/* Round Winners Showcase Podium (If Winners Are Set) */}
      {hasWinners && activeRound.winners && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 p-5 shadow-xs dark:border-amber-800/40 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-200/60 dark:border-amber-800/40">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
                <Crown className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Podium & Daftar Pemenang {activeRound.name}</span>
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {activeRound.winners.length} Juara Ditetapkan
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Hasil resmi penetapan juri untuk babak kompetisi ini.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCelebrateWinners}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-600 transition-all"
                title="Tampilkan konfeti dan musik selebrasi"
              >
                <PartyPopper className="h-3.5 w-3.5" />
                <span>Rayakan</span>
              </button>

              <button
                onClick={() => onOpenWinnerModal(activeRound)}
                className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:bg-slate-800 dark:text-amber-300"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Ubah</span>
              </button>
            </div>
          </div>

          {/* Podium Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4">
            {activeRound.winners.slice(0, 3).map((winner, idx) => {
              const participant = tournament.participants.find(p => p.id === winner.participantId);
              if (!participant) return null;

              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const isThird = idx === 2;

              return (
                <div
                  key={winner.participantId}
                  className={`relative flex flex-col justify-between rounded-xl border p-4 transition-all ${
                    isFirst
                      ? 'border-amber-400 bg-amber-100/50 shadow-xs dark:border-amber-600/60 dark:bg-amber-950/30 order-1 md:order-2'
                      : isSecond
                      ? 'border-slate-300 bg-slate-50 shadow-xs dark:border-slate-700 dark:bg-slate-850 order-2 md:order-1'
                      : 'border-amber-700/30 bg-amber-900/5 shadow-xs dark:border-amber-800/40 dark:bg-amber-950/20 order-3 md:order-3'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      isFirst
                        ? 'bg-amber-400 text-slate-950'
                        : isSecond
                        ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white'
                        : 'bg-amber-700 text-white'
                    }`}>
                      {isFirst ? <Crown className="h-3 w-3" /> : <Medal className="h-3 w-3" />}
                      <span>{winner.title}</span>
                    </span>

                    <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {winner.score} Pts
                    </span>
                  </div>

                  <div className="my-3 flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-mono font-bold text-white shadow-xs"
                      style={{ backgroundColor: participant.avatarColor }}
                    >
                      {participant.number}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {participant.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {participant.organization || 'Peserta Lomba'}
                      </p>
                    </div>
                  </div>

                  {winner.notes && (
                    <div className="text-[11px] italic text-slate-500 dark:text-slate-400 border-t border-black/5 dark:border-white/5 pt-2 mt-1">
                      "{winner.notes}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Extra Award Winners (Juara Harapan / Best Speaker, etc.) */}
          {activeRound.winners.length > 3 && (
            <div className="mt-3.5 pt-3 border-t border-amber-200/60 dark:border-amber-800/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Pemenang Kategori Tambahan / Harapan:
              </span>
              <div className="flex flex-wrap gap-2">
                {activeRound.winners.slice(3).map((winner) => {
                  const participant = tournament.participants.find(p => p.id === winner.participantId);
                  return (
                    <div
                      key={winner.participantId}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-850"
                    >
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {winner.title}:
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        #{participant?.number} {participant?.name}
                      </span>
                      <span className="font-mono text-slate-400">
                        ({winner.score} Pts)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Round Summary Card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Peserta Babak</span>
          <div className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-white">
            {String(roundParticipants.length).padStart(3, '0')} <span className="text-xs font-sans font-normal text-slate-400">Peserta</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status Penilaian</span>
          <div className="mt-1 font-mono text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {String(scoredCount).padStart(3, '0')} <span className="text-xs font-sans font-normal text-slate-400">/ {String(roundParticipants.length).padStart(3, '0')} Dinilai</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Kuota Lolos</span>
          <div className="mt-1 font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            Top {qualifiersCount} <span className="text-xs font-sans font-normal text-slate-400">Peringkat Tertinggi</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor, nama peserta, atau instansi..."
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <span className="text-xs font-mono text-slate-400">
          Menampilkan {filteredRanked.length} peserta
        </span>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            
            {/* Table Header */}
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 w-14 text-center">Rank</th>
                <th className="py-3 px-4 w-16">No</th>
                <th className="py-3 px-4">Nama Peserta</th>
                {tournament.scoringCriteria.map(crit => (
                  <th key={crit.id} className="py-3 px-3 text-center hidden md:table-cell">
                    {crit.name}
                    <span className="block text-[9px] font-normal text-slate-400">(Max {crit.maxScore})</span>
                  </th>
                ))}
                <th className="py-3 px-4 text-right">Total Skor</th>
                <th className="py-3 px-4 text-center">Status Kelolosan / Juara</th>
                <th className="py-3 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {filteredRanked.map((participant, index) => {
                const record = recordMap.get(participant.id);
                const hasScore = record?.hasScoreEntered;
                const isTopQualifier = index < qualifiersCount && hasScore;
                const winnerInfo = winnerMap.get(participant.id);
                
                return (
                  <tr
                    key={participant.id}
                    className={`transition-colors ${
                      winnerInfo
                        ? 'bg-amber-50/30 hover:bg-amber-50/50 dark:bg-amber-950/15 dark:hover:bg-amber-950/25'
                        : isTopQualifier
                        ? 'bg-indigo-50/20 hover:bg-indigo-50/40 dark:bg-indigo-950/10 dark:hover:bg-indigo-950/20'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center">
                        {hasScore ? (
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md font-mono text-xs font-bold ${
                            index === 0
                              ? 'bg-amber-400 text-slate-900 shadow-xs'
                              : index === 1
                              ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white'
                              : index === 2
                              ? 'bg-amber-700 text-white'
                              : isTopQualifier
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            #{index + 1}
                          </span>
                        ) : (
                          <span className="font-mono text-slate-400">-</span>
                        )}
                      </div>
                    </td>

                    {/* Number */}
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className="text-slate-600 dark:text-slate-400">
                        #{participant.number}
                      </span>
                    </td>

                    {/* Name & Org & Winner Badge */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {participant.name}
                        </span>
                        {winnerInfo && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-400/20 border border-amber-400/40 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                            👑 {winnerInfo.title}
                          </span>
                        )}
                      </div>
                      {participant.organization && (
                        <div className="text-[11px] text-slate-400">
                          {participant.organization}
                        </div>
                      )}
                      {record?.judgeNotes && (
                        <div className="mt-0.5 text-[11px] italic text-slate-400">
                          💬 "{record.judgeNotes}"
                        </div>
                      )}
                    </td>

                    {/* Scores per criteria */}
                    {tournament.scoringCriteria.map(crit => (
                      <td key={crit.id} className="py-3 px-3 text-center hidden md:table-cell font-mono text-slate-600 dark:text-slate-300">
                        {hasScore ? (record.scores?.[crit.id] ?? '-') : '-'}
                      </td>
                    ))}

                    {/* Total Score */}
                    <td className="py-3 px-4 text-right">
                      {hasScore ? (
                        <div>
                          <span className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400">
                            {record.totalScore}
                          </span>
                          <span className="block text-[9px] font-mono text-slate-400 uppercase">
                            {record.percentageScore.toFixed(0)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-sans text-[11px]">Belum dinilai</span>
                      )}
                    </td>

                    {/* Status Qualifiers / Winners */}
                    <td className="py-3 px-4 text-center">
                      {winnerInfo ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          <Crown className="h-3 w-3 text-amber-500" />
                          <span>{winnerInfo.title}</span>
                        </span>
                      ) : isTopQualifier ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Lolos Babak</span>
                        </span>
                      ) : hasScore ? (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Cadangan
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                          Menunggu
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenScoreModal(participant)}
                          className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                            hasScore
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'
                              : 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-700'
                          }`}
                        >
                          {hasScore ? 'Edit' : 'Nilai'}
                        </button>

                        <button
                          onClick={() => onOpenWinnerModal(activeRound)}
                          className={`rounded-md p-1 text-xs transition-all ${
                            winnerInfo
                              ? 'bg-amber-400 text-slate-950 hover:bg-amber-500'
                              : 'text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-slate-800 dark:hover:text-amber-400'
                          }`}
                          title="Tetapkan sebagai juara / kelola pemenang"
                        >
                          <Trophy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
};
