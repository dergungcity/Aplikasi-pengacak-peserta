import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Users, Search, Check, Upload, CheckSquare, Square, AlertTriangle, RotateCcw } from 'lucide-react';
import { Participant, Tournament } from '../types';
import { getRandomColor } from '../lib/presets';

interface ParticipantManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  onUpdateParticipants: (updatedList: Participant[]) => void;
}

export const ParticipantManagerModal: React.FC<ParticipantManagerModalProps> = ({
  isOpen,
  onClose,
  tournament,
  onUpdateParticipants
}) => {
  const [participants, setParticipants] = useState<Participant[]>(tournament.participants);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);
  
  // Single Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newOrg, setNewOrg] = useState('');

  // Bulk mode
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Edit single
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editOrg, setEditOrg] = useState('');

  // Keep local state in sync whenever tournament or open state changes
  useEffect(() => {
    setParticipants(tournament.participants || []);
    setSelectedIds(new Set());
    setConfirmDeleteId(null);
    setShowConfirmClearAll(false);
  }, [tournament.participants, isOpen]);

  if (!isOpen) return null;

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const nextNum = newNumber.trim() || (participants.length + 1 < 10 ? `0${participants.length + 1}` : `${participants.length + 1}`);
    const newParticipant: Participant = {
      id: `p_${Date.now()}`,
      number: nextNum,
      name: newName.trim(),
      organization: newOrg.trim(),
      avatarColor: getRandomColor(),
      notes: ''
    };

    const updated = [...participants, newParticipant];
    setParticipants(updated);
    onUpdateParticipants(updated);
    setNewName('');
    setNewNumber('');
    setNewOrg('');
    setShowAddForm(false);
  };

  const handleStartEdit = (p: Participant) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditNumber(p.number);
    setEditOrg(p.organization || '');
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = (id: string) => {
    const updated = participants.map(p => {
      if (p.id === id) {
        return {
          ...p,
          name: editName.trim() || p.name,
          number: editNumber.trim() || p.number,
          organization: editOrg.trim()
        };
      }
      return p;
    });
    setParticipants(updated);
    onUpdateParticipants(updated);
    setEditingId(null);
  };

  // Immediate delete without window.confirm (using in-app UI)
  const handleDeleteDirect = (id: string) => {
    const updated = participants.filter(p => p.id !== id);
    setParticipants(updated);
    onUpdateParticipants(updated);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setConfirmDeleteId(null);
  };

  // Delete multiple selected participants
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const updated = participants.filter(p => !selectedIds.has(p.id));
    setParticipants(updated);
    onUpdateParticipants(updated);
    setSelectedIds(new Set());
  };

  // Clear all participants
  const handleClearAll = () => {
    setParticipants([]);
    onUpdateParticipants([]);
    setSelectedIds(new Set());
    setShowConfirmClearAll(false);
  };

  // Toggle selection for a participant
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filtered = participants.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.number.includes(searchTerm) ||
    p.organization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  const isAllFilteredSelected = filtered.length > 0 && filtered.every(p => selectedIds.has(p.id));

  const handleBulkImport = () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const startIndex = participants.length;
    const newItems: Participant[] = lines.map((line, idx) => {
      let number = startIndex + idx + 1 < 10 ? `0${startIndex + idx + 1}` : `${startIndex + idx + 1}`;
      let name = line;
      let org = '';

      const numMatch = line.match(/^(\d+)[\.\-\:\s]+(.*)/);
      if (numMatch) {
        number = parseInt(numMatch[1], 10) < 10 ? `0${parseInt(numMatch[1], 10)}` : `${numMatch[1]}`;
        name = numMatch[2].trim();
      }

      const orgMatch = name.match(/^(.*?)\s*[\(\[]([^()\[\]]+)[\)\]]$/);
      if (orgMatch) {
        name = orgMatch[1].trim();
        org = orgMatch[2].trim();
      }

      return {
        id: `p_${Date.now()}_${idx}`,
        number,
        name: name || `Peserta ${number}`,
        organization: org,
        avatarColor: getRandomColor(),
        notes: ''
      };
    });

    const updated = [...participants, ...newItems];
    setParticipants(updated);
    onUpdateParticipants(updated);
    setBulkText('');
    setShowBulkModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 shadow-xs border border-indigo-100 dark:border-indigo-900">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
                Database Peserta Lomba
              </span>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">
                Kelola & Hapus Peserta Turnamen
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total <strong>{participants.length}</strong> peserta aktif dalam turnamen ini.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-xs cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import Banyak</span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Peserta</span>
            </button>
          </div>
        </div>

        {/* Action Toolbar: Search, Select All, Bulk Delete & Clear All */}
        <div className="space-y-2.5 mb-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nomor, nama, atau asal instansi..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-10 pr-3.5 text-xs font-bold text-slate-950 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            
            {participants.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-xs cursor-pointer shrink-0"
                title={isAllFilteredSelected ? "Batalkan pilihan semua" : "Pilih semua peserta"}
              >
                {isAllFilteredSelected ? (
                  <CheckSquare className="h-4 w-4 text-indigo-600" />
                ) : (
                  <Square className="h-4 w-4 text-slate-400" />
                )}
                <span>{isAllFilteredSelected ? 'Semua Terpilih' : 'Pilih Semua'}</span>
              </button>
            )}
          </div>

          {/* Bulk Action Bar when items are selected */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-rose-50 border border-rose-200 p-2.5 px-3.5 dark:bg-rose-950/40 dark:border-rose-800 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-black text-rose-800 dark:text-rose-200">
                <Trash2 className="h-4 w-4 text-rose-600" />
                <span>{selectedIds.size} peserta dipilih</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-xs hover:bg-rose-700 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus {selectedIds.size} Peserta Terpilih</span>
                </button>
              </div>
            </div>
          )}

          {/* Confirm Clear All Alert */}
          {showConfirmClearAll && (
            <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 p-3 dark:bg-amber-950/40 dark:border-amber-800 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Yakin ingin menghapus seluruh {participants.length} peserta dari turnamen?</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmClearAll(false)}
                  className="px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-xs hover:bg-rose-700"
                >
                  Ya, Hapus Semua
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Single Add Form inline */}
        {showAddForm && (
          <form onSubmit={handleAddSingle} className="mb-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30 animate-in fade-in">
            <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-200 mb-2.5 uppercase tracking-wider">
              Tambah Peserta Baru:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div>
                <input
                  type="text"
                  placeholder="Nomor (mis: 01)"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Peserta *"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Asal / Instansi"
                  value={newOrg}
                  onChange={(e) => setNewOrg(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200/50 rounded-lg dark:text-slate-300"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-indigo-600 text-white text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-lg shadow-xs hover:bg-indigo-700 cursor-pointer"
              >
                Simpan Peserta
              </button>
            </div>
          </form>
        )}

        {/* Participants Table / List */}
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {participants.length === 0 ? 'Belum ada peserta yang terdaftar.' : 'Tidak ada peserta yang sesuai pencarian.'}
            </div>
          ) : (
            filtered.map((p) => {
              const isEditing = editingId === p.id;
              const isSelected = selectedIds.has(p.id);
              const isConfirmingDelete = confirmDeleteId === p.id;

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between rounded-xl border p-3 text-xs transition-all pt-2.5 ${
                    isSelected 
                      ? 'border-indigo-300 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/30' 
                      : 'border-slate-200/80 bg-slate-50/70 hover:bg-white dark:border-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2 mr-2">
                      <input
                        type="text"
                        value={editNumber}
                        onChange={(e) => setEditNumber(e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold dark:bg-slate-800 dark:border-slate-700"
                      />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="sm:col-span-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold dark:bg-slate-800 dark:border-slate-700"
                      />
                      <input
                        type="text"
                        value={editOrg}
                        onChange={(e) => setEditOrg(e.target.value)}
                        placeholder="Instansi"
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {/* Checkbox for batch selection */}
                      <button
                        type="button"
                        onClick={() => toggleSelect(p.id)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5 cursor-pointer"
                        title={isSelected ? "Batalkan pilihan" : "Pilih peserta ini"}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-indigo-600" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                        )}
                      </button>

                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-mono font-black text-white shadow-xs shrink-0"
                        style={{ backgroundColor: p.avatarColor }}
                      >
                        {p.number}
                      </span>
                      <div>
                        <div className="font-black text-slate-900 dark:text-white">
                          {p.name}
                        </div>
                        {p.organization ? (
                          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {p.organization}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic">
                            Nomor Urut: #{p.number}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isEditing ? (
                      <button
                        onClick={() => handleSaveEdit(p.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center gap-1 cursor-pointer"
                        title="Simpan Perubahan"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Simpan</span>
                      </button>
                    ) : isConfirmingDelete ? (
                      /* Inline Confirmation for instant 100% reliable deletion */
                      <div className="flex items-center gap-1 bg-rose-100 dark:bg-rose-950/60 p-1 rounded-lg border border-rose-200 dark:border-rose-800 animate-in fade-in">
                        <span className="text-[10px] font-black text-rose-700 dark:text-rose-300 px-1">
                          Hapus?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteDirect(p.id)}
                          className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-black uppercase hover:bg-rose-700 cursor-pointer"
                        >
                          Ya
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 rounded bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-300 cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Peserta"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          id={`btn-delete-participant-${p.id}`}
                          onClick={() => setConfirmDeleteId(p.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Hapus Peserta"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Clear All & Done buttons */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
          <div>
            {participants.length > 0 && !showConfirmClearAll && (
              <button
                type="button"
                onClick={() => setShowConfirmClearAll(true)}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Hapus Semua Peserta</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            Selesai
          </button>
        </div>

      </div>

      {/* Bulk Import Submodal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
              Import Banyak Peserta Sekaligus
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Ketik atau paste nama peserta di bawah (satu baris per peserta). Format nomor dan instansi dalam kurung <code>(Asal)</code> akan diproses otomatis.
            </p>
            <textarea
              rows={6}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="01. Peserta Satu (Asal Sekolah 1)&#10;02. Peserta Dua (Universitas A)&#10;03. Peserta Tiga"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs text-slate-900 font-mono font-medium focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBulkImport}
                className="bg-indigo-600 text-white text-xs font-black uppercase tracking-wider px-5 py-2 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Tambahkan ke Daftar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
