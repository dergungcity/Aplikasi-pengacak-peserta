import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Trophy, 
  Layers, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  Tag, 
  FileText,
  Clock,
  Radio
} from 'lucide-react';
import { Tournament, TournamentRound } from '../types';

interface EditTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  onSave: (updatedTournament: Tournament) => void;
}

const CATEGORY_PRESETS = [
  'Seni & Musik',
  'Keagamaan',
  'Olahraga',
  'Akademik & Cerdas Cermat',
  'Bakat & Kreativitas',
  'E-Sport & Game',
  'Pidato & Bahasa',
  'Umum'
];

const ROUND_NAME_PRESETS = [
  'Penyisihan',
  'Penyisihan Pagi',
  'Penyisihan Siang',
  'Sesi 1 (Grup A)',
  'Sesi 2 (Grup B)',
  'Babak 16 Besar',
  'Perempat Final',
  'Semifinal',
  'Final',
  'Grand Final',
  'Perebutan Juara 3'
];

export const EditTournamentModal: React.FC<EditTournamentModalProps> = ({
  isOpen,
  onClose,
  tournament,
  onSave
}) => {
  const [name, setName] = useState(tournament.name);
  const [category, setCategory] = useState(tournament.category);
  const [description, setDescription] = useState(tournament.description || '');
  const [rounds, setRounds] = useState<TournamentRound[]>(tournament.rounds || []);
  const [currentRoundId, setCurrentRoundId] = useState(tournament.currentRoundId);

  // Sync state whenever tournament prop changes or modal opens
  useEffect(() => {
    setName(tournament.name);
    setCategory(tournament.category);
    setDescription(tournament.description || '');
    setRounds(tournament.rounds || []);
    setCurrentRoundId(tournament.currentRoundId);
  }, [tournament, isOpen]);

  if (!isOpen) return null;

  const handleUpdateRoundName = (id: string, newName: string) => {
    setRounds(prev => prev.map(r => r.id === id ? { ...r, name: newName } : r));
  };

  const handleAddRound = () => {
    const nextRoundNumber = rounds.length + 1;
    const newRoundId = `r_${Date.now()}_${nextRoundNumber}`;
    const newRound: TournamentRound = {
      id: newRoundId,
      roundNumber: nextRoundNumber,
      name: nextRoundNumber === 2 ? 'Semifinal' : nextRoundNumber === 3 ? 'Final' : `Babak ${nextRoundNumber}`,
      status: 'waiting',
      qualifiersCount: 3,
      participantIds: tournament.participants.map(p => p.id),
      bracketType: tournament.bracketType || 'single_elimination'
    };
    setRounds([...rounds, newRound]);
  };

  const handleRemoveRound = (id: string) => {
    if (rounds.length <= 1) return;
    const updated = rounds.filter(r => r.id !== id).map((r, idx) => ({
      ...r,
      roundNumber: idx + 1
    }));
    setRounds(updated);
    if (currentRoundId === id) {
      setCurrentRoundId(updated[0].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updatedTournament: Tournament = {
      ...tournament,
      name: name.trim(),
      category: category.trim() || 'Umum',
      description: description.trim(),
      rounds: rounds.map(r => ({
        ...r,
        name: r.name.trim() || `Babak ${r.roundNumber}`
      })),
      currentRoundId: currentRoundId,
      updatedAt: new Date().toISOString()
    };

    onSave(updatedTournament);
    onClose();
  };

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
        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 shadow-xs border border-indigo-100 dark:border-indigo-900">
            <Edit3 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
              Pengaturan Identitas Turnamen
            </span>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              Edit Nama Lomba & Sesi / Babak
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ubah judul perlombaan, kategori, serta penamaan babak/sesi agar rapi saat disimpan.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Nama Lomba */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-indigo-600" />
              <span>Nama Lomba / Turnamen *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Lomba Dai Cilik 2026, Turnamen Futsal Cup Sesi 1..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* 2. Kategori Lomba */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-indigo-600" />
              <span>Kategori Perlombaan</span>
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Kategori Lomba (misal: Seni, Keagamaan, Olahraga)"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            {/* Quick Category Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] font-bold text-slate-400 mr-1">Saran:</span>
              {CATEGORY_PRESETS.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                    category === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Deskripsi / Lokasi / Keterangan */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-indigo-600" />
              <span>Deskripsi / Catatan Tambahan (Opsional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan juri, lokasi panggung, penyelenggara, atau waktu pelaksanaan..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* 4. Edit Nama-Nama Sesi / Babak */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-850/70">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                <span>Daftar Nama Babak & Sesi ({rounds.length})</span>
              </label>
              <button
                type="button"
                onClick={handleAddRound}
                className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Babak</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              Ketik nama khusus untuk setiap babak atau sesi lomba di bawah ini:
            </p>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {rounds.map((r, index) => {
                const isActive = r.id === currentRoundId;

                return (
                  <div
                    key={r.id}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition-all ${
                      isActive 
                        ? 'border-indigo-300 bg-white shadow-xs dark:border-indigo-700 dark:bg-slate-900' 
                        : 'border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-800/80'
                    }`}
                  >
                    {/* Active Radio Selector */}
                    <button
                      type="button"
                      onClick={() => setCurrentRoundId(r.id)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                      title={isActive ? "Babak ini sedang aktif berjalan" : "Klik untuk jadikan babak aktif"}
                    >
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        isActive ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isActive && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                    </button>

                    {/* Badge number */}
                    <span className="flex h-6 px-2 items-center justify-center rounded-md bg-slate-100 text-[10px] font-mono font-black text-slate-700 dark:bg-slate-700 dark:text-slate-200 shrink-0">
                      Babak {index + 1}
                    </span>

                    {/* Editable Round Name input */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={r.name}
                        onChange={(e) => handleUpdateRoundName(r.id, e.target.value)}
                        placeholder={`Nama Babak ${index + 1}`}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    {/* Quick suggestion dropdown / buttons */}
                    <div className="hidden sm:flex items-center gap-1">
                      {['Penyisihan', 'Semifinal', 'Final'].map((preset) => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => handleUpdateRoundName(r.id, preset)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-[10px] font-bold text-slate-600 dark:text-slate-300"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    {/* Delete button (only if > 1 round) */}
                    {rounds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRound(r.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                        title="Hapus Babak Ini"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
