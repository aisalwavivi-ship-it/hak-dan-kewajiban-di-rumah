/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Volume2,
  CheckCircle2,
  Scale,
  Sparkles,
  Heart,
  ShieldCheck,
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import { UserProgress } from '../types';
import { HOUSE_ROOMS } from '../data/houseData';

interface MisiHandbookModalProps {
  onClose: () => void;
  progress: UserProgress;
}

export const MisiHandbookModal: React.FC<MisiHandbookModalProps> = ({ onClose, progress }) => {
  const [activeTab, setActiveTab] = useState<'rangkuman' | 'kewajiban' | 'hak'>('rangkuman');

  const handleSpeak = (text: string) => {
    sounds.speakIndonesian(text);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border-2 border-amber-300 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-4 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl shadow-inner">
              📖
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-100">
                Pendidikan Pancasila Kelas III SD
              </span>
              <h2 className="font-fun text-xl sm:text-2xl font-bold leading-tight">
                Buku Saku: Hak & Kewajibanku di Rumah
              </h2>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('rangkuman');
            }}
            className={`px-4 py-2 rounded-xl font-fun font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'rangkuman'
                ? 'bg-amber-100 text-amber-900 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ⚖️ Inti Konsep & Keseimbangan
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('kewajiban');
            }}
            className={`px-4 py-2 rounded-xl font-fun font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'kewajiban'
                ? 'bg-emerald-100 text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🧹 Contoh Kewajiban
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('hak');
            }}
            className={`px-4 py-2 rounded-xl font-fun font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'hak'
                ? 'bg-sky-100 text-sky-900 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🎁 Contoh Hak
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* TAB 1: RANGKUMAN & KESEIMBANGAN */}
          {activeTab === 'rangkuman' && (
            <div className="space-y-5">
              
              {/* Formula Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* HAK Card */}
                <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-4 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-fun font-bold text-sky-900 text-lg flex items-center gap-1.5">
                      <span>🎁 Apa itu HAK?</span>
                    </span>
                    <button
                      onClick={() => handleSpeak('Hak adalah sesuatu yang harus kita terima.')}
                      className="text-sky-700 hover:text-sky-900 cursor-pointer"
                      title="Dengarkan"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    <strong>Hak</strong> adalah segala sesuatu yang <em>harus kita terima</em> atau kita peroleh sejak lahir, terutama dari orang tua dan keluarga tercinta di rumah.
                  </p>
                </div>

                {/* KEWAJIBAN Card */}
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-fun font-bold text-emerald-900 text-lg flex items-center gap-1.5">
                      <span>🧹 Apa itu KEWAJIBAN?</span>
                    </span>
                    <button
                      onClick={() => handleSpeak('Kewajiban adalah sesuatu yang harus kita lakukan.')}
                      className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                      title="Dengarkan"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    <strong>Kewajiban</strong> adalah segala sesuatu yang <em>harus kita lakukan</em> dengan penuh tanggung jawab, disiplin, dan rasa ikhlas untuk membantu keluarga.
                  </p>
                </div>
              </div>

              {/* The Golden Rule: Seimbang! */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center text-xl shrink-0">
                    <Scale className="w-6 h-6 text-amber-800" />
                  </div>
                  <div>
                    <h3 className="font-fun font-bold text-slate-900 text-base sm:text-lg mb-1">
                      Pesan Penting: Hak & Kewajiban Harus Seimbang!
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3">
                      “Kita tidak boleh hanya menuntut hak bermain atau bersenang-senang, tetapi melupakan kewajiban membantu orang tua. <strong>Laksanakan kewajibanmu dengan baik lebih dulu, barulah kamu memperoleh hakmu dengan bahagia!”</strong>
                    </p>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-200/80 px-3 py-1.5 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ingat Kasus Kiki: Bereskan rumah dulu, baru pamit bermain!</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Status Penjelajahan Ruangan Rumah:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.values(HOUSE_ROOMS).map((room) => {
                    const isDone = progress.exploredRooms[room.id];
                    return (
                      <div
                        key={room.id}
                        className={`p-2.5 rounded-xl border text-center text-xs font-semibold flex flex-col items-center gap-1 ${
                          isDone
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        <CheckCircle2 className={`w-4 h-4 ${isDone ? 'text-emerald-600' : 'text-slate-300'}`} />
                        <span className="line-clamp-1">{room.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CONTOH KEWAJIBAN */}
          {activeTab === 'kewajiban' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-medium">
                Kewajiban adalah tindakan nyata yang kita lakukan untuk membantu keluarga dan merawat diri.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: '🛏️', title: 'Merapikan Tempat Tidur', desc: 'Melipat selimut dan meratakan sprei sendiri setelah bangun pagi.' },
                  { icon: '📚', title: 'Belajar & Mengerjakan Tugas', desc: 'Menyelesaikan PR dan menyiapkan jadwal buku pelajaran untuk besok.' },
                  { icon: '🍽️', title: 'Membawa Piring Sendiri', desc: 'Membawa piring dan sendok kotor ke wastafel setelah makan.' },
                  { icon: '🤝', title: 'Meminta Izin Sebelum Bermain', desc: 'Berpamitan dan mencium tangan orang tua dengan sopan sebelum ke luar.' },
                  { icon: '👟', title: 'Menata Sandal & Sepatu', desc: 'Menaruh kembali alas kaki ke rak agar ruang tamu rapi.' },
                  { icon: '🚰', title: 'Menghemat Air & Listrik', desc: 'Mematikan kran air dan lampu kamar bila sudah tidak dipakai.' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-start gap-3 shadow-xs">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h4 className="font-fun font-bold text-slate-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CONTOH HAK */}
          {activeTab === 'hak' && (
            <div className="space-y-4">
              <div className="bg-sky-50 p-3 rounded-xl border border-sky-200 text-xs text-sky-900 font-medium">
                Hak adalah hal-hal baik dan penuh kasih sayang yang berhak diterima anak dari keluarga.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: '❤️', title: 'Kasih Sayang & Perhatian', desc: 'Memperoleh pelukan hangat, cinta, dan bimbingan lembut orang tua.' },
                  { icon: '🏡', title: 'Tempat Tinggal Nyaman', desc: 'Mendapatkan rumah yang bersih, aman, dan kamar istirahat yang layak.' },
                  { icon: '🍲', title: 'Makanan Bergizi & Minum', desc: 'Disediakan sarapan sehat, makanan bergizi, dan air minum bersih.' },
                  { icon: '⚽', title: 'Waktu Luang untuk Bermain', desc: 'Memiliki kesempatan bermain dan bersosialisasi bersama teman-teman.' },
                  { icon: '📖', title: 'Didampingi Saat Belajar', desc: 'Dibimbing oleh orang tua saat mengalami kesulitan materi pelajaran.' },
                  { icon: '🩹', title: 'Perawatan Kesehatan', desc: 'Diberikan pengobatan dan kasih sayang saat tubuh sedang kurang sehat.' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-start gap-3 shadow-xs">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h4 className="font-fun font-bold text-slate-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Modul Pembelajaran Mandiri Siswa SD Kelas III
          </span>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="ml-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-fun font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Tutup Buku Saku
          </button>
        </div>

      </div>
    </div>
  );
};
