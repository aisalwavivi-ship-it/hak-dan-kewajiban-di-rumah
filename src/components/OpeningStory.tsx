/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Sparkles, Volume2, HelpCircle, ArrowRight } from 'lucide-react';
import { ASSETS } from '../data/houseData';
import { sounds } from '../utils/soundEffects';

interface OpeningStoryProps {
  onStartMission: () => void;
  isMuted: boolean;
}

export const OpeningStory: React.FC<OpeningStoryProps> = ({ onStartMission, isMuted }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const storySteps = [
    {
      title: 'Hari Minggu yang Cerah...',
      narration: 'Kiki, seorang siswa kelas III SD, sudah bersiap-siap dengan pakaian santai. Teman-teman di luar rumah sudah memanggilnya untuk bermain bola bersama.',
      characterThought: '“Asyik! Hari ini cuacanya sangat cerah. Teman-teman sudah menungguku di lapangan!”',
    },
    {
      title: 'Namun, Saat Hendak Melangkah Keluar...',
      narration: 'Ketika Kiki menoleh ke belakang, ia terkejut melihat kondisi dalam rumahnya yang masih berantakan setelah aktivitas tadi pagi.',
      characterThought: '“Wah... tempat tidurku belum dirapikan, pakaian ganti masih berserakan di kursi, dan piring sarapan masih ada di atas meja...”',
    },
    {
      title: 'Dilema Si Kecil Kiki',
      narration: 'Kiki terdiam di dekat pintu depan rumah. Ia merasa bimbang antara langsung pergi bersenang-senang atau merapikan rumah terlebih dahulu.',
      characterThought: '“Aku ingin bermain bersama teman-temanku... tapi rumah masih berantakan. Apa yang harus aku lakukan lebih dulu?”',
    },
  ];

  const current = storySteps[currentStep];

  const handleNextOrStart = () => {
    sounds.playClick();
    if (currentStep < storySteps.length - 1) {
      setCurrentStep(currentStep + 1);
      if (!isMuted) {
        sounds.speakIndonesian(storySteps[currentStep + 1].characterThought);
      }
    } else {
      sounds.playSuccess();
      onStartMission();
    }
  };

  const handleSpeak = (text: string) => {
    sounds.speakIndonesian(text);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-amber-50/80 via-orange-50/40 to-emerald-50/40">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border border-amber-200/90 overflow-hidden flex flex-col md:flex-row transition-all duration-300">
        
        {/* Left Side: Visual Illustration */}
        <div className="md:w-1/2 relative bg-amber-100 flex items-center justify-center min-h-[280px] sm:min-h-[360px] overflow-hidden">
          <img
            src={ASSETS.heroStoryOpening}
            alt="Anak SD bingung melihat rumah berantakan sebelum bermain"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          {/* Badge indicator */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs text-amber-900 text-xs font-semibold px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Cerita Awal Pembelajaran</span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white text-xs sm:text-sm font-medium drop-shadow-md">
            Situasi: Kiki ingin bermain, tetapi rumah masih berantakan.
          </div>
        </div>

        {/* Right Side: Narrative Story & Dilemma */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Step Indicators */}
            <div className="flex items-center gap-2 mb-4">
              {storySteps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    sounds.playClick();
                    setCurrentStep(idx);
                  }}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentStep === idx
                      ? 'w-8 bg-amber-500'
                      : 'w-2 bg-amber-200 hover:bg-amber-300'
                  }`}
                  aria-label={`Buka adegan ${idx + 1}`}
                />
              ))}
              <span className="text-xs text-slate-500 ml-auto font-medium">
                Adegan {currentStep + 1} dari {storySteps.length}
              </span>
            </div>

            {/* Title */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="font-fun text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {current.title}
              </h2>
              <button
                onClick={() => handleSpeak(current.characterThought)}
                title="Dengarkan Suara Kiki"
                className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {/* Narrative text */}
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-4">
              {current.narration}
            </p>

            {/* Problem Dialogue Speech Bubble */}
            <div className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 relative shadow-inner mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                  👦
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span>Kiki Berkata dalam Hatinya:</span>
                  </div>
                  <p className="font-fun text-base sm:text-lg font-semibold text-amber-950 leading-snug">
                    {current.characterThought}
                  </p>
                </div>
              </div>
            </div>

            {/* Problem-based learning note for 3rd graders */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Pikirkan bersama: Apa yang seharusnya Kiki lakukan terlebih dahulu?
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            {currentStep > 0 && (
              <button
                onClick={() => {
                  sounds.playClick();
                  setCurrentStep(currentStep - 1);
                }}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors cursor-pointer"
              >
                Kembali
              </button>
            )}

            <button
              onClick={handleNextOrStart}
              className={`ml-auto px-6 py-3.5 rounded-2xl font-fun font-bold text-base sm:text-lg text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2.5 ${
                currentStep === storySteps.length - 1
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 shadow-orange-200 animate-pulse-soft'
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
              }`}
            >
              {currentStep === storySteps.length - 1 ? (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>MULAI MISI</span>
                </>
              ) : (
                <>
                  <span>Lanjutkan Cerita</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
