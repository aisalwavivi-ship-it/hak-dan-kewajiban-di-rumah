/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RoomId, TimeOfDay, UserProgress } from './types';
import { HOUSE_ROOMS } from './data/houseData';
import { Navbar } from './components/Navbar';
import { OpeningStory } from './components/OpeningStory';
import { HouseMap } from './components/HouseMap';
import { RoomModal } from './components/RoomModal';
import { MisiHandbookModal } from './components/MisiHandbookModal';
import { StoryReflectionModal } from './components/StoryReflectionModal';
import { sounds } from './utils/soundEffects';

const INITIAL_PROGRESS: UserProgress = {
  exploredRooms: {
    'kamar-tidur': false,
    'ruang-tamu': false,
    'dapur': false,
    'kamar-mandi': false,
    'taman': false,
  },
  solvedMissions: {},
  discoveredHakCount: 0,
  discoveredKewajibanCount: 0,
};

export default function App() {
  const [currentView, setCurrentView] = useState<'story' | 'map'>('story');
  const [currentTime, setCurrentTime] = useState<TimeOfDay>('pagi');
  const [activeRoomId, setActiveRoomId] = useState<RoomId | null>(null);
  const [isHandbookOpen, setIsHandbookOpen] = useState<boolean>(false);
  const [isReflectionOpen, setIsReflectionOpen] = useState<boolean>(false);
  const [hasShownReflection, setHasShownReflection] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [mapResetKey, setMapResetKey] = useState<number>(0);

  // Load progress from localStorage if available
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem('misi_rumahku_progress');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return INITIAL_PROGRESS;
  });

  // Save progress
  useEffect(() => {
    try {
      localStorage.setItem('misi_rumahku_progress', JSON.stringify(progress));
    } catch {
      // Ignore
    }
  }, [progress]);

  const completedRoomsCount = Object.values(progress.exploredRooms).filter(Boolean).length;

  const handleStartMission = () => {
    setCurrentView('map');
    sounds.speakIndonesian('Selamat datang di Denah Rumah! Pilih ruangan yang ingin kamu jelajahi.');
  };

  const handleSelectRoom = (roomId: RoomId) => {
    setActiveRoomId(roomId);
  };

  const handleMissionSuccess = (roomId: string, time: TimeOfDay) => {
    const missionKey = `${roomId}_${time}`;
    setProgress((prev) => {
      const newSolved = { ...prev.solvedMissions, [missionKey]: true };
      const newExplored = { ...prev.exploredRooms, [roomId]: true };
      const newHak = prev.discoveredHakCount + 1;
      const newKewajiban = prev.discoveredKewajibanCount + 1;

      const newAllExplored = Object.values(newExplored).filter(Boolean).length === 5;
      if (newAllExplored && !hasShownReflection) {
        setTimeout(() => {
          setIsReflectionOpen(true);
          setHasShownReflection(true);
        }, 1200);
      }

      return {
        ...prev,
        solvedMissions: newSolved,
        exploredRooms: newExplored as Record<RoomId, boolean>,
        discoveredHakCount: newHak,
        discoveredKewajibanCount: newKewajiban,
      };
    });
  };

  // FULL GAME RESET: Restores 100% initial clean state
  const resetGame = () => {
    // 1. Fresh initial progress (0/5, all rooms locked except Ruang Tamu)
    const freshProgress: UserProgress = {
      exploredRooms: {
        'kamar-tidur': false,
        'ruang-tamu': false,
        'dapur': false,
        'kamar-mandi': false,
        'taman': false,
      },
      solvedMissions: {},
      discoveredHakCount: 0,
      discoveredKewajibanCount: 0,
    };
    setProgress(freshProgress);

    // 2. Overwrite persistent storage cleanly
    try {
      localStorage.removeItem('misi_rumahku_progress');
      localStorage.setItem('misi_rumahku_progress', JSON.stringify(freshProgress));
    } catch {
      // Ignore storage errors
    }

    // 3. Reset selected time of day to default: PAGI
    setCurrentTime('pagi');

    // 4. Close any open room activity/modal
    setActiveRoomId(null);

    // 5. Close all modals and reset reflection complete state
    setIsHandbookOpen(false);
    setIsReflectionOpen(false);
    setHasShownReflection(false);

    // 6. Direct view to map so player can immediately explore from START
    setCurrentView('map');

    // 7. Increment key to force HouseMap to remount cleanly with default zoom, centering, and avatar at START
    setMapResetKey((prev) => prev + 1);

    // 8. Audio feedback
    sounds.playClick();
    sounds.speakIndonesian('Permainan diulang dari awal. Kiki kembali ke titik Start.');
  };

  const handleResetProgress = () => {
    resetGame();
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      sounds.isMuted = next;
      if (next) {
        sounds.stopSpeaking();
      }
      return next;
    });
  };

  return (
    <div
      className={`flex flex-col bg-amber-50/30 text-slate-800 ${
        currentView === 'map' ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* Top Bar Contract Compliant Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenHandbook={() => setIsHandbookOpen(true)}
        onResetMissions={handleResetProgress}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        completedRoomsCount={completedRoomsCount}
      />

      {/* Main Content Area */}
      <main className={`flex-1 ${currentView === 'map' ? 'overflow-hidden flex flex-col' : ''}`}>
        {currentView === 'story' ? (
          <OpeningStory onStartMission={handleStartMission} isMuted={isMuted} />
        ) : (
          <HouseMap
            key={mapResetKey}
            currentTime={currentTime}
            onSelectTime={setCurrentTime}
            onSelectRoom={handleSelectRoom}
            progress={progress}
            onOpenCompleteModal={() => setIsReflectionOpen(true)}
          />
        )}
      </main>

      {/* Interactive Room Inspection Modal */}
      {activeRoomId && (
        <RoomModal
          room={HOUSE_ROOMS[activeRoomId]}
          currentTime={currentTime}
          onClose={() => setActiveRoomId(null)}
          onMissionSuccess={handleMissionSuccess}
          isMuted={isMuted}
        />
      )}

      {/* Educational Handbook / "Buku Saku" Modal */}
      {isHandbookOpen && (
        <MisiHandbookModal
          onClose={() => setIsHandbookOpen(false)}
          progress={progress}
        />
      )}

      {/* Culminating Dilemma Resolution Modal */}
      {isReflectionOpen && (
        <StoryReflectionModal
          onClose={() => setIsReflectionOpen(false)}
          onExploreMore={() => {
            setIsReflectionOpen(false);
            setCurrentView('map');
          }}
        />
      )}

      {/* Quiet educational footer (only rendered on story view to avoid double scrollbar on map) */}
      {currentView === 'story' && (
        <footer className="py-4 border-t border-amber-200/50 bg-white/60 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Pendidikan Pancasila Kelas III SD · Hak dan Kewajiban Anak di Rumah</span>
            <span>Eksplorasi Pembelajaran Interaktif & Pemecahan Masalah</span>
          </div>
        </footer>
      )}
    </div>
  );
}
