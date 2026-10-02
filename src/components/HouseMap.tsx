/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Volume2,
  Compass,
} from 'lucide-react';
import { RoomData, RoomId, TimeOfDay, UserProgress, ADVENTURE_ORDER } from '../types';
import { HOUSE_ROOMS } from '../data/houseData';
import { sounds } from '../utils/soundEffects';

interface HouseMapProps {
  currentTime: TimeOfDay;
  onSelectTime: (time: TimeOfDay) => void;
  onSelectRoom: (roomId: RoomId) => void;
  progress: UserProgress;
  onOpenCompleteModal?: () => void;
}

// Coordinate positions of each room node on the 1100 x 760 game world canvas
interface NodeCoordinates {
  x: number;
  y: number;
  roomKey?: RoomId;
  label: string;
}

const WORLD_NODES: Record<string, NodeCoordinates> = {
  start: { x: 390, y: 700, label: 'START (Pintu Masuk)' },
  'ruang-tamu': { x: 390, y: 530, roomKey: 'ruang-tamu', label: 'Ruang Tamu' },
  'kamar-tidur': { x: 260, y: 290, roomKey: 'kamar-tidur', label: 'Kamar Tidur' },
  dapur: { x: 630, y: 290, roomKey: 'dapur', label: 'Dapur' },
  'kamar-mandi': { x: 690, y: 530, roomKey: 'kamar-mandi', label: 'Kamar Mandi' },
  taman: { x: 960, y: 400, roomKey: 'taman', label: 'Taman Rumah' },
  complete: { x: 960, y: 100, label: 'MISSION COMPLETE!' },
};

// Default comfortable close-up camera zoom scale for elementary school children
const INITIAL_CAMERA_ZOOM = 1.35;

export const HouseMap: React.FC<HouseMapProps> = ({
  currentTime,
  onSelectTime,
  onSelectRoom,
  progress,
  onOpenCompleteModal,
}) => {
  const [lockedToast, setLockedToast] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(INITIAL_CAMERA_ZOOM);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 90, y: -80 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Track drag distance to differentiate between dragging the camera and clicking a room
  const dragDistanceRef = useRef<number>(0);
  const dragStartRef = useRef<{ x: number; y: number; startPanX: number; startPanY: number }>({
    x: 0,
    y: 0,
    startPanX: 0,
    startPanY: 0,
  });

  // Clamp camera pan so map world never leaves viewport into empty void
  const clampCameraPan = (x: number, y: number, currentScale: number) => {
    if (!mapContainerRef.current) return { x, y };
    const vw = mapContainerRef.current.clientWidth || 1000;
    const vh = mapContainerRef.current.clientHeight || 650;
    const scaledW = 1100 * currentScale;
    const scaledH = 760 * currentScale;

    const maxPanX = Math.max(0, (scaledW - vw) / 2) + 140;
    const minPanX = -maxPanX;
    const maxPanY = Math.max(0, (scaledH - vh) / 2) + 120;
    const minPanY = -maxPanY;

    return {
      x: Math.min(maxPanX, Math.max(minPanX, x)),
      y: Math.min(maxPanY, Math.max(minPanY, y)),
    };
  };

  // Drag / Pan handlers for moving camera across the world map
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
    setPanOffset(clampCameraPan(targetX, targetY, zoomLevel));
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
    setPanOffset(clampCameraPan(targetX, targetY, zoomLevel));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Reset Camera: returns zoom to initial close-up scale and re-centers view
  const handleResetCamera = () => {
    sounds.playClick();
    setZoomLevel(INITIAL_CAMERA_ZOOM);
    setPanOffset({ x: 90, y: -80 });
  };

  // Zoom in camera closer
  const handleZoomIn = () => {
    sounds.playClick();
    setZoomLevel((z) => {
      const next = Math.min(2.0, z + 0.2);
      setPanOffset((cur) => clampCameraPan(cur.x, cur.y, next));
      return next;
    });
  };

  // Zoom out camera further
  const handleZoomOut = () => {
    sounds.playClick();
    setZoomLevel((z) => {
      const next = Math.max(0.9, z - 0.2);
      setPanOffset((cur) => clampCameraPan(cur.x, cur.y, next));
      return next;
    });
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

  // Avatar coordinates:
  // At start (0 rooms completed), avatar stands at START!
  // Once Ruang Tamu is completed, avatar stands at Kamar Tidur, etc.
  const avatarCoords =
    completedRoomsCount === 0
      ? WORLD_NODES.start
      : targetRoomId === 'complete'
      ? WORLD_NODES.complete
      : WORLD_NODES[targetRoomId] || WORLD_NODES.start;

  // Friendly speech text above avatar
  const avatarSpeechText =
    completedRoomsCount === 0
      ? 'Misi dimulai dari START! Ayo jelajahi Ruang Tamu!'
      : targetRoomId === 'complete'
      ? 'Semua tugas selesai! Hore!'
      : `Ayo amati ${HOUSE_ROOMS[targetRoomId]?.name || 'Rumah'}!`;

  const timeConfigs: Record<
    TimeOfDay,
    { label: string; icon: React.ReactNode; buttonStyle: string; ambientDesc: string }
  > = {
    pagi: {
      label: 'PAGI',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      buttonStyle: 'bg-amber-100 text-amber-900 border-amber-300',
      ambientDesc: '☀️ Pagi Hari: Cahaya fajar hangat menyinari kamar dan ruang keluarga.',
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
    sounds.speakIndonesian(`Waktu rumah berganti ke ${timeConfigs[time].label}`);
  };

  const handleNodeClick = (roomId: RoomId) => {
    // If the user was dragging/panning the camera, ignore click!
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
    <div className="relative w-full h-full overflow-hidden flex flex-col bg-slate-900 select-none">
      
      {/* ========================================================
          FLOATING HUD HEADER (MINIMAL, NON-INTRUSIVE)
          ======================================================== */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* Left Badge: Map Title & Journey Step */}
        <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-amber-300 pointer-events-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            🗺️
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-extrabold text-amber-700">
              DUNIA PETUALANGAN RUMAH
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
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-slate-200 pointer-events-auto flex items-center gap-1.5">
          {(['pagi', 'siang', 'malam'] as TimeOfDay[]).map((time) => {
            const conf = timeConfigs[time];
            const isActive = currentTime === time;
            return (
              <button
                key={time}
                onClick={() => handleTimeClick(time)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-fun font-bold text-xs sm:text-sm transition-all transform cursor-pointer ${
                  isActive
                    ? `${conf.buttonStyle} shadow-md scale-102 border`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {conf.icon}
                <span>{conf.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Map Zoom Controls & Help */}
        <div className="bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-2xl shadow-lg border border-slate-200 pointer-events-auto flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            title="Perbesar Kamera Peta"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            title="Perkecil Kamera Peta"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetCamera}
            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            title="Pusatkan Kamera Peta (Reset Kamera)"
          >
            <RotateCcw className="w-4 h-4" />
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
          THE HERO GAME WORLD CANVAS (FULL-VIEWPORT EXPLORATION MAP)
          Camera Viewport: Drag/pan moves camera across the world map.
          Avatar moves visually with the world, but logical game state is untouched.
          Zero independent vertical scrolling: uses overflow-hidden + camera pan.
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
        className="flex-1 w-full h-full overflow-hidden flex items-center justify-center p-1 sm:p-2 bg-emerald-950/20 relative select-none cursor-grab active:cursor-grabbing"
      >
        <div
          className="relative transition-transform duration-100 ease-out origin-center shadow-2xl rounded-3xl overflow-hidden border-4 border-amber-800/40 select-none shrink-0"
          style={{
            width: '1100px',
            height: '760px',
            minWidth: '1100px',
            minHeight: '760px',
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          }}
        >
          {/* ====================================================
              VECTOR ILLUSTRATION OF THE HOUSE WORLD
              ==================================================== */}
          <svg
            viewBox="0 0 1100 760"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Patterns for Wood, Tiles, and Grass */}
              <pattern id="grassPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect width="40" height="40" fill={currentTime === 'malam' ? '#143823' : '#4E9F3D'} />
                <circle cx="10" cy="15" r="1.5" fill={currentTime === 'malam' ? '#1e4d31' : '#64B852'} />
                <circle cx="28" cy="30" r="1.5" fill={currentTime === 'malam' ? '#1e4d31' : '#64B852'} />
              </pattern>

              <pattern id="woodLivingFloor" width="60" height="15" patternUnits="userSpaceOnUse">
                <rect width="60" height="15" fill={currentTime === 'malam' ? '#6B4A34' : '#E0B589'} />
                <line x1="0" y1="15" x2="60" y2="15" stroke={currentTime === 'malam' ? '#553926' : '#CFA070'} strokeWidth="1" />
                <line x1="30" y1="0" x2="30" y2="15" stroke={currentTime === 'malam' ? '#553926' : '#CFA070'} strokeWidth="1" />
              </pattern>

              <pattern id="bedroomFloor" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect width="40" height="40" fill={currentTime === 'malam' ? '#3B4D66' : '#E8EEF5'} />
                <path d="M 0 0 L 40 40 M 0 40 L 40 0" stroke={currentTime === 'malam' ? '#4C617F' : '#D6E2EE'} strokeWidth="0.8" />
              </pattern>

              <pattern id="kitchenTiles" width="30" height="30" patternUnits="userSpaceOnUse">
                <rect width="30" height="30" fill={currentTime === 'malam' ? '#664C38' : '#FAF5EF'} />
                <rect width="15" height="15" fill={currentTime === 'malam' ? '#573F2E' : '#F1E4D4'} />
                <rect x="15" y="15" width="15" height="15" fill={currentTime === 'malam' ? '#573F2E' : '#F1E4D4'} />
              </pattern>

              <pattern id="bathroomTiles" width="25" height="25" patternUnits="userSpaceOnUse">
                <rect width="25" height="25" fill={currentTime === 'malam' ? '#1D4552' : '#E6F8FA'} />
                <rect width="25" height="25" fill="none" stroke={currentTime === 'malam' ? '#163842' : '#C7EEF2'} strokeWidth="1" />
              </pattern>

              {/* Night Lighting Radial Lamps */}
              <radialGradient id="nightLampLiving" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFF2B2" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#FFE082" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FFE082" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="nightLampBed" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFF6CC" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#FFE57F" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#FFE57F" stopOpacity="0" />
              </radialGradient>

              {/* Morning Warm Sunlight Gradient */}
              <linearGradient id="morningSunlight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFA726" stopOpacity="0.25" />
                <stop offset="60%" stopColor="#FFCC80" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* ==================================================
                1. OUTSIDE GROUND & GARDEN TERRAIN
                ================================================== */}
            <rect width="1100" height="760" fill="url(#grassPattern)" />

            {/* Perimeter Wooden Fence */}
            <rect x="15" y="15" width="1070" height="730" fill="none" stroke="#8D6E63" strokeWidth="8" rx="20" strokeDasharray="16 8" />

            {/* ==================================================
                2. HOUSE STRUCTURE (WALLS, FOUNDATION, ROOM FLOORS)
                ================================================== */}
            {/* House Foundation shadow */}
            <rect x="70" y="80" width="750" height="610" rx="24" fill="rgba(0,0,0,0.18)" />
            {/* Outer House Foundation */}
            <rect
              x="60"
              y="70"
              width="750"
              height="610"
              rx="24"
              fill={currentTime === 'malam' ? '#4A4E5A' : '#FFFDF9'}
              stroke="#BCAAA4"
              strokeWidth="10"
            />

            {/* --------------------------------------------------
                ROOM 1: RUANG TAMU (Bottom-Left)
                x: 80, y: 390, width: 430, height: 270
                -------------------------------------------------- */}
            <g id="visual-ruang-tamu">
              {/* Floor */}
              <rect x="80" y="390" width="430" height="270" fill="url(#woodLivingFloor)" />
              {/* Room Dividing Wall */}
              <line x1="80" y1="390" x2="510" y2="390" stroke="#795548" strokeWidth="8" />
              <line x1="510" y1="390" x2="510" y2="660" stroke="#795548" strokeWidth="8" />

              {/* Area Rug */}
              <rect x="220" y="440" width="180" height="130" rx="16" fill="#F8BBD0" stroke="#EC407A" strokeWidth="2" opacity="0.8" />
              
              {/* Big Comfortable Sofa */}
              <rect x="235" y="420" width="150" height="42" rx="10" fill="#00838F" stroke="#006064" strokeWidth="2" />
              <rect x="245" y="430" width="40" height="26" rx="6" fill="#00ACC1" />
              <rect x="290" y="430" width="40" height="26" rx="6" fill="#00ACC1" />
              <rect x="335" y="430" width="40" height="26" rx="6" fill="#00ACC1" />
              
              {/* Coffee Table */}
              <rect x="255" y="480" width="110" height="46" rx="8" fill="#8D6E63" stroke="#6D4C41" strokeWidth="2" />
              <circle cx="280" cy="503" r="7" fill="#FFF" />
              <circle cx="340" cy="503" r="6" fill="#FFE082" />

              {/* Shoe Rack near Front Door */}
              <rect x="420" y="605" width="70" height="32" rx="4" fill="#6D4C41" stroke="#4E342E" strokeWidth="2" />
              <ellipse cx="440" cy="621" rx="9" ry="5" fill="#EF5350" />
              <ellipse cx="468" cy="621" rx="9" ry="5" fill="#42A5F5" />

              {/* Potted Indoor Plant */}
              <circle cx="120" cy="430" r="16" fill="#43A047" />
              <circle cx="120" cy="430" r="8" fill="#8D6E63" />

              {/* Front Door Opening */}
              <rect x="340" y="650" width="90" height="20" fill="#FFE0B2" stroke="#8D6E63" strokeWidth="4" />
              {/* Welcome Doormat */}
              <rect x="345" y="675" width="80" height="25" rx="6" fill="#FFB74D" stroke="#E65100" strokeWidth="2" />
              <text x="385" y="692" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#795548">
                WELCOME
              </text>
            </g>

            {/* --------------------------------------------------
                ROOM 2: KAMAR TIDUR (Top-Left)
                x: 80, y: 90, width: 430, height: 290
                -------------------------------------------------- */}
            <g id="visual-kamar-tidur">
              {/* Floor */}
              <rect x="80" y="90" width="430" height="290" fill="url(#bedroomFloor)" />

              {/* Doorway from Living Room to Bedroom */}
              <rect x="220" y="382" width="60" height="16" fill="#E8EEF5" />

              {/* Bed with Pillows and Quilt */}
              <rect x="110" y="120" width="130" height="170" rx="12" fill="#E3F2FD" stroke="#90CAF9" strokeWidth="3" />
              {/* Pillows */}
              <rect x="125" y="130" width="45" height="30" rx="6" fill="#FFF" stroke="#BBDEFB" strokeWidth="1.5" />
              <rect x="180" y="130" width="45" height="30" rx="6" fill="#FFF" stroke="#BBDEFB" strokeWidth="1.5" />
              {/* Colorful Folded Blanket / Quilt */}
              <rect x="115" y="175" width="120" height="110" rx="8" fill="#42A5F5" stroke="#1E88E5" strokeWidth="2" />
              <line x1="115" y1="230" x2="235" y2="230" stroke="#FFF" strokeWidth="3" strokeDasharray="6 4" />

              {/* Nightstand Table + Lamp */}
              <rect x="250" y="120" width="45" height="40" rx="6" fill="#8D6E63" />
              <circle cx="272" cy="140" r="10" fill="#FFEE58" stroke="#FDD835" strokeWidth="2" />

              {/* Study Desk & Books */}
              <rect x="330" y="120" width="140" height="65" rx="6" fill="#A1887F" stroke="#795548" strokeWidth="2" />
              {/* Desk Chair */}
              <rect x="375" y="195" width="45" height="35" rx="6" fill="#5C6BC0" />
              {/* Notebook & Study Lamp */}
              <rect x="350" y="135" width="35" height="25" rx="3" fill="#FFF" stroke="#E0E0E0" strokeWidth="1" />
              <circle cx="440" cy="145" r="9" fill="#FFCA28" />

              {/* Wardrobe Closet */}
              <rect x="110" y="315" width="120" height="50" rx="4" fill="#6D4C41" stroke="#4E342E" strokeWidth="2" />
              <line x1="170" y1="315" x2="170" y2="365" stroke="#4E342E" strokeWidth="2" />

              {/* Bedroom Star Area Rug */}
              <circle cx="280" cy="270" r="35" fill="#FFE082" opacity="0.6" />
            </g>

            {/* --------------------------------------------------
                ROOM 3: DAPUR & RUANG MAKAN (Top-Center)
                x: 520, y: 90, width: 280, height: 290
                -------------------------------------------------- */}
            <g id="visual-dapur">
              {/* Floor */}
              <rect x="520" y="90" width="280" height="290" fill="url(#kitchenTiles)" />
              {/* Dividing Wall between bedroom & kitchen */}
              <line x1="510" y1="90" x2="510" y2="390" stroke="#795548" strokeWidth="8" />

              {/* Doorway from Bedroom to Kitchen */}
              <rect x="502" y="250" width="16" height="60" fill="#FAF5EF" />

              {/* Dining Table */}
              <rect x="560" y="190" width="130" height="85" rx="14" fill="#D7CCC8" stroke="#8D6E63" strokeWidth="3" />
              {/* Chairs around table */}
              <rect x="580" y="165" width="35" height="18" rx="4" fill="#8D6E63" />
              <rect x="635" y="165" width="35" height="18" rx="4" fill="#8D6E63" />
              <rect x="580" y="282" width="35" height="18" rx="4" fill="#8D6E63" />
              <rect x="635" y="282" width="35" height="18" rx="4" fill="#8D6E63" />
              {/* Plates and Glasses */}
              <circle cx="600" cy="232" r="10" fill="#FFF" stroke="#B0BEC5" strokeWidth="1" />
              <circle cx="650" cy="232" r="10" fill="#FFF" stroke="#B0BEC5" strokeWidth="1" />
              <circle cx="625" cy="215" r="7" fill="#FF7043" />

              {/* Kitchen Countertop (Right Wall) */}
              <rect x="735" y="105" width="55" height="170" rx="4" fill="#CFD8DC" stroke="#78909C" strokeWidth="2" />
              {/* Sink */}
              <rect x="742" y="120" width="40" height="35" rx="4" fill="#90A4AE" />
              <circle cx="762" cy="137" r="4" fill="#ECEFF1" />
              {/* Stove */}
              <rect x="742" y="175" width="40" height="40" rx="4" fill="#37474F" />
              <circle cx="752" cy="188" r="6" fill="#F4511E" />
              <circle cx="772" cy="202" r="6" fill="#F4511E" />

              {/* Refrigerator */}
              <rect x="735" y="295" width="55" height="70" rx="4" fill="#B0BEC5" stroke="#78909C" strokeWidth="2" />
              <line x1="735" y1="330" x2="790" y2="330" stroke="#78909C" strokeWidth="2" />
            </g>

            {/* --------------------------------------------------
                ROOM 4: KAMAR MANDI (Bottom-Right of House)
                x: 520, y: 390, width: 280, height: 270
                -------------------------------------------------- */}
            <g id="visual-kamar-mandi">
              {/* Floor */}
              <rect x="520" y="390" width="280" height="270" fill="url(#bathroomTiles)" />

              {/* Doorway from Kitchen to Bathroom */}
              <rect x="640" y="382" width="60" height="16" fill="#E6F8FA" />

              {/* Bathtub with Blue Water */}
              <rect x="545" y="420" width="80" height="130" rx="16" fill="#FFF" stroke="#4DD0E1" strokeWidth="3" />
              <rect x="553" y="430" width="64" height="110" rx="10" fill="#80DEEA" />

              {/* Washbasin & Mirror */}
              <rect x="660" y="415" width="65" height="45" rx="6" fill="#FFF" stroke="#B0BEC5" strokeWidth="2" />
              <ellipse cx="692" cy="437" rx="18" ry="12" fill="#E0F7FA" />

              {/* Towel Rack with Towels */}
              <rect x="755" y="430" width="35" height="60" rx="3" fill="#80CBC4" stroke="#00796B" strokeWidth="2" />
              <line x1="755" y1="450" x2="790" y2="450" stroke="#FFF" strokeWidth="2" />

              {/* Clean Ceramic Toilet */}
              <ellipse cx="700" cy="590" rx="22" ry="28" fill="#FFF" stroke="#B0BEC5" strokeWidth="2" />
              <rect x="678" y="550" width="44" height="20" rx="4" fill="#ECEFF1" stroke="#B0BEC5" strokeWidth="1.5" />

              {/* Exit Door to Outdoor Garden */}
              <rect x="792" y="500" width="16" height="70" fill="#81C784" />
            </g>

            {/* --------------------------------------------------
                ROOM 5: TAMAN RUMAH & HALAMAN (Right Area)
                x: 820, y: 70, width: 260, height: 610
                -------------------------------------------------- */}
            <g id="visual-taman">
              {/* Garden Stone Stepping Path */}
              <circle cx="845" cy="535" r="14" fill="#D7CCC8" stroke="#A1887F" strokeWidth="2" />
              <circle cx="890" cy="520" r="15" fill="#D7CCC8" stroke="#A1887F" strokeWidth="2" />
              <circle cx="940" cy="490" r="16" fill="#D7CCC8" stroke="#A1887F" strokeWidth="2" />
              <circle cx="960" cy="440" r="16" fill="#D7CCC8" stroke="#A1887F" strokeWidth="2" />
              <circle cx="960" cy="380" r="16" fill="#D7CCC8" stroke="#A1887F" strokeWidth="2" />
              <circle cx="960" cy="320" r="16" fill="#D7CCC8" stroke="#A1887F" strokeWidth="2" />
              <circle cx="960" cy="250" r="16" fill="#D7CCC8" stroke="#A1887F" strokeWidth="2" />
              <circle cx="960" cy="180" r="16" fill="#D7CCC8" stroke="#A1887F" strokeWidth="2" />
              <circle cx="960" cy="120" r="16" fill="#D7CCC8" stroke="#A1887F" strokeWidth="2" />

              {/* Big Shady Green Garden Tree */}
              <circle cx="1020" cy="280" r="55" fill={currentTime === 'malam' ? '#1B5E20' : '#2E7D32'} opacity="0.9" />
              <circle cx="1040" cy="260" r="45" fill={currentTime === 'malam' ? '#2E7D32' : '#388E3C'} opacity="0.9" />
              <circle cx="1000" cy="300" r="45" fill={currentTime === 'malam' ? '#2E7D32' : '#43A047'} opacity="0.9" />

              {/* Garden Wooden Bench */}
              <rect x="850" y="320" width="30" height="75" rx="6" fill="#8D6E63" stroke="#5D4037" strokeWidth="2" />

              {/* Flower Bushes */}
              <g id="flower-patches">
                <circle cx="860" cy="200" r="18" fill="#EC407A" />
                <circle cx="880" cy="210" r="14" fill="#FFEB3B" />
                <circle cx="850" cy="220" r="12" fill="#AB47BC" />

                <circle cx="880" cy="620" r="20" fill="#FFA726" />
                <circle cx="905" cy="630" r="16" fill="#EC407A" />
                <circle cx="860" cy="635" r="14" fill="#FFEB3B" />
              </g>

              {/* Football / Toy on Lawn */}
              <circle cx="905" cy="425" r="12" fill="#FFF" stroke="#212121" strokeWidth="2" />
              <polygon points="905,420 902,423 904,427 908,427 909,423" fill="#212121" />

              {/* FINISH: Outside Garden Gate / Teman-teman Menanti */}
              <rect x="915" y="45" width="90" height="26" rx="6" fill="#FFCA28" stroke="#F57F17" strokeWidth="3" />
              <text x="960" y="62" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#3E2723">
                GERBANG BERMAIN
              </text>
            </g>

            {/* ==================================================
                3. THE CONTINUOUS ADVENTURE TRAIL (PATHWAYS & FOOTPRINTS)
                Connecting: START -> Ruang Tamu -> Kamar Tidur -> Dapur -> Kamar Mandi -> Taman -> Complete
                ================================================== */}
            <g id="adventure-trail-lines">
              {/* Segment 1: START to Ruang Tamu */}
              <path
                d="M 390 690 L 390 540"
                fill="none"
                stroke="#FFB300"
                strokeWidth="6"
                strokeDasharray="8 6"
                strokeLinecap="round"
              />

              {/* Segment 2: Ruang Tamu to Kamar Tidur */}
              <path
                d="M 390 520 L 250 520 L 250 300"
                fill="none"
                stroke={progress.exploredRooms['ruang-tamu'] ? '#4CAF50' : '#FFB300'}
                strokeWidth="6"
                strokeDasharray="8 6"
                strokeLinecap="round"
                opacity={progress.exploredRooms['ruang-tamu'] ? 0.9 : 0.4}
              />

              {/* Segment 3: Kamar Tidur to Dapur */}
              <path
                d="M 270 290 L 500 290 L 620 290"
                fill="none"
                stroke={progress.exploredRooms['kamar-tidur'] ? '#4CAF50' : '#FFB300'}
                strokeWidth="6"
                strokeDasharray="8 6"
                strokeLinecap="round"
                opacity={progress.exploredRooms['kamar-tidur'] ? 0.9 : 0.4}
              />

              {/* Segment 4: Dapur to Kamar Mandi */}
              <path
                d="M 640 300 L 670 300 L 670 520"
                fill="none"
                stroke={progress.exploredRooms['dapur'] ? '#4CAF50' : '#FFB300'}
                strokeWidth="6"
                strokeDasharray="8 6"
                strokeLinecap="round"
                opacity={progress.exploredRooms['dapur'] ? 0.9 : 0.4}
              />

              {/* Segment 5: Kamar Mandi to Taman */}
              <path
                d="M 700 530 L 800 530 L 950 530 L 950 410"
                fill="none"
                stroke={progress.exploredRooms['kamar-mandi'] ? '#4CAF50' : '#FFB300'}
                strokeWidth="6"
                strokeDasharray="8 6"
                strokeLinecap="round"
                opacity={progress.exploredRooms['kamar-mandi'] ? 0.9 : 0.4}
              />

              {/* Segment 6: Taman to Complete Gate */}
              <path
                d="M 960 390 L 960 115"
                fill="none"
                stroke={progress.exploredRooms['taman'] ? '#4CAF50' : '#FFB300'}
                strokeWidth="6"
                strokeDasharray="8 6"
                strokeLinecap="round"
                opacity={progress.exploredRooms['taman'] ? 0.9 : 0.4}
              />
            </g>

            {/* ==================================================
                4. DYNAMIC ATMOSPHERE OVERLAYS (PAGI / SIANG / MALAM)
                ================================================== */}
            {currentTime === 'pagi' && (
              <g id="overlay-morning" pointerEvents="none">
                <rect width="1100" height="760" fill="url(#morningSunlight)" />
              </g>
            )}

            {currentTime === 'malam' && (
              <g id="overlay-night" pointerEvents="none">
                {/* Night darkness outside house */}
                <rect width="1100" height="760" fill="rgba(10, 18, 38, 0.55)" />

                {/* Stars in garden sky */}
                <circle cx="880" cy="100" r="2" fill="#FFF" opacity="0.9" />
                <circle cx="920" cy="140" r="1.5" fill="#FFF" opacity="0.8" />
                <circle cx="1020" cy="90" r="2.5" fill="#FFE082" opacity="0.9" />
                <circle cx="1050" cy="170" r="1.5" fill="#FFF" opacity="0.8" />
                <circle cx="900" cy="680" r="2" fill="#FFF" opacity="0.9" />

                {/* Warm glowing interior lamps */}
                <circle cx="390" cy="520" r="160" fill="url(#nightLampLiving)" />
                <circle cx="260" cy="270" r="140" fill="url(#nightLampBed)" />
                <circle cx="630" cy="270" r="140" fill="url(#nightLampLiving)" />
              </g>
            )}

            {/* ==================================================
                5. ROOM STATUS OVERLAYS (DIMMING LOCKED ROOMS)
                ================================================== */}
            {/* Kamar Tidur lock overlay */}
            {!isRoomUnlocked('kamar-tidur') && (
              <g id="lock-kamar-tidur" pointerEvents="none">
                <rect x="80" y="90" width="430" height="290" fill="rgba(30, 41, 59, 0.45)" rx="8" />
              </g>
            )}

            {/* Dapur lock overlay */}
            {!isRoomUnlocked('dapur') && (
              <g id="lock-dapur" pointerEvents="none">
                <rect x="520" y="90" width="280" height="290" fill="rgba(30, 41, 59, 0.45)" rx="8" />
              </g>
            )}

            {/* Kamar Mandi lock overlay */}
            {!isRoomUnlocked('kamar-mandi') && (
              <g id="lock-kamar-mandi" pointerEvents="none">
                <rect x="520" y="390" width="280" height="270" fill="rgba(30, 41, 59, 0.45)" rx="8" />
              </g>
            )}

            {/* Taman lock overlay */}
            {!isRoomUnlocked('taman') && (
              <g id="lock-taman" pointerEvents="none">
                <rect x="830" y="80" width="250" height="600" fill="rgba(30, 41, 59, 0.45)" rx="16" />
              </g>
            )}

          </svg>

          {/* ====================================================
              INTERACTIVE CLICKABLE ROOM HUBS & BADGES (ON MAP)
              Positioned absolutely on top of the world coordinates!
              ==================================================== */}
          
          {/* START MARKER */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${WORLD_NODES.start.x}px`, top: `${WORLD_NODES.start.y}px` }}
          >
            <div className="bg-emerald-600 text-white font-fun font-bold text-xs px-3 py-1 rounded-full shadow-md border-2 border-white flex items-center gap-1">
              <span>🚪 START</span>
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

          {/* 5. TAMAN TRIGGER */}
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
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 transform hover:scale-105 z-20 ${
              isAllComplete ? 'animate-bounce' : 'opacity-85'
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
              AVATAR KIKI - STANDING DIRECTLY ON THE GAME WORLD MAP!
              ==================================================== */}
          <div
            className={`absolute -translate-x-1/2 -translate-y-full z-25 pointer-events-none transition-all duration-700 ease-out ${
              isWalking ? 'animate-bounce scale-110' : 'animate-float-gentle'
            }`}
            style={{
              left: `${avatarCoords.x}px`,
              top: `${avatarCoords.y - 10}px`,
            }}
          >
            {/* Friendly Speech Callout Bubble above Avatar */}
            <div className="mb-1 -translate-y-2 bg-white text-slate-900 font-fun font-bold text-[11px] px-3 py-1 rounded-xl shadow-lg border-2 border-amber-400 whitespace-nowrap flex items-center gap-1.5 animate-pulse-soft">
              <span>👦 Kiki:</span>
              <span className="text-amber-700 font-extrabold">
                {avatarSpeechText}
              </span>
            </div>

            {/* Top-Down Visual Character Illustration */}
            <div className="relative w-14 h-14 flex items-center justify-center filter drop-shadow-lg">
              {/* Character shadow on floor */}
              <div className="absolute bottom-1 w-10 h-3 bg-black/35 rounded-full blur-[1px]" />
              {/* Character Avatar Icon */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 via-orange-400 to-yellow-300 border-2 border-white flex items-center justify-center text-2xl shadow-md">
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
          <span className="font-bold text-slate-800">Petunjuk Petualangan:</span>
          <span>
            Sentuh ruangan yang berpendar untuk mengamati situasi dan menentukan Hak atau Kewajiban.
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
  roomId,
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
      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 transform hover:scale-110 z-20 group ${
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
        className={`px-3.5 py-1.5 rounded-2xl shadow-xl border-2 flex items-center gap-2 font-fun font-bold text-xs sm:text-sm backdrop-blur-xs transition-colors ${
          isExplored
            ? 'bg-emerald-500 text-white border-white ring-2 ring-emerald-300'
            : isActive
            ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white border-white ring-4 ring-amber-300 shadow-amber-400/60'
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
            Area {stepNumber}
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
