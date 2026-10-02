/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Volume2,
  CheckCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { RoomData, TimeOfDay, SituationItem, ConceptType } from '../types';
import { sounds } from '../utils/soundEffects';

interface RoomModalProps {
  room: RoomData;
  currentTime: TimeOfDay;
  onClose: () => void;
  onMissionSuccess: (roomId: string, time: TimeOfDay) => void;
  isMuted: boolean;
}

interface PopupFeedbackState {
  isOpen: boolean;
  isCorrect: boolean;
  step: 'A' | 'B';
}

export const RoomModal: React.FC<RoomModalProps> = ({
  room,
  currentTime,
  onClose,
  onMissionSuccess,
}) => {
  const mission = room.missions[currentTime];
  const { situationA, situationB } = mission;

  // Step 1: 'A' -> Step 2: 'B'
  const [activeStep, setActiveStep] = useState<'A' | 'B'>('A');

  // Selected answers for each situation
  const [selectedForA, setSelectedForA] = useState<ConceptType | null>(null);
  const [selectedForB, setSelectedForB] = useState<ConceptType | null>(null);

  // Completed status
  const [isStepAComplete, setIsStepAComplete] = useState<boolean>(false);
  const [isStepBComplete, setIsStepBComplete] = useState<boolean>(false);

  // Center Modal Pop-Up Feedback State
  const [popupFeedback, setPopupFeedback] = useState<PopupFeedbackState | null>(null);

  // Handler for Situation A
  const handleSelectA = (type: ConceptType) => {
    sounds.playClick();
    setSelectedForA(type);
    const isCorrect = type === situationA.type;

    if (isCorrect) {
      setIsStepAComplete(true);
      sounds.playSuccess();
      sounds.speakIndonesian(`Hebat! Jawabanmu tepat! ${situationA.explanation}`);
    } else {
      sounds.playGentleHint();
      sounds.speakIndonesian(
        'Belum tepat. Coba perhatikan lagi situasinya. Apa yang harus dilakukan anak, atau apa yang seharusnya diterima anak?'
      );
    }

    // Open Center Modal Pop-Up
    setPopupFeedback({
      isOpen: true,
      isCorrect,
      step: 'A',
    });
  };

  // Handler for Situation B
  const handleSelectB = (type: ConceptType) => {
    sounds.playClick();
    setSelectedForB(type);
    const isCorrect = type === situationB.type;

    if (isCorrect) {
      setIsStepBComplete(true);
      sounds.playSuccess();
      triggerVictoryConfetti();
      sounds.speakIndonesian(`Luar biasa! Jawabanmu tepat! ${situationB.explanation}`);
    } else {
      sounds.playGentleHint();
      sounds.speakIndonesian(
        'Belum tepat. Coba perhatikan lagi situasinya. Apa yang harus dilakukan anak, atau apa yang seharusnya diterima anak?'
      );
    }

    // Open Center Modal Pop-Up
    setPopupFeedback({
      isOpen: true,
      isCorrect,
      step: 'B',
    });
  };

  const triggerVictoryConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#EC4899'],
      });
    } catch {
      // Ignored if canvas not ready
    }
  };

  const handleSpeakCurrentStep = () => {
    if (activeStep === 'A') {
      sounds.speakIndonesian(
        `Situasi A di ${room.name}: ${situationA.description}. Menurutmu, apakah ini Hak atau Kewajiban?`
      );
    } else {
      sounds.speakIndonesian(
        `Situasi B di ${room.name}: ${situationB.description}. Menurutmu, apakah ini Hak atau Kewajiban?`
      );
    }
  };

  // Actions from Center Pop-Up
  const handleRetryFromPopup = () => {
    sounds.playClick();
    if (popupFeedback?.step === 'A') {
      setSelectedForA(null);
    } else {
      setSelectedForB(null);
    }
    setPopupFeedback(null);
  };

  const handleNextStepFromPopup = () => {
    sounds.playClick();
    setPopupFeedback(null);
    setActiveStep('B');
    sounds.speakIndonesian(`Sekarang amati situasi B di ${room.name}.`);
  };

  const handleFinishFromPopup = () => {
    sounds.playClick();
    setPopupFeedback(null);
    onMissionSuccess(room.id, currentTime);
    onClose();
  };

  const currentSituation = activeStep === 'A' ? situationA : situationB;

  return (
    <div className="fixed inset-0 z-50 bg-amber-50/95 flex flex-col overflow-y-auto animate-in fade-in duration-200">
      
      {/* ========================================================
          FULL-SCREEN TOP NAVIGATION HEADER
          ======================================================== */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-amber-300 shadow-sm px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* Left: Back to Map Button & Room Title */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-fun font-bold text-xs sm:text-sm transition-colors cursor-pointer border border-amber-300 shadow-xs"
            title="Kembali ke Peta Rumah"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Kembali ke Peta</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold text-amber-700">
                RUANGAN RUMAH
              </span>
              <span className="text-[10px] sm:text-xs bg-amber-200/90 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                Waktu {currentTime.toUpperCase()}
              </span>
            </div>
            <h1 className="font-fun text-lg sm:text-2xl font-bold text-slate-900 leading-tight">
              {room.name}
            </h1>
          </div>
        </div>

        {/* Center: Sequential Step Progress Badges */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-fun font-bold text-xs transition-colors ${
              activeStep === 'A'
                ? 'bg-amber-500 text-white shadow-xs'
                : isStepAComplete
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-slate-500'
            }`}
          >
            {isStepAComplete ? (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-white/30 text-center text-[10px] leading-4 font-bold">1</span>
            )}
            <span>Situasi A</span>
          </div>

          <span className="text-slate-300 font-bold">➔</span>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-fun font-bold text-xs transition-colors ${
              activeStep === 'B'
                ? 'bg-amber-500 text-white shadow-xs'
                : isStepBComplete
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-slate-400'
            }`}
          >
            {isStepBComplete ? (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 text-center text-[10px] leading-4 font-bold">2</span>
            )}
            <span>Situasi B</span>
          </div>
        </div>

        {/* Right: Audio Speak & Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSpeakCurrentStep}
            className="p-2 sm:px-3 sm:py-2 text-amber-800 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer border border-amber-200 flex items-center gap-1.5 text-xs font-semibold"
            title="Dengarkan Suara Pertanyaan"
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">Dengarkan</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer text-xs font-bold"
            title="Tutup & Kembali ke Peta"
          >
            Tutup
          </button>
        </div>

      </header>

      {/* ========================================================
          FULL-SCREEN ACTIVITY STAGE
          ======================================================== */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-start space-y-6">
        
        {/* Step Indicator on Mobile */}
        <div className="flex md:hidden items-center justify-between text-xs font-fun font-bold bg-white p-2.5 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>Tahap Saat Ini:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={activeStep === 'A' ? 'text-amber-800 font-extrabold' : 'text-slate-400'}>
              Situasi A {isStepAComplete && '✓'}
            </span>
            <span className="text-slate-300">|</span>
            <span className={activeStep === 'B' ? 'text-amber-800 font-extrabold' : 'text-slate-400'}>
              Situasi B {isStepBComplete && '✓'}
            </span>
          </div>
        </div>

        {/* Teacher Instruction Header Banner */}
        <div className="bg-amber-100/80 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4 shadow-sm">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-2xl shrink-0 shadow-xs">
            👩‍🏫
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-0.5">
              Instruksi Pengamatan Guru:
            </div>
            <p className="font-fun text-base sm:text-xl font-bold text-slate-900 leading-snug">
              {activeStep === 'A'
                ? `“Amati gambar Situasi A di ${room.name}! Menurutmu, apakah ini menunjukkan HAK atau KEWAJIBAN anak?”`
                : `“Bagus! Sekarang amati gambar Situasi B di ${room.name}! Apakah ini menunjukkan HAK atau KEWAJIBAN anak?”`}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Petunjuk Belajar: <strong>Kewajiban</strong> adalah sesuatu yang harus kita lakukan. <strong>Hak</strong> adalah sesuatu yang harus kita terima.
            </p>
          </div>
        </div>

        {/* ======================================================
            ACTIVE SITUATION CARD (SITUASI A OR SITUASI B)
            ====================================================== */}
        <div className="w-full bg-white rounded-3xl border-2 border-amber-300/90 shadow-xl overflow-hidden flex flex-col animate-in fade-in duration-300">
          
          {/* Top Bar of Situation Card */}
          <div className="px-5 py-3.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
            <span className="font-fun font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-xs ${
                  activeStep === 'A' ? 'bg-amber-500' : 'bg-sky-500'
                }`}
              >
                {activeStep}
              </span>
              <span>Situasi {activeStep}: {currentSituation.title}</span>
            </span>
            <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              {currentSituation.visualPlaceholder.badgeTag}
            </span>
          </div>

          {/* Visual Picture Area - STRICTLY NO LABELS "HAK" / "KEWAJIBAN" */}
          <div className="relative aspect-16/9 sm:aspect-21/9 max-h-[380px] bg-slate-100 overflow-hidden flex items-center justify-center border-b border-slate-100">
            {currentSituation.imageSrc ? (
              <img
                src={currentSituation.imageSrc}
                alt={`Situasi ${activeStep}: ${currentSituation.title}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              /* Educational Visual Card Placeholder */
              <div
                className={`w-full h-full p-6 sm:p-8 flex flex-col items-center justify-center text-center relative ${
                  activeStep === 'A'
                    ? 'bg-gradient-to-b from-amber-50/60 to-orange-50/60'
                    : 'bg-gradient-to-b from-sky-50/60 to-indigo-50/60'
                }`}
              >
                <div className="w-20 h-20 rounded-3xl bg-white shadow-md border border-amber-200 flex items-center justify-center text-4xl mb-3">
                  {currentSituation.visualPlaceholder.iconEmoji}
                </div>
                <div className="font-fun font-bold text-slate-800 text-lg mb-1">
                  {currentSituation.visualPlaceholder.roomObject}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md">
                  {currentSituation.description}
                </p>
                <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-xs text-[10px] text-slate-500 px-2 py-1 rounded-md border border-slate-200 font-semibold">
                  <ImageIcon className="w-3 h-3 text-amber-600" />
                  <span>Asset Slot Gambar</span>
                </div>
              </div>
            )}

            {/* Read Aloud Button on Top Right */}
            <button
              onClick={() => sounds.speakIndonesian(currentSituation.description)}
              className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-xs text-slate-700 hover:text-amber-800 rounded-xl shadow-md cursor-pointer border border-slate-200"
              title={`Dengarkan Deskripsi Situasi ${activeStep}`}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Description & Decision Area */}
          <div className="p-5 sm:p-7 space-y-5">
            <div>
              <h3 className="font-fun font-bold text-slate-900 text-lg sm:text-xl mb-1.5">
                {currentSituation.title}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {currentSituation.description}
              </p>
            </div>

            {/* Decision Buttons (HAK vs KEWAJIBAN) - Clean, NO inline panel below */}
            <div className="pt-4 border-t border-slate-100">
              <div className="text-sm font-bold text-slate-800 mb-3">
                Pilih: Menurutmu situasi {activeStep} ini merupakan...
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-lg">
                <button
                  onClick={() => (activeStep === 'A' ? handleSelectA('kewajiban') : handleSelectB('kewajiban'))}
                  className={`py-3.5 px-5 rounded-2xl border-2 font-fun font-bold text-base sm:text-lg transition-all transform active:scale-95 cursor-pointer shadow-xs flex items-center justify-center gap-2.5 ${
                    (activeStep === 'A' ? selectedForA : selectedForB) === 'kewajiban'
                      ? 'border-amber-500 bg-amber-200 text-amber-950 scale-102 ring-2 ring-amber-300'
                      : 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 hover:scale-101'
                  }`}
                >
                  <span className="text-2xl">🧹</span>
                  <span>KEWAJIBAN</span>
                </button>
                <button
                  onClick={() => (activeStep === 'A' ? handleSelectA('hak') : handleSelectB('hak'))}
                  className={`py-3.5 px-5 rounded-2xl border-2 font-fun font-bold text-base sm:text-lg transition-all transform active:scale-95 cursor-pointer shadow-xs flex items-center justify-center gap-2.5 ${
                    (activeStep === 'A' ? selectedForA : selectedForB) === 'hak'
                      ? 'border-sky-500 bg-sky-200 text-sky-950 scale-102 ring-2 ring-sky-300'
                      : 'border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-900 hover:scale-101'
                  }`}
                >
                  <span className="text-2xl">🎁</span>
                  <span>HAK</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* ========================================================
          QUIET FOOTER NOTE
          ======================================================== */}
      <footer className="py-3 px-6 bg-white/70 border-t border-amber-200/60 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Pendidikan Pancasila Kelas III SD: Hak dan Kewajiban Harus Seimbang</span>
        </div>
      </footer>

      {/* ========================================================
          ✨ CENTER MODAL POP-UP FOR FEEDBACK (BENAR & SALAH)
          Overlayed softly in center over the full-screen activity!
          ======================================================== */}
      {popupFeedback?.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border-3 relative flex flex-col items-center text-center animate-in zoom-in-95 duration-200 ${
              popupFeedback.isCorrect ? 'border-emerald-400' : 'border-rose-400'
            }`}
          >
            {popupFeedback.isCorrect ? (
              /* ================= POP-UP JAWABAN BENAR ================= */
              <>
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl mb-3 shadow-xs">
                  🎉
                </div>

                <h3 className="font-fun text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                  Hebat! Jawabanmu Tepat!
                </h3>

                <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-6">
                  {popupFeedback.step === 'A' ? situationA.explanation : situationB.explanation}
                </p>

                {popupFeedback.step === 'A' ? (
                  <button
                    onClick={handleNextStepFromPopup}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-fun font-bold text-base rounded-2xl shadow-lg transition-transform hover:scale-102 flex items-center justify-center gap-2 cursor-pointer animate-pulse-soft"
                  >
                    <span>Lanjut ke Situasi B</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinishFromPopup}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-fun font-bold text-base rounded-2xl shadow-lg transition-transform hover:scale-102 flex items-center justify-center gap-2.5 cursor-pointer animate-pulse-soft"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Selesai & Kembali ke Peta Rumah</span>
                  </button>
                )}
              </>
            ) : (
              /* ================= POP-UP JAWABAN SALAH ================= */
              <>
                <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-3xl mb-3 shadow-xs border border-rose-200">
                  ❌
                </div>

                <h3 className="font-fun text-xl sm:text-2xl font-bold text-rose-950 mb-2">
                  Belum Tepat, Coba Perhatikan Lagi!
                </h3>

                <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3">
                  “Coba perhatikan lagi situasinya. Apa yang harus dilakukan anak? Atau apa yang seharusnya diterima anak?”
                </p>

                <div className="w-full bg-rose-50/80 p-3 rounded-2xl border border-rose-200 text-xs text-rose-900 italic mb-6 text-left">
                  <strong>Petunjuk:</strong>{' '}
                  {popupFeedback.step === 'A' ? situationA.hint : situationB.hint}
                </div>

                <button
                  onClick={handleRetryFromPopup}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-fun font-bold text-base rounded-2xl shadow-md transition-transform hover:scale-102 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Coba Lagi</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
