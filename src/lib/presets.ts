import { Participant, ScoringCriterion, Tournament } from '../types';
import { generateFullBracketRounds } from './bracketHelper';

export const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', 
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6'
];

export function getRandomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export function generateShareCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'TRN-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function createDefaultTournament(userId: string): Tournament {
  const participants: Participant[] = [
    { id: 'p1', number: '01', name: 'Ahmad Faiz', organization: 'SMK Merdeka 1', avatarColor: '#3b82f6', notes: 'Peserta pertama' },
    { id: 'p2', number: '02', name: 'Siti Rahmawati', organization: 'SMA Bintang Jaya', avatarColor: '#ec4899', notes: '' },
    { id: 'p3', number: '03', name: 'Budi Santoso', organization: 'Universitas Nusantara', avatarColor: '#10b981', notes: '' },
    { id: 'p4', number: '04', name: 'Dewi Lestari', organization: 'Sanggar Seni Harmoni', avatarColor: '#f59e0b', notes: '' },
    { id: 'p5', number: '05', name: 'Rian Pratama', organization: 'Komunitas Vokal', avatarColor: '#8b5cf6', notes: '' },
    { id: 'p6', number: '06', name: 'Nadia Az-Zahra', organization: 'SMA Teladan', avatarColor: '#06b6d4', notes: '' },
    { id: 'p7', number: '07', name: 'Dimas Wicaksono', organization: 'SMA 3 Kota Baru', avatarColor: '#f97316', notes: '' },
    { id: 'p8', number: '08', name: 'Clarissa Maharani', organization: 'Studio Nada Utama', avatarColor: '#ef4444', notes: '' },
    { id: 'p9', number: '09', name: 'Gilang Ramadhan', organization: 'SMA Bakti Mandiri', avatarColor: '#14b8a6', notes: '' },
    { id: 'p10', number: '10', name: 'Putri Amelia', organization: 'Institut Seni Musik', avatarColor: '#6366f1', notes: '' },
  ];

  const scoringCriteria: ScoringCriterion[] = [
    { id: 'c1', name: 'Teknik Vokal / Materi', maxScore: 100 },
    { id: 'c2', name: 'Penjiwaan & Harmoni', maxScore: 100 },
    { id: 'c3', name: 'Penguasaan Panggung', maxScore: 100 },
  ];

  const rounds = generateFullBracketRounds(participants);
  const round1Id = rounds[0]?.id || 'r1';
  const now = new Date().toISOString();

  return {
    id: `tourn-${Date.now()}`,
    userId,
    name: 'Festival Vokal & Bakat Nasional 2026',
    category: 'Seni & Musik',
    description: 'Sistem pengundian giliran tampil, eliminasi otomatis per sesi, penilaian multi-kriteria, dan bagan sistem gugur otomatis.',
    scoringCriteria,
    rounds,
    currentRoundId: round1Id,
    participants,
    performedRecords: [],
    shareCode: generateShareCode(),
    createdAt: now,
    updatedAt: now
  };
}

export const TOURNAMENT_PRESETS = [
  {
    name: 'Lomba Menyanyi / Karaoke / Vokal Solo',
    category: 'Musik & Seni',
    criteria: [
      { name: 'Teknik Vokal & Intonasi', maxScore: 100 },
      { name: 'Penjiwaan & Interpretasi Lagu', maxScore: 100 },
      { name: 'Artikulasi & Penguasaan Panggung', maxScore: 100 }
    ],
    qualifiersCount: 4
  },
  {
    name: 'Lomba Pidato / Orasi / Storytelling',
    category: 'Public Speaking',
    criteria: [
      { name: 'Kesesuaian Isi & Materi', maxScore: 100 },
      { name: 'Vokal, Intonasi & Diksi', maxScore: 100 },
      { name: 'Gestur & Penguasaan Audiens', maxScore: 100 }
    ],
    qualifiersCount: 3
  },
  {
    name: 'Lomba Tari / Modern Dance / Kreasi Seni',
    category: 'Tari & Pertunjukan',
    criteria: [
      { name: 'Koreografi & Wiraga (Gerak)', maxScore: 100 },
      { name: 'Wirama (Ketukan & Tempo)', maxScore: 100 },
      { name: 'Wirasa & Kostum (Ekspresi)', maxScore: 100 }
    ],
    qualifiersCount: 4
  },
  {
    name: 'Cerdas Cermat / Kuis Cepat Tepat',
    category: 'Akademik',
    criteria: [
      { name: 'Babak Wajib (Skor)', maxScore: 100 },
      { name: 'Babak Rebutan (Skor)', maxScore: 100 }
    ],
    qualifiersCount: 3
  },
  {
    name: 'Lomba Umum / Presentasi / Standup Comedy',
    category: 'Umum',
    criteria: [
      { name: 'Kreativitas & Orisinalitas', maxScore: 100 },
      { name: 'Ketepatan Waktu & Eksekusi', maxScore: 100 },
      { name: 'Respon Dewan Juri & Penonton', maxScore: 100 }
    ],
    qualifiersCount: 5
  }
];
