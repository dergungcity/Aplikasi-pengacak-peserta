import React from 'react';
import { 
  Trophy, 
  Dice5, 
  Layers, 
  Users, 
  Tv, 
  Cloud, 
  LogIn, 
  LogOut, 
  Plus, 
  FolderOpen,
  Volume2,
  VolumeX,
  GitBranch,
  Edit3,
  Smartphone,
  Share2
} from 'lucide-react';
import { Tournament, UserAuth } from '../types';

interface NavbarProps {
  currentTournament: Tournament | null;
  activeTab: 'draw' | 'bracket' | 'leaderboard' | 'participants';
  setActiveTab: (tab: 'draw' | 'bracket' | 'leaderboard' | 'participants') => void;
  user: UserAuth | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenNewTournament: () => void;
  onOpenTournamentList: () => void;
  onOpenParticipantManager: () => void;
  onOpenEditTournament?: () => void;
  onOpenCrossDeviceSync?: () => void;
  onTogglePresentation: () => void;
  isPresentationMode: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTournament,
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onLogout,
  onOpenNewTournament,
  onOpenTournamentList,
  onOpenParticipantManager,
  onOpenEditTournament,
  onOpenCrossDeviceSync,
  onTogglePresentation,
  isPresentationMode,
  soundEnabled,
  setSoundEnabled,
  isSyncing
}) => {
  const currentRound = currentTournament?.rounds.find(r => r.id === currentTournament.currentRoundId);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Geometric Brand & Active Tournament Info with quick edit button */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-indigo-600 text-white shadow-md shadow-indigo-600/20 rotate-45 transition-transform hover:rotate-90 duration-300">
            <div className="-rotate-45 flex items-center justify-center">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-[320px]">
                {currentTournament ? currentTournament.name : 'PRO-DRAW'}
              </span>
              {currentRound && (
                <span className="inline-flex items-center rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700 uppercase tracking-wide dark:bg-indigo-950/80 dark:border-indigo-900 dark:text-indigo-300">
                  {currentRound.name}
                </span>
              )}
              {currentTournament && onOpenEditTournament && (
                <button
                  type="button"
                  onClick={onOpenEditTournament}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  title="Edit Nama Lomba atau Nama Sesi/Babak"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2.5 text-[11px] text-slate-400 dark:text-slate-400">
              {currentTournament ? (
                <>
                  <span className="uppercase font-semibold tracking-wider">{currentTournament.category}</span>
                  <span>•</span>
                  <span>{currentTournament.participants.length} Peserta</span>
                </>
              ) : (
                <span className="uppercase font-semibold tracking-wider">Turnamen & Penjurian</span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Geometric Navigation Tabs */}
        {currentTournament && (
          <nav className="hidden md:flex items-center gap-1.5 rounded-lg bg-slate-100 p-1 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
            <button
              id="nav-tab-draw"
              onClick={() => setActiveTab('draw')}
              className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'draw'
                  ? 'bg-slate-900 text-white shadow-xs dark:bg-indigo-600 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${activeTab === 'draw' ? 'bg-indigo-400' : 'bg-slate-400'}`} />
              <Dice5 className="h-3.5 w-3.5" />
              <span>Undian Tampil</span>
            </button>
            <button
              id="nav-tab-bracket"
              onClick={() => setActiveTab('bracket')}
              className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'bracket'
                  ? 'bg-slate-900 text-white shadow-xs dark:bg-indigo-600 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${activeTab === 'bracket' ? 'bg-indigo-400' : 'bg-slate-400'}`} />
              <GitBranch className="h-3.5 w-3.5" />
              <span>Bagan Pertandingan</span>
            </button>
            <button
              id="nav-tab-leaderboard"
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-slate-900 text-white shadow-xs dark:bg-indigo-600 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${activeTab === 'leaderboard' ? 'bg-indigo-400' : 'bg-slate-400'}`} />
              <Layers className="h-3.5 w-3.5" />
              <span>Skor & Babak</span>
            </button>
            <button
              id="nav-tab-participants"
              onClick={onOpenParticipantManager}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold text-slate-600 transition-all hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <Users className="h-3.5 w-3.5" />
              <span>Daftar Peserta</span>
            </button>
          </nav>
        )}

        {/* Right: Actions & User Account */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            id="btn-toggle-sound"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            title={soundEnabled ? 'Matikan Suara FX' : 'Aktifkan Suara FX'}
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> : <VolumeX className="h-3.5 w-3.5 text-slate-400" />}
          </button>

          {/* Presentation Mode */}
          {currentTournament && (
            <button
              id="btn-presentation-mode"
              onClick={onTogglePresentation}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-bold transition-all ${
                isPresentationMode
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Tv className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Layar Panggung</span>
            </button>
          )}

          {/* Cross-device Sync / Buka di HP & Laptop */}
          {onOpenCrossDeviceSync && (
            <button
              id="btn-open-cross-device-sync"
              type="button"
              onClick={onOpenCrossDeviceSync}
              className="flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50/80 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/80 transition-all cursor-pointer shadow-xs"
              title="Lanjutkan di HP atau Laptop Lain (Scan QR / Kode Lomba)"
            >
              <Smartphone className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="hidden sm:inline">Sync HP / Laptop</span>
            </button>
          )}

          {/* Tournament List / Switch */}
          <button
            id="btn-open-tournament-list"
            onClick={onOpenTournamentList}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            title="Kelola & Buka Turnamen Lain"
          >
            <FolderOpen className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Daftar Lomba</span>
          </button>

          {/* Create New Tournament */}
          <button
            id="btn-new-tournament"
            onClick={onOpenNewTournament}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sesi Baru</span>
          </button>

          {/* Cloud Sync Status & User Profile */}
          <div className="ml-1 border-l border-slate-200 pl-2 dark:border-slate-700">
            {user ? (
              <div className="flex items-center gap-1.5">
                <button 
                  id="btn-user-profile"
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-100 py-1 pl-1 pr-2.5 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-750 transition-all cursor-pointer"
                  title="Klik untuk ganti nama panitia / profil"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-[11px] font-black text-white uppercase shadow-xs">
                    {user.displayName?.[0] || 'P'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="max-w-[90px] truncate text-[11px] font-black text-slate-800 dark:text-slate-200 leading-tight">
                      {user.displayName || 'Panitia'}
                    </span>
                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 leading-none">
                      {user.isAnonymous ? 'Sesi Cloud' : 'Terhubung'}
                    </span>
                  </div>
                  {isSyncing ? (
                    <Cloud className="h-3.5 w-3.5 animate-pulse text-indigo-500 ml-0.5" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 ml-0.5" title="Data tersimpan & tersinkron" />
                  )}
                </button>
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-slate-800 transition-colors"
                  title="Keluar / Reset Sesi"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="btn-open-auth-modal"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-black text-slate-800 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <LogIn className="h-3.5 w-3.5 text-indigo-600" />
                <span>Masuk (Tanpa Email)</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Mobile Bottom Subnav */}
      {currentTournament && (
        <div className="flex md:hidden border-t border-slate-200 px-2 py-2 dark:border-slate-800 justify-around bg-slate-50 dark:bg-slate-850">
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex items-center gap-1 text-xs font-bold py-1 px-2 rounded-md ${
              activeTab === 'draw' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Dice5 className="h-3.5 w-3.5" />
            Undian
          </button>
          <button
            onClick={() => setActiveTab('bracket')}
            className={`flex items-center gap-1 text-xs font-bold py-1 px-2 rounded-md ${
              activeTab === 'bracket' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            Bagan
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-1 text-xs font-bold py-1 px-2 rounded-md ${
              activeTab === 'leaderboard' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Skor
          </button>
          <button
            onClick={onOpenParticipantManager}
            className="flex items-center gap-1 text-xs font-bold py-1 px-2 text-slate-600 dark:text-slate-300 rounded-md"
          >
            <Users className="h-3.5 w-3.5" />
            Peserta
          </button>
        </div>
      )}
    </header>
  );
};
