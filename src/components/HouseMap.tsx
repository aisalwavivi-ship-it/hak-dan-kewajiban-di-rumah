/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sun,
  CloudSun,
  Moon,
  Sparkles,
  CheckCircle2,
  Lock,
  Trophy,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Footprints,
} from 'lucide-react';
import { RoomId, TimeOfDay, UserProgress, ADVENTURE_ORDER } from '../types';
import { HOUSE_ROOMS, ASSETS } from '../data/houseData';
import { sounds } from '../utils/soundEffects';

interface HouseMapProps {
  currentTime: TimeOfDay;
  onSelectTime: (time: TimeOfDay) => void;
  onSelectRoom: (roomId: RoomId) => void;
  progress: UserProgress;
  onOpenCompleteModal?: () => void;
  zoomMultiplier?: number;
  onResetZoom?: () => void;
}

// Coordinate positions of each room node on the 1280 x 720 game world canvas
interface NodeCoordinates {
  x: number;
  y: number;
  roomKey?: RoomId;
  label: string;
}

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

const WORLD_NODES: Record<string, NodeCoordinates> = {
  start: { x: 330, y: 660, label: 'START (Pintu Masuk)' },
  'ruang-tamu': { x: 330, y: 520, roomKey: 'ruang-tamu', label: 'Ruang Tamu' },
  'kamar-tidur': { x: 270, y: 235, roomKey: 'kamar-tidur', label: 'Kamar Tidur' },
  dapur: { x: 675, y: 235, roomKey: 'dapur', label: 'Dapur' },
  'kamar-mandi': { x: 675, y: 520, roomKey: 'kamar-mandi', label: 'Kamar Mandi' },
  taman: { x: 1060, y: 400, roomKey: 'taman', label: 'Taman Rumah' },
  complete: { x: 1090, y: 120, label: 'MISSION COMPLETE!' },
};

export const HouseMap: React.FC<HouseMapProps> = ({
  currentTime,
  onSelectTime,
  onSelectRoom,
  progress,
  onOpenCompleteModal,
  zoomMultiplier: zoomProp,
  onResetZoom,
}) => {
  const [lockedToast, setLockedToast] = useState<string | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<RoomId | null>(null);
  const [internalZoom, setInternalZoom] = useState<number>(1.0);
  const zoomMultiplier = zoomProp ?? internalZoom;
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 1280,
    height: 720,
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const dragDistanceRef = useRef<number>(0);
  const dragStartRef = useRef<{ x: number; y: number; startPanX: number; startPanY: number }>({
    x: 0,
    y: 0,
    startPanX: 0,
    startPanY: 0,
  });

  // Calculate dynamic scale so house fills 100% of container without dark margins
  const baseFitScale = Math.max(
    containerSize.width / CANVAS_WIDTH,
    containerSize.height / CANVAS_HEIGHT
  );
  const effectiveScale = baseFitScale * zoomMultiplier;

  // Measure container dimensions for responsive full-screen coverage
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const updateSize = () => {
      if (mapContainerRef.current) {
        const w = mapContainerRef.current.clientWidth || 1280;
        const h = mapContainerRef.current.clientHeight || 720;
        setContainerSize({ width: w, height: h });
      }
    };

    updateSize();
    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Clamp camera pan so image always covers viewport and never pulls away
  const clampCameraPan = useCallback(
    (x: number, y: number, currentMultiplier: number) => {
      const curScale = baseFitScale * currentMultiplier;
      const scaledW = CANVAS_WIDTH * curScale;
      const scaledH = CANVAS_HEIGHT * curScale;

      const maxPanX = Math.max(0, (scaledW - containerSize.width) / 2);
      const minPanX = -maxPanX;
      const maxPanY = Math.max(0, (scaledH - containerSize.height) / 2);
      const minPanY = -maxPanY;

      return {
        x: Math.min(maxPanX, Math.max(minPanX, x)),
        y: Math.min(maxPanY, Math.max(minPanY, y)),
      };
    },
    [baseFitScale, containerSize.width, containerSize.height]
  );

  // Drag / Pan handlers for smooth exploratory movement
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragDistanceRef.current = 0;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: panOffset.x,
      startPanY: panOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragDistanceRef.current += Math.hypot(dx, dy);

    const targetX = dragStartRef.current.startPanX + dx;
    const targetY = dragStartRef.current.startPanY + dy;
    setPanOffset(clampCameraPan(targetX, targetY, zoomMultiplier));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragDistanceRef.current = 0;
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    dragDistanceRef.current += Math.hypot(dx, dy);

    const targetX = dragStartRef.current.startPanX + dx;
    const targetY = dragStartRef.current.startPanY + dy;
    setPanOffset(clampCameraPan(targetX, targetY, zoomMultiplier));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Reset Camera: re-centers and fits full screen
  const handleResetCamera = () => {
    sounds.playClick();
    if (onResetZoom) {
      onResetZoom();
    } else {
      setInternalZoom(1.0);
    }
    setPanOffset({ x: 0, y: 0 });
  };

  // Determine which rooms are unlocked
  const isRoomUnlocked = (roomId: RoomId): boolean => {
    const index = ADVENTURE_ORDER.indexOf(roomId);
    if (index === 0) return true; // Ruang Tamu is always unlocked first
    const previousRoomId = ADVENTURE_ORDER[index - 1];
    return Boolean(progress.exploredRooms[previousRoomId]);
  };

  const completedRoomsCount = ADVENTURE_ORDER.filter((id) => progress.exploredRooms[id]).length;
  const isAllComplete = completedRoomsCount === ADVENTURE_ORDER.length;

  // Active target room for exploration
  const targetRoomId: RoomId | 'complete' =
    completedRoomsCount >= ADVENTURE_ORDER.length
      ? 'complete'
      : ADVENTURE_ORDER[completedRoomsCount];

  // Avatar coordinates
  const avatarCoords =
    completedRoomsCount === 0
      ? WORLD_NODES.start
      : targetRoomId === 'complete'
      ? WORLD_NODES.complete
      : WORLD_NODES[targetRoomId] || WORLD_NODES.start;

  // Friendly speech text above avatar
  const avatarSpeechText =
    completedRoomsCount === 0
      ? 'Misi dimulai dari Pintu Masuk! Ayo jelajahi Ruang Tamu!'
      : targetRoomId === 'complete'
      ? 'Semua tugas selesai! Hore, kamu hebat!'
      : `Ayo amati ${HOUSE_ROOMS[targetRoomId]?.name || 'Rumah'}!`;

  const timeConfigs: Record<
    TimeOfDay,
    { label: string; icon: React.ReactNode; buttonStyle: string; ambientDesc: string }
  > = {
    pagi: {
      label: 'PAGI',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      buttonStyle: 'bg-amber-100 text-amber-900 border-amber-300',
      ambientDesc: '☀️ Pagi Hari: Cahaya fajar segar menyinari kamar dan ruang keluarga.',
    },
    siang: {
      label: 'SIANG',
      icon: <CloudSun className="w-4 h-4 text-sky-500" />,
      buttonStyle: 'bg-sky-100 text-sky-900 border-sky-300',
      ambientDesc: '🌤️ Siang Hari: Terang cerah, halaman dan seluruh rumah siap beraktivitas.',
    },
    malam: {
      label: 'MALAM',
      icon: <Moon className="w-4 h-4 text-indigo-500" />,
      buttonStyle: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      ambientDesc: '🌙 Malam Hari: Langit luar berbintang dan lampu hangat rumah menyala nyaman.',
    },
  };

  const handleTimeClick = (time: TimeOfDay) => {
    sounds.playClick();
    onSelectTime(time);
  };

  const handleNodeClick = (roomId: RoomId) => {
    // If user dragged camera, ignore click
    if (dragDistanceRef.current > 8) {
      return;
    }

    const unlocked = isRoomUnlocked(roomId);
    if (!unlocked) {
      sounds.playGentleHint();
      const index = ADVENTURE_ORDER.indexOf(roomId);
      const prevRoom = HOUSE_ROOMS[ADVENTURE_ORDER[index - 1]];
      const msg = `Area ${HOUSE_ROOMS[roomId].name} masih terkunci! Selesaikan misi di ${prevRoom.name} terlebih dahulu ya.`;
      setLockedToast(msg);
      sounds.speakIndonesian(msg);
      setTimeout(() => setLockedToast(null), 4000);
      return;
    }

    sounds.playClick();
    sounds.playFootsteps();
    setIsWalking(true);
    setTimeout(() => {
      setIsWalking(false);
      onSelectRoom(roomId);
    }, 350);
  };

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col bg-slate-950 select-none">
      
      {/* ========================================================
          FLOATING HUD HEADER (POLISHED, ACCESSIBLE, CRISP)
          ======================================================== */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* Left Badge: Map Title & Journey Step */}
        <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-amber-300 pointer-events-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center font-bold text-base shadow-xs">
            🏡
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-extrabold text-amber-700">
              KIKI'S HOME QUEST
            </div>
            <div className="font-fun font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <span>Misi Selesai:</span>
              <span className="text-amber-600 font-extrabold tabular-nums">
                {completedRoomsCount}/5 Ruangan
              </span>
            </div>
          </div>
        </div>

        {/* Center: TIME CONTROLS (☀️ PAGI, 🌤️ SIANG, 🌙 MALAM) */}
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-xl border border-slate-200 pointer-events-auto flex items-center gap-1.5">
          {(['pagi', 'siang', 'malam'] as TimeOfDay[]).map((time) => {
            const conf = timeConfigs[time];
            const isActive = currentTime === time;
            return (
              <button
                key={time}
                onClick={() => handleTimeClick(time)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-fun font-bold text-xs sm:text-sm transition-all transform cursor-pointer ${
                  isActive
                    ? `${conf.buttonStyle} shadow-md scale-105 border font-extrabold ring-2 ring-amber-400/50`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {conf.icon}
                <span>{conf.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Map Re-center button (Zoom buttons are prominently located at the top Navbar) */}
        <div className="bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl shadow-xl border border-slate-200 pointer-events-auto flex items-center">
          <button
            onClick={handleResetCamera}
            className="px-2.5 py-1 text-slate-700 hover:text-amber-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 font-fun text-xs font-bold"
            title="Pusatkan Kamera Peta"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>Pusatkan</span>
          </button>
        </div>

      </div>

      {/* Floating Locked Toast Notification */}
      {lockedToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-amber-500 text-white font-fun font-bold px-4 py-2.5 rounded-2xl shadow-xl border-2 border-amber-300 flex items-center gap-2 animate-in slide-in-from-top-2 text-xs sm:text-sm">
          <Lock className="w-4 h-4 shrink-0" />
          <span>{lockedToast}</span>
        </div>
      )}

      {/* ========================================================
          THE HERO 3D GAME WORLD CANVAS (FULL-VIEWPORT IMMERSIVE 3D HOUSE)
          Fills 100% of the screen without dark margins on left/right.
          House is large, centered, and surrounded by its dedicated yard.
          ======================================================== */}
      <div
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 w-full h-full overflow-hidden flex items-center justify-center bg-gradient-to-b from-emerald-950 via-teal-950 to-slate-950 relative select-none cursor-grab active:cursor-grabbing"
      >
        <div
          className="relative transition-transform duration-100 ease-out origin-center select-none shrink-0"
          style={{
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${effectiveScale})`,
          }}
        >
          {/* ====================================================
              1. SINGLE UNIFIED 3D ISOMETRIC HOUSE BACKGROUND
              A single architectural cutaway building on a lush green lawn:
              Connected walls, continuous floors, interior doorways,
              consistent perspective, with spacious garden on the right.
              ==================================================== */}
          <div className="absolute inset-0 overflow-hidden shadow-2xl">
            <img
              src={ASSETS.unifiedHouse3D || ASSETS.houseMapIsometric3D}
              alt="Satu Rumah 3D Utuh & Terhubung"
              className="w-full h-full object-cover select-none pointer-events-none"
              draggable={false}
            />
          </div>

          {/* ====================================================
              2. INTERACTIVE 3D ROOM HOTSPOTS (AREA 1 - AREA 5)
              Mapped over the unified house structure.
              Highlights room volume naturally upon hover or focus.
              ==================================================== */}

          {/* AREA 1: RUANG TAMU HOTSPOT (Bottom-Left House Quadrant) */}
          <div
            onClick={() => handleNodeClick('ruang-tamu')}
            onMouseEnter={() => setHoveredRoom('ruang-tamu')}
            onMouseLeave={() => setHoveredRoom(null)}
            className={`absolute rounded-3xl cursor-pointer transition-all duration-300 z-12 ${
              targetRoomId === 'ruang-tamu'
                ? 'bg-amber-400/15 ring-3 ring-amber-400/90 shadow-xl'
                : hoveredRoom === 'ruang-tamu'
                ? 'bg-amber-400/10 ring-2 ring-amber-300/80 shadow-md'
                : 'hover:bg-amber-400/5'
            }`}
            style={{
              left: '80px',
              top: '380px',
              width: '430px',
              height: '280px',
            }}
          >
            {/* Room Name Badge inside room */}
            <div className="absolute top-3 left-4 pointer-events-none flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 text-white font-fun font-bold text-xs shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Area 1: Ruang Tamu</span>
            </div>
          </div>

          {/* AREA 2: KAMAR TIDUR HOTSPOT (Top-Left House Quadrant) */}
          <div
            onClick={() => handleNodeClick('kamar-tidur')}
            onMouseEnter={() => setHoveredRoom('kamar-tidur')}
            onMouseLeave={() => setHoveredRoom(null)}
            className={`absolute rounded-3xl cursor-pointer transition-all duration-300 z-12 ${
              targetRoomId === 'kamar-tidur'
                ? 'bg-amber-400/15 ring-3 ring-amber-400/90 shadow-xl'
                : hoveredRoom === 'kamar-tidur'
                ? 'bg-amber-400/10 ring-2 ring-amber-300/80 shadow-md'
                : 'hover:bg-amber-400/5'
            }`}
            style={{
              left: '80px',
              top: '70px',
              width: '430px',
              height: '290px',
            }}
          >
            {/* Room Name Badge inside room */}
            <div className="absolute top-3 left-4 pointer-events-none flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 text-white font-fun font-bold text-xs shadow-md">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Area 2: Kamar Tidur</span>
            </div>

            {/* Locked Room Veil within house structure */}
            {!isRoomUnlocked('kamar-tidur') && (
              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] rounded-3xl flex flex-col items-center justify-center text-center p-3 text-white pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-600 flex items-center justify-center text-amber-400 mb-1.5 shadow-md">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="font-fun font-bold text-xs text-slate-200">Area Terkunci</span>
                <span className="text-[10px] text-slate-300">Selesaikan Ruang Tamu lebih dulu</span>
              </div>
            )}
          </div>

          {/* AREA 3: DAPUR & RUANG MAKAN HOTSPOT (Top-Right House Section) */}
          <div
            onClick={() => handleNodeClick('dapur')}
            onMouseEnter={() => setHoveredRoom('dapur')}
            onMouseLeave={() => setHoveredRoom(null)}
            className={`absolute rounded-3xl cursor-pointer transition-all duration-300 z-12 ${
              targetRoomId === 'dapur'
                ? 'bg-amber-400/15 ring-3 ring-amber-400/90 shadow-xl'
                : hoveredRoom === 'dapur'
                ? 'bg-amber-400/10 ring-2 ring-amber-300/80 shadow-md'
                : 'hover:bg-amber-400/5'
            }`}
            style={{
              left: '525px',
              top: '70px',
              width: '300px',
              height: '290px',
            }}
          >
            {/* Room Name Badge inside room */}
            <div className="absolute top-3 left-4 pointer-events-none flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 text-white font-fun font-bold text-xs shadow-md">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Area 3: Dapur</span>
            </div>

            {/* Locked Room Veil within house structure */}
            {!isRoomUnlocked('dapur') && (
              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] rounded-3xl flex flex-col items-center justify-center text-center p-3 text-white pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-600 flex items-center justify-center text-amber-400 mb-1.5 shadow-md">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="font-fun font-bold text-xs text-slate-200">Area Terkunci</span>
                <span className="text-[10px] text-slate-300">Selesaikan Kamar Tidur lebih dulu</span>
              </div>
            )}
          </div>

          {/* AREA 4: KAMAR MANDI HOTSPOT (Bottom-Right House Section) */}
          <div
            onClick={() => handleNodeClick('kamar-mandi')}
            onMouseEnter={() => setHoveredRoom('kamar-mandi')}
            onMouseLeave={() => setHoveredRoom(null)}
            className={`absolute rounded-3xl cursor-pointer transition-all duration-300 z-12 ${
              targetRoomId === 'kamar-mandi'
                ? 'bg-amber-400/15 ring-3 ring-amber-400/90 shadow-xl'
                : hoveredRoom === 'kamar-mandi'
                ? 'bg-amber-400/10 ring-2 ring-amber-300/80 shadow-md'
                : 'hover:bg-amber-400/5'
            }`}
            style={{
              left: '525px',
              top: '380px',
              width: '300px',
              height: '280px',
            }}
          >
            {/* Room Name Badge inside room */}
            <div className="absolute top-3 left-4 pointer-events-none flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 text-white font-fun font-bold text-xs shadow-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Area 4: Kamar Mandi</span>
            </div>

            {/* Locked Room Veil within house structure */}
            {!isRoomUnlocked('kamar-mandi') && (
              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] rounded-3xl flex flex-col items-center justify-center text-center p-3 text-white pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-600 flex items-center justify-center text-amber-400 mb-1.5 shadow-md">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="font-fun font-bold text-xs text-slate-200">Area Terkunci</span>
                <span className="text-[10px] text-slate-300">Selesaikan Dapur lebih dulu</span>
              </div>
            )}
          </div>

          {/* AREA 5: TAMAN RUMAH HOTSPOT (Dedicated Spacious Outdoor Garden & Lawn)
              Positioned squarely on the outdoor yard on the right, completely separate from the bathroom. */}
          <div
            onClick={() => handleNodeClick('taman')}
            onMouseEnter={() => setHoveredRoom('taman')}
            onMouseLeave={() => setHoveredRoom(null)}
            className={`absolute rounded-3xl cursor-pointer transition-all duration-300 z-12 ${
              targetRoomId === 'taman'
                ? 'bg-amber-400/15 ring-3 ring-amber-400/90 shadow-xl'
                : hoveredRoom === 'taman'
                ? 'bg-amber-400/10 ring-2 ring-amber-300/80 shadow-md'
                : 'hover:bg-amber-400/5'
            }`}
            style={{
              left: '850px',
              top: '60px',
              width: '390px',
              height: '610px',
            }}
          >
            {/* Garden Tag inside outdoor space */}
            <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20 text-white font-fun font-bold text-xs shadow-md">
              <span className="w-2 h-2 rounded-full bg-lime-400" />
              <span>Area 5: Taman Rumah</span>
            </div>

            {/* Locked Room Veil within outdoor space */}
            {!isRoomUnlocked('taman') && (
              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] rounded-3xl flex flex-col items-center justify-center text-center p-3 text-white pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-600 flex items-center justify-center text-amber-400 mb-1.5 shadow-md">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="font-fun font-bold text-xs text-slate-200">Area Terkunci</span>
                <span className="text-[10px] text-slate-300">Selesaikan Kamar Mandi lebih dulu</span>
              </div>
            )}
          </div>

          {/* ====================================================
              3. DYNAMIC 3D LIGHTING & ATMOSPHERE (PAGI / SIANG / MALAM)
              ==================================================== */}
          
          {/* PAGI: Soft golden morning sunbeam wash */}
          {currentTime === 'pagi' && (
            <div
              className="absolute inset-0 pointer-events-none z-18 transition-opacity duration-700"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255, 215, 0, 0.16) 0%, rgba(255, 165, 0, 0.08) 50%, rgba(255, 255, 255, 0.02) 100%)',
                mixBlendMode: 'screen',
              }}
            />
          )}

          {/* SIANG: Clear, crisp, bright balanced daylight */}
          {currentTime === 'siang' && (
            <div
              className="absolute inset-0 pointer-events-none z-18 transition-opacity duration-700"
              style={{
                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0))',
              }}
            />
          )}

          {/* MALAM: Deep nighttime mood with cozy warm glowing lamps */}
          {currentTime === 'malam' && (
            <div className="absolute inset-0 pointer-events-none z-18 transition-opacity duration-700">
              {/* Outside night ambient shade */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at 500px 380px, rgba(15, 23, 42, 0.18) 0%, rgba(10, 15, 30, 0.65) 100%)',
                }}
              />

              {/* Twinkling garden stars */}
              <div className="absolute right-14 top-10 w-2 h-2 rounded-full bg-yellow-200 animate-pulse" />
              <div className="absolute right-28 top-20 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <div className="absolute right-20 top-36 w-1.5 h-1.5 rounded-full bg-amber-200 animate-ping" />
              <div className="absolute right-12 bottom-36 w-2 h-2 rounded-full bg-white animate-pulse" />

              {/* Warm interior glowing light cones over rooms */}
              <div
                className="absolute rounded-full"
                style={{
                  left: '200px',
                  top: '410px',
                  width: '260px',
                  height: '200px',
                  background: 'radial-gradient(circle, rgba(255, 224, 130, 0.35) 0%, rgba(255, 179, 0, 0.1) 60%, transparent 80%)',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  left: '170px',
                  top: '140px',
                  width: '240px',
                  height: '180px',
                  background: 'radial-gradient(circle, rgba(255, 236, 179, 0.35) 0%, rgba(255, 193, 7, 0.08) 60%, transparent 80%)',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  left: '580px',
                  top: '140px',
                  width: '200px',
                  height: '180px',
                  background: 'radial-gradient(circle, rgba(255, 224, 130, 0.35) 0%, rgba(255, 179, 0, 0.08) 60%, transparent 80%)',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  left: '580px',
                  top: '410px',
                  width: '200px',
                  height: '180px',
                  background: 'radial-gradient(circle, rgba(255, 224, 130, 0.35) 0%, rgba(255, 179, 0, 0.08) 60%, transparent 80%)',
                }}
              />
              {/* Front Porch Carriage Lamp Glow */}
              <div
                className="absolute rounded-full"
                style={{
                  left: '320px',
                  top: '620px',
                  width: '100px',
                  height: '100px',
                  background: 'radial-gradient(circle, rgba(255, 215, 0, 0.45) 0%, transparent 70%)',
                }}
              />
              {/* Garden Lantern Glow on Lawn */}
              <div
                className="absolute rounded-full"
                style={{
                  left: '1000px',
                  top: '380px',
                  width: '140px',
                  height: '140px',
                  background: 'radial-gradient(circle, rgba(255, 230, 150, 0.3) 0%, transparent 70%)',
                }}
              />
            </div>
          )}

          {/* ====================================================
              4. INTERACTIVE ROOM HUBS & BADGES (ON UNIFIED HOUSE)
              Positioned accurately without obscuring room fixtures.
              Area 5 is placed entirely over the lawn and garden.
              ==================================================== */}
          
          {/* START MARKER */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-22"
            style={{ left: `${WORLD_NODES.start.x}px`, top: `${WORLD_NODES.start.y}px` }}
          >
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-fun font-bold text-xs px-3.5 py-1.5 rounded-full shadow-xl border-2 border-white flex items-center gap-1.5">
              <span>🚪 START (Pintu Masuk)</span>
            </div>
          </div>

          {/* 1. RUANG TAMU TRIGGER */}
          <RoomMapTrigger
            roomId="ruang-tamu"
            coords={WORLD_NODES['ruang-tamu']}
            isUnlocked={isRoomUnlocked('ruang-tamu')}
            isExplored={progress.exploredRooms['ruang-tamu']}
            isActive={targetRoomId === 'ruang-tamu'}
            onClick={() => handleNodeClick('ruang-tamu')}
            roomName="Ruang Tamu"
            stepNumber="1"
          />

          {/* 2. KAMAR TIDUR TRIGGER */}
          <RoomMapTrigger
            roomId="kamar-tidur"
            coords={WORLD_NODES['kamar-tidur']}
            isUnlocked={isRoomUnlocked('kamar-tidur')}
            isExplored={progress.exploredRooms['kamar-tidur']}
            isActive={targetRoomId === 'kamar-tidur'}
            onClick={() => handleNodeClick('kamar-tidur')}
            roomName="Kamar Tidur"
            stepNumber="2"
          />

          {/* 3. DAPUR TRIGGER */}
          <RoomMapTrigger
            roomId="dapur"
            coords={WORLD_NODES.dapur}
            isUnlocked={isRoomUnlocked('dapur')}
            isExplored={progress.exploredRooms.dapur}
            isActive={targetRoomId === 'dapur'}
            onClick={() => handleNodeClick('dapur')}
            roomName="Dapur"
            stepNumber="3"
          />

          {/* 4. KAMAR MANDI TRIGGER */}
          <RoomMapTrigger
            roomId="kamar-mandi"
            coords={WORLD_NODES['kamar-mandi']}
            isUnlocked={isRoomUnlocked('kamar-mandi')}
            isExplored={progress.exploredRooms['kamar-mandi']}
            isActive={targetRoomId === 'kamar-mandi'}
            onClick={() => handleNodeClick('kamar-mandi')}
            roomName="Kamar Mandi"
            stepNumber="4"
          />

          {/* 5. TAMAN TRIGGER (Squarely positioned on the spacious lawn/garden) */}
          <RoomMapTrigger
            roomId="taman"
            coords={WORLD_NODES.taman}
            isUnlocked={isRoomUnlocked('taman')}
            isExplored={progress.exploredRooms.taman}
            isActive={targetRoomId === 'taman'}
            onClick={() => handleNodeClick('taman')}
            roomName="Taman Rumah"
            stepNumber="5"
          />

          {/* 6. MISSION COMPLETE GATE */}
          <div
            onClick={() => {
              if (isAllComplete && onOpenCompleteModal) {
                sounds.playSuccess();
                onOpenCompleteModal();
              } else {
                sounds.playGentleHint();
                setLockedToast('Selesaikan 5 ruangan rumah terlebih dahulu untuk membuka Gerbang Selesai!');
              }
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 transform hover:scale-105 z-22 ${
              isAllComplete ? 'animate-bounce' : 'opacity-90'
            }`}
            style={{ left: `${WORLD_NODES.complete.x}px`, top: `${WORLD_NODES.complete.y}px` }}
          >
            <div
              className={`px-4 py-2 rounded-2xl shadow-xl font-fun font-bold text-xs sm:text-sm flex items-center gap-2 border-2 ${
                isAllComplete
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 border-white shadow-amber-300/80 ring-4 ring-amber-300/60'
                  : 'bg-slate-800 text-slate-300 border-slate-600'
              }`}
            >
              <Trophy className={`w-5 h-5 ${isAllComplete ? 'text-amber-800' : 'text-slate-400'}`} />
              <span>{isAllComplete ? '🎉 MISI SELESAI!' : '🔒 GERBANG AKHIR'}</span>
            </div>
          </div>

          {/* ====================================================
              5. AVATAR KIKI - WALKING SEAMLESSLY IN THE 3D HOUSE!
              ==================================================== */}
          <div
            className={`absolute -translate-x-1/2 -translate-y-full z-25 pointer-events-none transition-all duration-700 ease-out ${
              isWalking ? 'animate-bounce scale-110' : 'animate-float-gentle'
            }`}
            style={{
              left: `${avatarCoords.x}px`,
              top: `${avatarCoords.y - 12}px`,
            }}
          >
            {/* Friendly Speech Callout Bubble above Avatar */}
            <div className="mb-1.5 -translate-y-2 bg-white text-slate-900 font-fun font-bold text-[11px] px-3.5 py-1.5 rounded-2xl shadow-xl border-2 border-amber-400 whitespace-nowrap flex items-center gap-1.5 animate-pulse-soft">
              <span>👦 Kiki:</span>
              <span className="text-amber-700 font-extrabold">
                {avatarSpeechText}
              </span>
            </div>

            {/* 3D Visual Character Illustration */}
            <div className="relative w-14 h-14 flex items-center justify-center filter drop-shadow-xl">
              {/* Character shadow on floor */}
              <div className="absolute bottom-1 w-11 h-3.5 bg-black/45 rounded-full blur-[1px]" />
              {/* Character Avatar Icon */}
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-yellow-300 border-2 border-white flex items-center justify-center text-3xl shadow-lg ring-2 ring-amber-300">
                👦
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================
          BOTTOM MINIMAL EXPLORATION BAR
          ======================================================== */}
      <div className="bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-4 z-20 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-2">
          <Footprints className="w-4 h-4 text-amber-600" />
          <span className="font-bold text-slate-800">Petunjuk Petualangan:</span>
          <span>
            Sentuh ruangan 3D yang berpendar untuk mengamati situasi dan menentukan Hak atau Kewajiban.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-700 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
          </span>
          <span className="flex items-center gap-1 text-amber-600 font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Ruangan Aktif
          </span>
          <span className="flex items-center gap-1 text-slate-400 font-medium">
            <Lock className="w-3 h-3" /> Terkunci
          </span>
        </div>
      </div>

    </div>
  );
};

interface RoomMapTriggerProps {
  roomId: RoomId;
  coords: NodeCoordinates;
  isUnlocked: boolean;
  isExplored: boolean;
  isActive: boolean;
  onClick: () => void;
  roomName: string;
  stepNumber: string;
}

const RoomMapTrigger: React.FC<RoomMapTriggerProps> = ({
  coords,
  isUnlocked,
  isExplored,
  isActive,
  onClick,
  roomName,
  stepNumber,
}) => {
  return (
    <div
      onClick={onClick}
      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 transform hover:scale-110 z-22 group ${
        isActive ? 'scale-105' : ''
      }`}
      style={{ left: `${coords.x}px`, top: `${coords.y}px` }}
    >
      {/* Outer Pulse Ring for Active Node */}
      {isActive && (
        <div className="absolute inset-0 -m-3 rounded-full bg-amber-400/40 animate-ping pointer-events-none" />
      )}

      {/* Interactive Map Button Marker */}
      <div
        className={`px-3.5 py-1.5 rounded-2xl shadow-2xl border-2 flex items-center gap-2 font-fun font-bold text-xs sm:text-sm backdrop-blur-md transition-all ${
          isExplored
            ? 'bg-emerald-500/95 text-white border-white ring-2 ring-emerald-300'
            : isActive
            ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white border-white ring-4 ring-amber-300 shadow-amber-400/70'
            : isUnlocked
            ? 'bg-white/95 text-slate-800 border-blue-400 hover:bg-blue-50'
            : 'bg-slate-800/90 text-slate-400 border-slate-600 opacity-80'
        }`}
      >
        {isExplored ? (
          <CheckCircle2 className="w-4 h-4 text-white" />
        ) : isActive ? (
          <Sparkles className="w-4 h-4 text-yellow-200 animate-spin-slow" />
        ) : isUnlocked ? (
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
        ) : (
          <Lock className="w-3.5 h-3.5 text-slate-400" />
        )}

        <div className="flex flex-col text-left leading-tight">
          <span className="text-[9px] uppercase tracking-wider opacity-80">
            AREA {stepNumber}
          </span>
          <span className="text-xs font-extrabold">{roomName}</span>
        </div>

        {/* Action text badge on hover */}
        {isUnlocked && (
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md font-bold hidden sm:inline">
            Jelajahi
          </span>
        )}
      </div>
    </div>
  );
};
