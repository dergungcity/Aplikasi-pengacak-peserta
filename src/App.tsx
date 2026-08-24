import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  mapFirebaseUser, 
  logoutUser, 
  saveTournamentToFirestore, 
  deleteTournamentFromFirestore, 
  subscribeToUserTournaments,
  loginAsGuest
} from './lib/firebase';
import { createDefaultTournament } from './lib/presets';
import { Tournament, TournamentRound, Participant, PerformedRecord, UserAuth } from './types';

// Components
import { Navbar } from './components/Navbar';
import { RandomizerSection } from './components/RandomizerSection';
import { LeaderboardSection } from './components/LeaderboardSection';
import { BracketSection } from './components/BracketSection';
import { PresentationMode } from './components/PresentationMode';
import { ScoreInputModal } from './components/ScoreInputModal';
import { TournamentSetupModal } from './components/TournamentSetupModal';
import { ParticipantManagerModal } from './components/ParticipantManagerModal';
import { AdvanceRoundModal } from './components/AdvanceRoundModal';
import { TournamentHistoryModal } from './components/TournamentHistoryModal';
import { EditTournamentModal } from './components/EditTournamentModal';
import { AuthModal } from './components/AuthModal';
import { RoundWinnerModal } from './components/RoundWinnerModal';
import { RoundWinner } from './types';

const LOCAL_STORAGE_KEY = 'pengacak_lomba_active_tourn';

export default function App() {
  // Auth State
  const [user, setUser] = useState<UserAuth | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Tournament Data State
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [currentTournamentId, setCurrentTournamentId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState<'draw' | 'bracket' | 'leaderboard' | 'participants'>('draw');
  const [selectedLeaderboardRoundId, setSelectedLeaderboardRoundId] = useState<string>('');
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('pengacak_sound_fx') !== 'false';
  });

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [setupInitialData, setSetupInitialData] = useState<Tournament | null>(null);
  const [isParticipantManagerOpen, setIsParticipantManagerOpen] = useState(false);
  const [isAdvanceRoundModalOpen, setIsAdvanceRoundModalOpen] = useState(false);
  const [isTournamentListModalOpen, setIsTournamentListModalOpen] = useState(false);
  const [isEditTournamentModalOpen, setIsEditTournamentModalOpen] = useState(false);
  const [tournamentToEdit, setTournamentToEdit] = useState<Tournament | null>(null);
  const [selectedWinnerModalRound, setSelectedWinnerModalRound] = useState<TournamentRound | null>(null);
  const [scoreModalParticipant, setScoreModalParticipant] = useState<Participant | null>(null);

  // Persist sound preference
  useEffect(() => {
    localStorage.setItem('pengacak_sound_fx', soundEnabled ? 'true' : 'false');
  }, [soundEnabled]);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(mapFirebaseUser(firebaseUser));
      } else {
        // Automatically login as guest so user has a secure UID and data is saved to Firestore right away
        try {
          const guest = await loginAsGuest();
          setUser(guest);
        } catch (e) {
          console.warn('Guest login fallback error:', e);
          setUser(null);
        }
      }
      setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to user tournaments in Firestore
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserTournaments(user.uid, (remoteTournaments) => {
      if (remoteTournaments && remoteTournaments.length > 0) {
        setTournaments(remoteTournaments);
        if (!currentTournamentId || !remoteTournaments.some(t => t.id === currentTournamentId)) {
          setCurrentTournamentId(remoteTournaments[0].id);
        }
      } else {
        // If user has no tournaments in Firestore yet, create default
        const localSaved = localStorage.getItem(LOCAL_STORAGE_KEY);
        let initial: Tournament;
        if (localSaved) {
          try {
            initial = JSON.parse(localSaved);
            initial.userId = user.uid;
          } catch {
            initial = createDefaultTournament(user.uid);
          }
        } else {
          initial = createDefaultTournament(user.uid);
        }

        setTournaments([initial]);
        setCurrentTournamentId(initial.id);
        saveTournamentToFirestore(initial);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Current active tournament object
  const currentTournament = useMemo(() => {
    if (!tournaments.length) return null;
    return tournaments.find(t => t.id === currentTournamentId) || tournaments[0] || null;
  }, [tournaments, currentTournamentId]);

  // Current round object
  const currentRound = useMemo(() => {
    if (!currentTournament) return null;
    return currentTournament.rounds.find(r => r.id === currentTournament.currentRoundId) || currentTournament.rounds[0];
  }, [currentTournament]);

  // Keep selected leaderboard round in sync
  useEffect(() => {
    if (currentRound && (!selectedLeaderboardRoundId || !currentTournament?.rounds.some(r => r.id === selectedLeaderboardRoundId))) {
      setSelectedLeaderboardRoundId(currentRound.id);
    }
  }, [currentRound, currentTournament, selectedLeaderboardRoundId]);

  // Helper to persist tournament changes to both local state, localStorage, and Firestore
  const updateAndSaveTournament = async (updatedTournament: Tournament) => {
    setIsSyncing(true);
    // 1. Update local state
    setTournaments(prev => prev.map(t => t.id === updatedTournament.id ? updatedTournament : t));
    // 2. Backup to localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTournament));
    // 3. Sync to Cloud Firestore
    try {
      await saveTournamentToFirestore(updatedTournament);
    } catch (e) {
      console.warn('Cloud sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handler: When random draw completes
  const handleDrawComplete = (drawnParticipants: Participant[]) => {
    if (!currentTournament || !currentRound) return;

    const existingInRound = currentTournament.performedRecords.filter(r => r.roundId === currentRound.id);
    let startOrder = existingInRound.length + 1;

    const newRecords: PerformedRecord[] = drawnParticipants.map((p, idx) => ({
      participantId: p.id,
      roundId: currentRound.id,
      drawnOrder: startOrder + idx,
      drawnAt: new Date().toISOString(),
      scores: {},
      totalScore: 0,
      maxPossibleScore: currentTournament.scoringCriteria.reduce((sum, c) => sum + c.maxScore, 0),
      percentageScore: 0,
      hasScoreEntered: false
    }));

    const updatedTournament: Tournament = {
      ...currentTournament,
      performedRecords: [...currentTournament.performedRecords, ...newRecords],
      updatedAt: new Date().toISOString()
    };

    updateAndSaveTournament(updatedTournament);
  };

  // Handler: Save / update score for a participant
  const handleSaveScore = (record: PerformedRecord) => {
    if (!currentTournament) return;

    const otherRecords = currentTournament.performedRecords.filter(
      r => !(r.roundId === record.roundId && r.participantId === record.participantId)
    );

    const updatedTournament: Tournament = {
      ...currentTournament,
      performedRecords: [...otherRecords, record],
      updatedAt: new Date().toISOString()
    };

    updateAndSaveTournament(updatedTournament);
  };

  // Handler: Save / update winners for a specific round
  const handleSaveRoundWinners = (roundId: string, winners: RoundWinner[]) => {
    if (!currentTournament) return;

    // Update round object with winners
    const updatedRounds = currentTournament.rounds.map(r => {
      if (r.id === roundId) {
        return {
          ...r,
          winners
        };
      }
      return r;
    });

    // Also update performedRecords isWinnerOrQualified and winnerTitle for clarity
    const winnerMap = new Map(winners.map(w => [w.participantId, w.title]));
    const updatedRecords = currentTournament.performedRecords.map(rec => {
      if (rec.roundId === roundId) {
        const title = winnerMap.get(rec.participantId);
        if (title) {
          return {
            ...rec,
            isWinnerOrQualified: true,
            winnerTitle: title
          };
        } else if (rec.winnerTitle) {
          return {
            ...rec,
            winnerTitle: undefined
          };
        }
      }
      return rec;
    });

    const updatedTournament: Tournament = {
      ...currentTournament,
      rounds: updatedRounds,
      performedRecords: updatedRecords,
      updatedAt: new Date().toISOString()
    };

    updateAndSaveTournament(updatedTournament);
  };

  // Handler: Advance to next round
  const handleAdvanceRound = (newRound: TournamentRound) => {
    if (!currentTournament) return;

    // Mark previous round as completed
    const updatedRounds = currentTournament.rounds.map(r => {
      if (r.id === currentTournament.currentRoundId) {
        return { ...r, status: 'completed' as const };
      }
      return r;
    });

    const updatedTournament: Tournament = {
      ...currentTournament,
      rounds: [...updatedRounds, newRound],
      currentRoundId: newRound.id,
      updatedAt: new Date().toISOString()
    };

    updateAndSaveTournament(updatedTournament);
    setSelectedLeaderboardRoundId(newRound.id);
    setActiveTab('draw');
  };

  // Handler: Update entire participant list
  const handleUpdateParticipants = (updatedList: Participant[]) => {
    if (!currentTournament) return;

    const remainingIds = new Set(updatedList.map(p => p.id));

    // Clean up rounds so deleted participants are completely removed from round rosters and match pairings
    const updatedRounds = currentTournament.rounds.map((r, idx) => {
      if (idx === 0) {
        return {
          ...r,
          participantIds: updatedList.map(p => p.id),
          matchPairings: r.matchPairings?.map(m => ({
            ...m,
            participant1Id: m.participant1Id && remainingIds.has(m.participant1Id) ? m.participant1Id : undefined,
            participant2Id: m.participant2Id && remainingIds.has(m.participant2Id) ? m.participant2Id : undefined,
            participantIds: m.participantIds ? m.participantIds.filter(id => remainingIds.has(id)) : undefined,
            winnerId: m.winnerId && remainingIds.has(m.winnerId) ? m.winnerId : undefined,
            winnerIds: m.winnerIds ? m.winnerIds.filter(id => remainingIds.has(id)) : undefined
          }))
        };
      }
      return {
        ...r,
        participantIds: r.participantIds.filter(id => remainingIds.has(id)),
        matchPairings: r.matchPairings?.map(m => ({
          ...m,
          participant1Id: m.participant1Id && remainingIds.has(m.participant1Id) ? m.participant1Id : undefined,
          participant2Id: m.participant2Id && remainingIds.has(m.participant2Id) ? m.participant2Id : undefined,
          participantIds: m.participantIds ? m.participantIds.filter(id => remainingIds.has(id)) : undefined,
          winnerId: m.winnerId && remainingIds.has(m.winnerId) ? m.winnerId : undefined,
          winnerIds: m.winnerIds ? m.winnerIds.filter(id => remainingIds.has(id)) : undefined
        }))
      };
    });

    // Remove performed records for deleted participants
    const updatedRecords = currentTournament.performedRecords.filter(rec =>
      remainingIds.has(rec.participantId)
    );

    const updatedTournament: Tournament = {
      ...currentTournament,
      participants: updatedList,
      rounds: updatedRounds,
      performedRecords: updatedRecords,
      updatedAt: new Date().toISOString()
    };

    updateAndSaveTournament(updatedTournament);
  };

  // Handler: Reset draws for current round
  const handleResetRoundDraws = () => {
    if (!currentTournament || !currentRound) return;

    const remainingRecords = currentTournament.performedRecords.filter(
      r => r.roundId !== currentRound.id
    );

    const updatedTournament: Tournament = {
      ...currentTournament,
      performedRecords: remainingRecords,
      updatedAt: new Date().toISOString()
    };

    updateAndSaveTournament(updatedTournament);
  };

  // Handler: Delete tournament
  const handleDeleteTournament = async (id: string) => {
    try {
      await deleteTournamentFromFirestore(id);
    } catch (e) {
      console.warn('Failed to delete from Firestore:', e);
    }
    const filtered = tournaments.filter(t => t.id !== id);
    setTournaments(filtered);
    if (currentTournamentId === id) {
      if (filtered.length > 0) {
        setCurrentTournamentId(filtered[0].id);
      } else {
        const newT = createDefaultTournament(user?.uid || 'guest');
        setTournaments([newT]);
        setCurrentTournamentId(newT.id);
        updateAndSaveTournament(newT);
      }
    }
  };

  // Handler: Save edited tournament metadata/rounds
  const handleSaveEditedTournament = (updated: Tournament) => {
    updateAndSaveTournament(updated);
    if (selectedLeaderboardRoundId && !updated.rounds.some(r => r.id === selectedLeaderboardRoundId)) {
      setSelectedLeaderboardRoundId(updated.currentRoundId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased dark:bg-slate-950 dark:text-slate-100">
      
      {/* Navbar Header */}
      <Navbar
        currentTournament={currentTournament}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={logoutUser}
        onOpenNewTournament={() => {
          setSetupInitialData(null);
          setIsSetupModalOpen(true);
        }}
        onOpenTournamentList={() => setIsTournamentListModalOpen(true)}
        onOpenParticipantManager={() => setIsParticipantManagerOpen(true)}
        onOpenEditTournament={() => {
          if (currentTournament) {
            setTournamentToEdit(currentTournament);
            setIsEditTournamentModalOpen(true);
          }
        }}
        onTogglePresentation={() => setIsPresentationMode(true)}
        isPresentationMode={isPresentationMode}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        isSyncing={isSyncing}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {currentTournament && currentRound ? (
          <>
            {activeTab === 'draw' && (
              <RandomizerSection
                tournament={currentTournament}
                currentRound={currentRound}
                onDrawComplete={handleDrawComplete}
                onOpenScoreModal={(p) => setScoreModalParticipant(p)}
                soundEnabled={soundEnabled}
                onResetRoundDraws={handleResetRoundDraws}
                onOpenParticipantManager={() => setIsParticipantManagerOpen(true)}
              />
            )}

            {activeTab === 'bracket' && (
              <BracketSection
                tournament={currentTournament}
                onUpdateTournament={updateAndSaveTournament}
                onOpenScoreModal={(p) => setScoreModalParticipant(p)}
                onOpenWinnerModal={(round) => setSelectedWinnerModalRound(round)}
                onOpenAdvanceRoundModal={() => setIsAdvanceRoundModalOpen(true)}
                onOpenEditTournament={() => {
                  setTournamentToEdit(currentTournament);
                  setIsEditTournamentModalOpen(true);
                }}
                soundEnabled={soundEnabled}
              />
            )}

            {activeTab === 'leaderboard' && (
              <LeaderboardSection
                tournament={currentTournament}
                selectedRoundId={selectedLeaderboardRoundId || currentRound.id}
                onSelectRound={(roundId) => setSelectedLeaderboardRoundId(roundId)}
                onOpenScoreModal={(p) => setScoreModalParticipant(p)}
                onOpenAdvanceRoundModal={() => setIsAdvanceRoundModalOpen(true)}
                onOpenWinnerModal={(round) => setSelectedWinnerModalRound(round)}
                onOpenEditTournament={() => {
                  setTournamentToEdit(currentTournament);
                  setIsEditTournamentModalOpen(true);
                }}
                soundEnabled={soundEnabled}
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-12 w-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin mb-4" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              Memuat Turnamen & Data Cloud...
            </h3>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <p>Aplikasi Pengacak Peserta Lomba, Eliminasi Otomatis, dan Sistem Penjurian Babak Turnamen &copy; 2026</p>
      </footer>

      {/* Presentation Fullscreen Mode */}
      {isPresentationMode && currentTournament && currentRound && (
        <PresentationMode
          tournament={currentTournament}
          currentRound={currentRound}
          onExit={() => setIsPresentationMode(false)}
          onDrawComplete={handleDrawComplete}
          onOpenScoreModal={(p) => setScoreModalParticipant(p)}
          onUpdateTournament={updateAndSaveTournament}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
        />
      )}

      {/* Round Winner Selection Modal */}
      {selectedWinnerModalRound && currentTournament && (
        <RoundWinnerModal
          isOpen={!!selectedWinnerModalRound}
          onClose={() => setSelectedWinnerModalRound(null)}
          tournament={currentTournament}
          round={selectedWinnerModalRound}
          onSaveWinners={handleSaveRoundWinners}
          soundEnabled={soundEnabled}
        />
      )}

      {/* Score Input Modal */}
      <ScoreInputModal
        isOpen={!!scoreModalParticipant}
        onClose={() => setScoreModalParticipant(null)}
        participant={scoreModalParticipant}
        tournament={currentTournament!}
        currentRound={currentRound!}
        onSaveScore={handleSaveScore}
        soundEnabled={soundEnabled}
      />

      {/* Tournament Setup / Creation Modal */}
      <TournamentSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        userId={user?.uid || 'guest'}
        initialTournament={setupInitialData}
        onSave={(newTourn) => {
          setTournaments(prev => [newTourn, ...prev.filter(t => t.id !== newTourn.id)]);
          setCurrentTournamentId(newTourn.id);
          updateAndSaveTournament(newTourn);
        }}
      />

      {/* Participant Manager Modal */}
      {currentTournament && (
        <ParticipantManagerModal
          isOpen={isParticipantManagerOpen}
          onClose={() => setIsParticipantManagerOpen(false)}
          tournament={currentTournament}
          onUpdateParticipants={handleUpdateParticipants}
        />
      )}

      {/* Advance Round Modal */}
      {currentTournament && (
        <AdvanceRoundModal
          isOpen={isAdvanceRoundModalOpen}
          onClose={() => setIsAdvanceRoundModalOpen(false)}
          tournament={currentTournament}
          onConfirmAdvance={handleAdvanceRound}
        />
      )}

      {/* Saved Tournaments History Modal */}
      <TournamentHistoryModal
        isOpen={isTournamentListModalOpen}
        onClose={() => setIsTournamentListModalOpen(false)}
        tournaments={tournaments}
        currentTournamentId={currentTournamentId}
        onSelectTournament={(t) => setCurrentTournamentId(t.id)}
        onDeleteTournament={handleDeleteTournament}
        onOpenCreateNew={() => {
          setSetupInitialData(null);
          setIsSetupModalOpen(true);
        }}
        onEditTournament={(t) => {
          setTournamentToEdit(t);
          setIsEditTournamentModalOpen(true);
        }}
      />

      {/* Edit Tournament Name & Sessions Modal */}
      {tournamentToEdit && (
        <EditTournamentModal
          isOpen={isEditTournamentModalOpen}
          onClose={() => {
            setIsEditTournamentModalOpen(false);
            setTournamentToEdit(null);
          }}
          tournament={tournamentToEdit}
          onSave={handleSaveEditedTournament}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(loggedUser) => {
          if (loggedUser) {
            setUser(loggedUser);
          }
        }}
      />

    </div>
  );
}
