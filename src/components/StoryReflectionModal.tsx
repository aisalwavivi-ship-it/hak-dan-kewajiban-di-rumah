/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Trophy, CheckCircle, ArrowRight, Heart } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface StoryReflectionModalProps {
  onClose: () => void;
  onExploreMore: () => void;
}

export const StoryReflectionModal: React.FC<StoryReflectionModalProps> = ({
  onClose,
  onExploreMore,
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden text-center p-6 sm:p-8 space-y-6">
        
        {/* Celebration Trophy Icon */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-white flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">
          <Trophy className="w-10 h-10 text-amber-900" />
        </div>

        <div>
          <span className="text-xs uppercase tracking-widest font-extrabold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
            MISI SELESAI DENGAN SUKSES!
          </span>
          <h2 className="font-fun text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            Jawaban untuk Dilema Kiki!
          </h2>
        </div>

        {/* Narrative Resolution */}
        <div className="bg-amber-50/70 border-2 border-amber-200 rounded-2xl p-5 text-left space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👦✨</span>
            <span className="font-fun font-bold text-amber-950 text-base">
              Kiki Sekarang Tahu Apa yang Harus Dilakukan:
            </span>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">
            “Kiki memutuskan untuk <strong>melaksanakan kewajibannya terlebih dahulu</strong>: merapikan tempat tidurnya, menaruh piring kotor ke wastafel dapur, dan menata sepatunya.”
          </p>

          <p className="text-sm text-slate-700 leading-relaxed">
            “Setelah rumah kembali rapi dan bersih, Kiki mencium tangan ibu untuk meminta izin bermain. Ibu tersenyum bangga dan mengizinkannya. Kiki pun bisa menikmati <strong>haknya bermain bersama teman-teman</strong> dengan hati yang tenang dan gembira!”
          </p>

          <div className="pt-2 border-t border-amber-200/80 flex items-center gap-2 text-xs font-bold text-emerald-800">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Kewajiban dilaksanakan dengan baik, Hak dinikmati dengan bahagia!</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              sounds.playClick();
              onExploreMore();
            }}
            className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-fun font-bold rounded-2xl shadow-md transition-all transform hover:scale-102 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Jelajahi Waktu Siang / Malam Lainnya</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-colors cursor-pointer"
          >
            Tutup Refleksi
          </button>
        </div>

      </div>
    </div>
  );
};
