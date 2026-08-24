import React, { useState } from 'react';
import { 
  X, 
  Trophy, 
  Plus, 
  Trash2, 
  Layers, 
  Users, 
  Calendar, 
  Search, 
  Edit3, 
  Tag, 
  Check, 
  FolderOpen,
  ArrowRight
} from 'lucide-react';
import { Tournament } from '../types';

interface TournamentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournaments: Tournament[];
  currentTournamentId: string | null;
  onSelectTournament: (tournament: Tournament) => void;
  onDeleteTournament: (id: string) => void;
  onOpenCreateNew: () => void;
  onEditTournament: (tournament: Tournament) => void;
}

export const TournamentHistoryModal: React.FC<TournamentHistoryModalProps> = ({
  isOpen,
  onClose,
  tournaments,
  currentTournamentId,
  onSelectTournament,
  onDeleteTournament,
  onOpenCreateNew,
  onEditTournament
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredTournaments = tournaments.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 shadow-xs border border-indigo-100 dark:border-indigo-900">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
                Database & Riwayat Lomba
              </span>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">
                Daftar Turnamen & Sesi Tersimpan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola, ganti nama, atau buka data lomba yang pernah dibuat ({tournaments.length} tersimpan).
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama turnamen, sesi, atau kategori lomba..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-10 pr-3.5 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* List of saved tournaments */}
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {filteredTournaments.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {tournaments.length === 0 ? 'Belum ada turnamen yang tersimpan.' : 'Tidak ada turnamen yang cocok dengan pencarian.'}
            </div>
          ) : (
            filteredTournaments.map((t) => {
              const isCurrent = t.id === currentTournamentId;
              const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }) : '-';
              const isConfirmingDelete = confirmDeleteId === t.id;

              return (
                <div
                  key={t.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition-all ${
                    isCurrent
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs dark:border-indigo-500 dark:bg-indigo-950/30'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex-1 cursor-pointer" onClick={() => { onSelectTournament(t); onClose(); }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {t.name}
                      </h4>
                      {isCurrent && (
                        <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider text-white">
                          Sedang Aktif
                        </span>
                      )}
                      <span className="rounded-md bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {t.category || 'Umum'}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <span className="flex items-center gap-1 font-mono">
                        <Users className="h-3 w-3 text-slate-400" />
                        {t.participants.length} Peserta
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Layers className="h-3 w-3 text-slate-400" />
                        {t.rounds.length} Babak ({t.rounds.map(r => r.name).join(', ')})
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {dateStr}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {/* Edit Tournament Name & Session button */}
                    <button
                      type="button"
                      onClick={() => {
                        onEditTournament(t);
                        onClose();
                      }}
                      className="flex items-center gap-1 rounded-xl bg-white border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:border-indigo-300 shadow-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                      title="Edit nama lomba, kategori, atau nama sesi"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Edit Info</span>
                    </button>

                    {/* Open Button */}
                    <button
                      type="button"
                      onClick={() => { onSelectTournament(t); onClose(); }}
                      className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white hover:bg-indigo-700 shadow-xs cursor-pointer"
                    >
                      <span>Buka</span>
                    </button>

                    {/* Delete with inline confirmation */}
                    {tournaments.length > 1 && (
                      isConfirmingDelete ? (
                        <div className="flex items-center gap-1 bg-rose-100 dark:bg-rose-950/60 p-1 rounded-lg border border-rose-200 dark:border-rose-800 animate-in fade-in">
                          <span className="text-[10px] font-black text-rose-700 dark:text-rose-300 px-1">
                            Hapus?
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteTournament(t.id)}
                            className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-black uppercase hover:bg-rose-700 cursor-pointer"
                          >
                            Ya
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(t.id)}
                          className="rounded-xl p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Hapus Turnamen Ini"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Action Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            onClick={() => { onOpenCreateNew(); onClose(); }}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Lomba / Turnamen Baru</span>
          </button>
          
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
