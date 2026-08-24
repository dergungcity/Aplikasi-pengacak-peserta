import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Plus, 
  Trash2, 
  Users, 
  Sliders, 
  Trophy, 
  CheckCircle, 
  Swords, 
  LayoutGrid, 
  GitFork, 
  Layers, 
  Check,
  Zap,
  Info
} from 'lucide-react';
import { TOURNAMENT_PRESETS, getRandomColor } from '../lib/presets';
import { generateBracketByFormat, BRACKET_FORMAT_OPTIONS } from '../lib/bracketHelper';
import { Participant, ScoringCriterion, Tournament, BracketType } from '../types';

interface TournamentSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tournament: Tournament) => void;
  userId: string;
  initialTournament?: Tournament | null;
}

export const TournamentSetupModal: React.FC<TournamentSetupModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userId,
  initialTournament
}) => {
  const [name, setName] = useState(initialTournament?.name || 'Lomba Bakat & Penampilan 2026');
  const [category, setCategory] = useState(initialTournament?.category || 'Seni & Pertunjukan');
  const [description, setDescription] = useState(initialTournament?.description || '');
  
  // Bracket type & session configuration
  const [bracketType, setBracketType] = useState<BracketType>(
    initialTournament?.bracketType || 'single_elimination'
  );
  const [participantsPerSession, setParticipantsPerSession] = useState<number>(
    initialTournament?.participantsPerSession || 
    (initialTournament?.bracketType === 'multi_heats' || initialTournament?.bracketType === 'group_stage' ? 4 : 2)
  );
  const [qualifiersPerSession, setQualifiersPerSession] = useState<number>(
    initialTournament?.qualifiersPerSession || 1
  );

  const [qualifiersCount, setQualifiersCount] = useState<number>(
    initialTournament?.rounds[0]?.qualifiersCount || 4
  );

  // Criteria
  const [criteria, setCriteria] = useState<ScoringCriterion[]>(
    initialTournament?.scoringCriteria || [
      { id: 'c1', name: 'Kualitas & Materi', maxScore: 100 },
      { id: 'c2', name: 'Penjiwaan & Eksekusi', maxScore: 100 },
      { id: 'c3', name: 'Penguasaan Panggung', maxScore: 100 }
    ]
  );

  // Participant input mode
  const [inputMode, setInputMode] = useState<'paste' | 'generate'>('paste');
  const [bulkText, setBulkText] = useState(
    initialTournament
      ? initialTournament.participants.map(p => `${p.number ? p.number + '. ' : ''}${p.name}${p.organization ? ' (' + p.organization + ')' : ''}`).join('\n')
      : '01. Ahmad Faiz (SMK Merdeka)\n02. Siti Rahmawati (SMA Bintang)\n03. Budi Santoso (Universitas Nusantara)\n04. Dewi Lestari (Sanggar Harmoni)\n05. Rian Pratama (Komunitas Vokal)\n06. Nadia Az-Zahra (SMA Teladan)\n07. Dimas Wicaksono (SMA 3)\n08. Clarissa Maharani (Studio Nada)\n09. Gilang Ramadhan (SMA Bakti)\n10. Putri Amelia (Institut Seni)'
  );
  const [genCount, setGenCount] = useState<number>(12);
  const [genPrefix, setGenPrefix] = useState('Peserta');

  if (!isOpen) return null;

  const applyPreset = (preset: typeof TOURNAMENT_PRESETS[0]) => {
    setName(preset.name);
    setCategory(preset.category);
    setCriteria(preset.criteria.map((c, i) => ({
      id: `c_${Date.now()}_${i}`,
      name: c.name,
      maxScore: c.maxScore
    })));
    setQualifiersCount(preset.qualifiersCount);
  };

  const addCriterion = () => {
    setCriteria([
      ...criteria,
      {
        id: `c_${Date.now()}`,
        name: `Kriteria ${criteria.length + 1}`,
        maxScore: 100
      }
    ]);
  };

  const removeCriterion = (id: string) => {
    if (criteria.length <= 1) return;
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const updateCriterion = (id: string, field: 'name' | 'maxScore', val: any) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  const parseParticipants = (): Participant[] => {
    if (inputMode === 'generate') {
      const generated: Participant[] = [];
      for (let i = 1; i <= genCount; i++) {
        const numStr = i < 10 ? `0${i}` : `${i}`;
        generated.push({
          id: `p_${Date.now()}_${i}`,
          number: numStr,
          name: `${genPrefix} ${numStr}`,
          avatarColor: getRandomColor(),
          notes: ''
        });
      }
      return generated;
    } else {
      const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
      return lines.map((line, idx) => {
        let number = (idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`);
        let name = line;
        let organization = '';

        const numMatch = line.match(/^(\d+)[\.\-\:\s]+(.*)/);
        if (numMatch) {
          number = parseInt(numMatch[1], 10) < 10 ? `0${parseInt(numMatch[1], 10)}` : `${numMatch[1]}`;
          name = numMatch[2].trim();
        }

        const orgMatch = name.match(/^(.*?)\s*[\(\[]([^()\[\]]+)[\)\]]$/);
        if (orgMatch) {
          name = orgMatch[1].trim();
          organization = orgMatch[2].trim();
        }

        return {
          id: `p_${Date.now()}_${idx}`,
          number,
          name: name || `Peserta ${number}`,
          organization,
          avatarColor: getRandomColor(),
          notes: ''
        };
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const participants = parseParticipants();
    if (participants.length === 0) {
      alert('Mohon masukkan minimal 1 peserta.');
      return;
    }

    const generatedRounds = generateBracketByFormat(
      participants,
      bracketType,
      participantsPerSession,
      qualifiersPerSession
    );
    const round1Id = initialTournament?.rounds[0]?.id || generatedRounds[0]?.id || `r_${Date.now()}_1`;

    const newTournament: Tournament = {
      id: initialTournament?.id || `tourn_${Date.now()}`,
      userId: userId || 'anonymous',
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      scoringCriteria: criteria,
      bracketType,
      participantsPerSession,
      qualifiersPerSession,
      rounds: initialTournament ? initialTournament.rounds : generatedRounds,
      currentRoundId: initialTournament ? initialTournament.currentRoundId : round1Id,
      participants,
      performedRecords: initialTournament?.performedRecords || [],
      createdAt: initialTournament?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(newTournament);
    onClose();
  };

  const selectedFormatConfig = BRACKET_FORMAT_OPTIONS.find(o => o.type === bracketType) || BRACKET_FORMAT_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="relative my-8 w-full max-w-3xl rounded-2xl border border-slate-300 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Konfigurasi Turnamen & Bagan Lomba
            </span>
            <h2 className="text-xl font-black text-slate-950 dark:text-white font-display">
              {initialTournament ? 'Pengaturan Format & Turnamen' : 'Buat Turnamen / Lomba Baru'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Pilih jenis bagan pertandingan, kapasitas peserta tiap sesi, dan kriteria penilaian juri.
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-6 rounded-xl bg-slate-100/80 border border-slate-200 p-3.5 dark:bg-slate-800/60 dark:border-slate-750">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 mb-2 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Pilih Template Lomba Cepat:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TOURNAMENT_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-800 border border-slate-300 shadow-xs hover:border-indigo-600 hover:text-indigo-600 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:text-indigo-400"
              >
                {p.name.split('/')[0]}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Tournament Name & Category */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1.5">
                Nama Lomba / Turnamen *
              </label>
              <input
                id="input-tournament-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Festival Vokal & Seni Pertunjukan 2026"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-950 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1.5">
                Kategori Lomba
              </label>
              <input
                id="input-tournament-category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Misal: Seni Vokal / E-Sport"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-950 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* 2. BRACKET FORMAT SELECTION (Jenis Bagan Pertandingan) */}
          <div className="rounded-2xl border-2 border-indigo-200/80 bg-indigo-50/40 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                    Pilih Jenis & Format Bagan Pertandingan
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Tentukan bagaimana peserta ditandingkan dan lolos ke babak berikutnya.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[11px] font-extrabold text-white font-mono">
                {selectedFormatConfig.badge}
              </span>
            </div>

            {/* Format Cards Grid */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {BRACKET_FORMAT_OPTIONS.map((opt) => {
                const isSelected = bracketType === opt.type;
                const IconComponent = opt.type === 'single_elimination' 
                  ? Swords 
                  : opt.type === 'multi_heats' 
                  ? Users 
                  : opt.type === 'group_stage' 
                  ? LayoutGrid 
                  : GitFork;

                return (
                  <div
                    key={opt.type}
                    onClick={() => {
                      setBracketType(opt.type);
                      setParticipantsPerSession(opt.defaultParticipantsPerSession);
                      if (opt.type === 'multi_heats' || opt.type === 'group_stage') {
                        setQualifiersPerSession(2);
                      } else {
                        setQualifiersPerSession(1);
                      }
                    }}
                    className={`cursor-pointer rounded-xl border-2 p-3.5 transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-white dark:bg-slate-900 shadow-md ring-2 ring-indigo-400/30'
                        : 'border-slate-200 bg-white/70 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-950 dark:text-white">
                            {opt.title}
                          </div>
                          <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                            {opt.subtitle}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shrink-0">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                      {opt.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Session Size & Qualifiers Customization Controls */}
            <div className="mt-4 rounded-xl border-2 border-indigo-200/90 bg-white p-4 dark:border-indigo-900/60 dark:bg-slate-900 shadow-xs">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white">
                  Pengaturan Jumlah Peserta Setiap Sesi / Gelombang
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Banyaknya Peserta di Setiap Sesi */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Kapasitas Peserta / Sesi:
                    </label>
                    <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                      {participantsPerSession} Peserta
                    </span>
                  </div>

                  {/* Stepper + Quick Presets */}
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setParticipantsPerSession(prev => Math.max(2, prev - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      title="Kurangi 1 peserta per sesi"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={2}
                      max={32}
                      value={participantsPerSession}
                      onChange={(e) => {
                        const val = Math.max(2, Math.min(32, Number(e.target.value) || 2));
                        setParticipantsPerSession(val);
                        if (qualifiersPerSession >= val) {
                          setQualifiersPerSession(Math.max(1, val - 1));
                        }
                      }}
                      className="w-16 h-9 text-center font-mono font-black text-sm rounded-lg border-2 border-indigo-300 bg-white dark:border-indigo-700 dark:bg-slate-800 text-slate-950 dark:text-white focus:border-indigo-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setParticipantsPerSession(prev => Math.min(32, prev + 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      title="Tambah 1 peserta per sesi"
                    >
                      +
                    </button>

                    <div className="flex-1 flex items-center gap-1 overflow-x-auto">
                      {[2, 3, 4, 5, 6, 8, 10].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            setParticipantsPerSession(size);
                            if (qualifiersPerSession >= size) {
                              setQualifiersPerSession(Math.max(1, size - 1));
                            }
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                            participantsPerSession === size
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Jumlah peserta yang bertanding/tampil bersamaan dalam 1 sesi panggung atau grup.
                  </p>
                </div>

                {/* Jumlah Lolos per Sesi */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Target Lolos per Sesi:
                    </label>
                    <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                      {qualifiersPerSession} Lolos
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setQualifiersPerSession(prev => Math.max(1, prev - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      title="Kurangi kuota lolos"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, participantsPerSession - 1)}
                      value={qualifiersPerSession}
                      onChange={(e) => {
                        const maxQ = Math.max(1, participantsPerSession - 1);
                        const val = Math.max(1, Math.min(maxQ, Number(e.target.value) || 1));
                        setQualifiersPerSession(val);
                      }}
                      className="w-16 h-9 text-center font-mono font-black text-sm rounded-lg border-2 border-amber-300 bg-white dark:border-amber-700 dark:bg-slate-800 text-slate-950 dark:text-white focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQualifiersPerSession(prev => Math.min(participantsPerSession - 1, prev + 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      title="Tambah kuota lolos"
                    >
                      +
                    </button>

                    <div className="flex-1 flex items-center gap-1">
                      {[1, 2, 3, 4].filter(q => q < participantsPerSession).map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setQualifiersPerSession(q)}
                          className={`flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                            qualifiersPerSession === q
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {q} Lolos
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Peringkat teratas dari tiap sesi yang otomatis melaju ke babak berikutnya.
                  </p>
                </div>
              </div>

              {/* Real-time Calculation Breakdown Preview */}
              <div className="mt-3 rounded-lg bg-indigo-50/70 p-2.5 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold">
                  <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>
                    Simulasi Sesi: Dengan <strong>{participantsPerSession} peserta per sesi</strong>, babak penyisihan akan membagi peserta ke dalam beberapa gelombang dan meloloskan <strong>{qualifiersPerSession} terbaik</strong> tiap sesi.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. SCORING CRITERIA */}
          <div className="rounded-xl border-2 border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850/50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-indigo-600" />
                <span>Kriteria Penilaian Juri (Maksimal Nilai)</span>
              </label>
              <button
                type="button"
                onClick={addCriterion}
                className="flex items-center gap-1 text-xs font-extrabold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Kriteria</span>
              </button>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {criteria.map((crit, idx) => (
                <div key={crit.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={crit.name}
                    onChange={(e) => updateCriterion(crit.id, 'name', e.target.value)}
                    placeholder={`Kriteria ${idx + 1}`}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <div className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 font-bold">
                    <span className="font-mono">Maks:</span>
                    <input
                      type="number"
                      min={10}
                      max={1000}
                      value={crit.maxScore}
                      onChange={(e) => updateCriterion(crit.id, 'maxScore', Number(e.target.value))}
                      className="w-18 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono font-extrabold text-indigo-600 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-indigo-400"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={criteria.length <= 1}
                    onClick={() => removeCriterion(crit.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 4. PARTICIPANTS INPUT */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="h-4 w-4 text-indigo-600" />
                <span>Daftar Peserta Awal</span>
              </label>
              <div className="flex rounded-lg bg-slate-200 p-0.5 text-xs dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  className={`px-3 py-1 rounded-md font-bold transition-all ${
                    inputMode === 'paste' ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-400'
                  }`}
                >
                  Paste Daftar Nama
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('generate')}
                  className={`px-3 py-1 rounded-md font-bold transition-all ${
                    inputMode === 'generate' ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-400'
                  }`}
                >
                  Generate Nomor Otomatis
                </button>
              </div>
            </div>

            {inputMode === 'paste' ? (
              <div>
                <textarea
                  id="textarea-participants-paste"
                  rows={4}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="01. Nama Peserta (Instansi/Asal)&#10;02. Nama Peserta&#10;03. Nama Peserta"
                  className="w-full rounded-xl border-2 border-slate-300 bg-white p-3 text-xs font-mono font-medium text-slate-950 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Tips: Masukkan satu nama per baris. Nomor dan instansi dalam kurung <code>(Asal Sekolah)</code> akan terdeteksi otomatis.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 rounded-xl border-2 border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-850">
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                    Jumlah Peserta
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={128}
                    value={genCount}
                    onChange={(e) => setGenCount(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                    Format Awalan
                  </label>
                  <input
                    type="text"
                    value={genPrefix}
                    onChange={(e) => setGenPrefix(e.target.value)}
                    placeholder="Contoh: Peserta / Regu"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              id="btn-save-tournament-setup"
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{initialTournament ? 'Simpan & Terapkan Bagan' : 'Mulai Turnamen'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
