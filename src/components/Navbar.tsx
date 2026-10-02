/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, BookOpen, RotateCcw, Home } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface NavbarProps {
  currentView: 'story' | 'map';
  onNavigate: (view: 'story' | 'map') => void;
  onOpenHandbook: () => void;
  onResetMissions: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  completedRoomsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenHandbook,
  onResetMissions,
  isMuted,
  onToggleMute,
  completedRoomsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/80 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => {
            sounds.playClick();
            onNavigate('map');
          }}
          className="text-left group cursor-pointer"
        >
          <div className="font-fun text-xl sm:text-2xl font-bold tracking-tight text-amber-900 group-hover:text-amber-700 transition-colors">
            Misi Rumahku
          </div>
          <div className="text-[11px] text-amber-700/80 font-medium hidden sm:block -mt-1">
            Hak & Kewajiban Anak di Rumah · Pendidikan Pancasila Kelas III
          </div>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2 text-sm font-medium">
          <button
            onClick={() => {
              sounds.playClick();
              onNavigate('map');
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              currentView === 'map'
                ? 'bg-amber-100 text-amber-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4 h-4 text-amber-600" />
            <span className="hidden xs:inline">Peta Rumah</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenHandbook();
            }}
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
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
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer hidden md:inline-flex ${
              currentView === 'story'
                ? 'bg-amber-100 text-amber-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Cerita Pembuka
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          {/* Audio voice toggle */}
          <button
            onClick={() => {
              onToggleMute();
              sounds.playClick();
            }}
            title={isMuted ? 'Nyalakan Suara Narator' : 'Matikan Suara Narator'}
            className="p-2 rounded-lg text-slate-600 hover:text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer border border-amber-200/60"
            aria-label="Toggle Audio"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-slate-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-amber-600" />
            )}
          </button>

          {/* Reset mission progress */}
          <button
            onClick={() => {
              sounds.playClick();
              onResetMissions();
            }}
            title="Ulangi Misi dari Awal (Restart)"
            className="px-2.5 py-1.5 rounded-xl text-rose-700 hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer border border-rose-200 flex items-center gap-1.5 text-xs font-bold shadow-2xs"
            aria-label="Restart Misi"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden xs:inline">Restart</span>
          </button>
        </div>
      </div>
    </header>
  );
};
