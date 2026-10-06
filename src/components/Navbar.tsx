/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, BookOpen, RotateCcw, Home } from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import { ASSETS } from '../data/houseData';

interface NavbarProps {
  currentView: 'story' | 'map';
  onNavigate: (view: 'story' | 'map') => void;
  onOpenHandbook: () => void;
  onResetMissions: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  completedRoomsCount: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenHandbook,
  onResetMissions,
  isMuted,
  onToggleMute,
  completedRoomsCount,
  onZoomIn,
  onZoomOut,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-3">
        
        {/* ========================================================
            ZONE 1: BRAND & VISUAL IDENTITY
            Hierarchy:
            1. KIKI'S HOME QUEST (Main Title)
            2. Jelajah Hak & Kewajiban di Rumah (Subtitle)
            3. Pendidikan Pancasila · Kelas III (Identity)
            ======================================================== */}
        <button
          onClick={() => {
            sounds.playClick();
            onNavigate('map');
          }}
          className="flex items-center gap-2.5 sm:gap-3.5 text-left group cursor-pointer shrink-0"
        >
          {/* Visual Identity Logo: 3D Kiki in front of house */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md group-hover:scale-105 group-hover:border-amber-500 transition-all bg-amber-100 shrink-0">
            <img
              src={ASSETS.appLogo || '/src/assets/images/kiki_home_quest_logo_1791263617153.jpg'}
              alt="Kiki's Home Quest Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex flex-col">
            {/* Primary Main Brand Name */}
            <h1 className="font-fun text-lg sm:text-2xl font-extrabold tracking-tight text-amber-900 group-hover:text-amber-700 transition-colors leading-none">
              KIKI'S HOME QUEST
            </h1>
            
            {/* Subtitle */}
            <div className="text-xs sm:text-sm font-bold text-amber-800/90 leading-tight mt-0.5 sm:mt-1">
              Jelajah Hak & Kewajiban di Rumah
            </div>

            {/* Curriculum Identity */}
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">
              Pendidikan Pancasila · Kelas III
            </div>
          </div>
        </button>

        {/* ========================================================
            ZONE 2: NAVIGATION TABS
            ======================================================== */}
        <nav className="hidden lg:flex items-center gap-1.5 text-sm font-medium">
          <button
            onClick={() => {
              sounds.playClick();
              onNavigate('map');
            }}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              currentView === 'map'
                ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4 h-4 text-amber-600" />
            <span>Peta Rumah 3D</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenHandbook();
            }}
            className="px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer border border-transparent"
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Buku Saku</span>
            {completedRoomsCount > 0 && (
              <span className="bg-amber-200 text-amber-900 text-xs px-1.5 py-0.2 rounded-md font-bold tabular-nums">
                {completedRoomsCount}/5
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onNavigate('story');
            }}
            className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
              currentView === 'story'
                ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Cerita Pembuka
          </button>
        </nav>

        {/* ========================================================
            ZONE 3: GLOBAL CONTROLS (ZOOM CONTROLS AT THE VERY TOP)
            Hierarchy & Layout:
            - Zoom Out (-) & Zoom In (+) grouped together cleanly
            - Audio Mute/Unmute
            - Reset Game
            ======================================================== */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Top-Level Zoom Controls Group: [ − ] [ + ] */}
          {onZoomIn && onZoomOut && (
            <div className="flex items-center bg-amber-50/90 border border-amber-300 rounded-xl p-0.5 shadow-2xs">
              <button
                onClick={onZoomOut}
                title="Perkecil Tampilan Rumah (−)"
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-slate-700 hover:text-amber-950 hover:bg-amber-200/70 transition-colors cursor-pointer text-lg select-none leading-none active:scale-95"
                aria-label="Zoom Out"
              >
                −
              </button>
              <div className="w-[1px] h-4 bg-amber-300/80 mx-0.5" />
              <button
                onClick={onZoomIn}
                title="Perbesar Tampilan Rumah (+)"
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-slate-700 hover:text-amber-950 hover:bg-amber-200/70 transition-colors cursor-pointer text-lg select-none leading-none active:scale-95"
                aria-label="Zoom In"
              >
                +
              </button>
            </div>
          )}

          {/* Audio toggle */}
          <button
            onClick={() => {
              onToggleMute();
              sounds.playClick();
            }}
            title={isMuted ? 'Nyalakan Suara (Narasi & Suasana Ambience)' : 'Matikan Suara (Narasi & Suasana Ambience)'}
            className="p-2 rounded-xl text-slate-600 hover:text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer border border-amber-200/80"
            aria-label="Toggle Audio"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            ) : (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            )}
          </button>

          {/* Reset mission progress */}
          <button
            onClick={() => {
              sounds.playClick();
              onResetMissions();
            }}
            title="Ulangi Petualangan dari Awal"
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-rose-700 hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer border border-rose-200 flex items-center gap-1.5 text-xs font-bold shadow-2xs"
            aria-label="Restart Misi"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Ulangi</span>
          </button>
        </div>

      </div>
    </header>
  );
};
