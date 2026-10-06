/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Upload,
  Film,
  Volume2,
  CheckCircle,
} from 'lucide-react';
import { ASSETS } from '../data/houseData';
import { sounds } from '../utils/soundEffects';

interface OpeningStoryProps {
  onStartMission: () => void;
  isMuted: boolean;
}

export const OpeningStory: React.FC<OpeningStoryProps> = ({ onStartMission, isMuted }) => {
  // Video playback state
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [isVideoFinished, setIsVideoFinished] = useState<boolean>(false);
  const [simulatedSceneIndex, setSimulatedSceneIndex] = useState<number>(0);

  // Student reflection / opinion state
  const [selectedOpinion, setSelectedOpinion] = useState<string | null>(null);
  const [customOpinion, setCustomOpinion] = useState<string>('');
  const [isOpinionSubmitted, setIsOpinionSubmitted] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Scenes matching the user's stimulus video
  const videoScenes = [
    {
      time: '00:00 - 00:05',
      title: 'Teman-Teman Bermain di Luar',
      dialogue: '“Sini-sini! Ayo, oper bolanya!”',
      description: 'Anak-anak sedang asyik bermain sepak bola di jalanan depan rumah pada hari Minggu yang cerah.',
      image: ASSETS.situationPlayWithFriends || ASSETS.heroStoryOpening,
    },
    {
      time: '00:06 - 00:15',
      title: 'Kiki Bersiap-Siap Ingin Bermain',
      dialogue: '“Hari Minggu yang cerah telah tiba. Asyik! Hari ini cuacanya sangat cerah! Aku sudah siap pergi bermain bersama teman-temanku!”',
      description: 'Kiki melompat gembira di kamarnya dan bersiap melangkah keluar rumah.',
      image: ASSETS.heroStoryOpening,
    },
    {
      time: '00:16 - 00:19',
      title: 'Kiki Menoleh dan Teringat Sesuatu',
      dialogue: '“Namun, Kiki teringat sesuatu. Kamarnya masih sangat berantakan...”',
      description: 'Tempat tidur belum dirapikan, mainan dan buku masih berserakan di lantai.',
      image: ASSETS.situationBedMaking || ASSETS.heroStoryOpening,
    },
    {
      time: '00:20 - 00:29',
      title: 'Kiki Tampak Bingung di Pintu',
      dialogue: '“Aku ingin bermain bersama teman-temanku. Tetapi, rumah masih berantakan. Apa yang seharusnya aku lakukan terlebih dahulu?”',
      description: 'Kiki berdiri di dekat pintu sambil memegang dagunya, bingung menentukan pilihan.',
      image: ASSETS.heroStoryOpening,
    },
  ];

  // Pre-set opinion choices for 3rd graders
  const opinionChoices = [
    {
      id: 'rapi_dulu',
      label: 'Merapikan kamar dan membantu rumah terlebih dahulu sebelum bermain',
      icon: '🧹',
    },
    {
      id: 'izin_tugas',
      label: 'Meminta izin orang tua dan menyelesaikan kewajiban tugas terlebih dahulu',
      icon: '🤝',
    },
    {
      id: 'lainnya',
      label: 'Tuliskan pendapatmu sendiri...',
      icon: '✏️',
    },
  ];

  // Handle uploaded video file from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setIsPlaying(true);
      setIsVideoFinished(false);
      sounds.playClick();
    }
  };

  // Play / Pause toggle
  const togglePlay = () => {
    sounds.playClick();
    if (videoRef.current && videoSrc) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    } else {
      // In simulated video mode
      if (isPlaying) {
        setIsPlaying(false);
        if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      } else {
        setIsPlaying(true);
      }
    }
  };

  // Simulated scene progression when no external video file is attached
  useEffect(() => {
    if (videoSrc) return; // Using native video tag

    if (isPlaying && !isVideoFinished) {
      if (!isMuted) {
        sounds.speakIndonesian(videoScenes[simulatedSceneIndex].dialogue);
      }

      simIntervalRef.current = setInterval(() => {
        setSimulatedSceneIndex((prev) => {
          if (prev >= videoScenes.length - 1) {
            if (simIntervalRef.current) clearInterval(simIntervalRef.current);
            setIsPlaying(false);
            setIsVideoFinished(true);
            setVideoProgress(100);
            return prev;
          }
          const next = prev + 1;
          setVideoProgress((next / videoScenes.length) * 100);
          if (!isMuted) {
            sounds.speakIndonesian(videoScenes[next].dialogue);
          }
          return next;
        });
      }, 7000); // 7s per scene ~ 28s total
    }

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isPlaying, isVideoFinished, videoSrc, simulatedSceneIndex, isMuted]);

  // Restart video
  const handleRestartVideo = () => {
    sounds.playClick();
    setIsVideoFinished(false);
    setVideoProgress(0);
    setSimulatedSceneIndex(0);
    if (videoRef.current && videoSrc) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      setIsPlaying(true);
    }
  };

  // Finish video directly
  const handleSkipOrFinishVideo = () => {
    sounds.playClick();
    setIsPlaying(false);
    setIsVideoFinished(true);
    setVideoProgress(100);
    sounds.speakIndonesian(
      'Kiki ingin bermain bersama teman-temannya. Namun, ia melihat rumahnya masih berantakan dan bingung harus melakukan apa terlebih dahulu. Menurutmu, apa yang sebaiknya Kiki lakukan terlebih dahulu?'
    );
  };

  // Submit opinion
  const handleSelectOpinion = (id: string) => {
    sounds.playClick();
    setSelectedOpinion(id);
    setIsOpinionSubmitted(true);
    sounds.playSuccess();
  };

  const handleStartApp = () => {
    sounds.playClick();
    sounds.playSuccess();
    onStartMission();
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center p-3 sm:p-6 lg:p-8 bg-gradient-to-b from-amber-50/80 via-orange-50/40 to-emerald-50/40">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border-2 border-amber-200/90 overflow-hidden flex flex-col transition-all duration-300">
        
        {/* ========================================================
            TOP TITLE HEADER: KIKI'S HOME QUEST CERITA PEMBUKA
            ======================================================== */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-5 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎬</span>
            <div>
              <div className="font-fun text-lg sm:text-xl font-extrabold tracking-tight leading-tight">
                Cerita Pembuka: Dilema Si Kecil Kiki
              </div>
              <div className="text-xs sm:text-sm text-amber-100 font-medium">
                Stimulus Pengamatan & Pemecahan Masalah
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
            <span>Pendidikan Pancasila Kelas III</span>
          </div>
        </div>

        {/* ========================================================
            VIDEO SECTION (STIMULUS UTAMA)
            Menampilkan:
            - Anak bermain bola di luar
            - Kiki bersiap bermain
            - Kiki melihat kondisi rumah yang masih berantakan
            - Kiki bingung menentukan apa yang harus dilakukan dulu
            ======================================================== */}
        <div className="p-4 sm:p-6 bg-slate-950 flex flex-col items-center">
          <div className="w-full max-w-2xl relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-400/80 shadow-2xl aspect-video flex items-center justify-center">
            
            {/* If native video src uploaded */}
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-cover"
                onEnded={() => {
                  setIsPlaying(false);
                  setIsVideoFinished(true);
                  setVideoProgress(100);
                }}
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    const dur = videoRef.current.duration || 1;
                    setVideoProgress((videoRef.current.currentTime / dur) * 100);
                  }
                }}
                controls
              />
            ) : (
              /* High-Fidelity Scene Presentation (matching user's video stimulus) */
              <div className="relative w-full h-full flex flex-col justify-end">
                <img
                  src={videoScenes[simulatedSceneIndex].image}
                  alt={videoScenes[simulatedSceneIndex].title}
                  className="absolute inset-0 w-full h-full object-cover select-none"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35 pointer-events-none" />

                {/* Top Badge: Scene indicator */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white text-xs z-10">
                  <span className="bg-amber-500/90 backdrop-blur-md px-3 py-1 rounded-full font-fun font-bold shadow-xs flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5" />
                    <span>Adegan {simulatedSceneIndex + 1} / 4</span>
                  </span>
                  <span className="bg-black/60 px-2.5 py-1 rounded-full text-slate-300 font-mono text-[11px]">
                    {videoScenes[simulatedSceneIndex].time}
                  </span>
                </div>

                {/* Subtitle / Dialogue overlay */}
                <div className="relative p-4 sm:p-5 z-10 text-white">
                  <div className="text-amber-300 font-fun font-bold text-xs sm:text-sm drop-shadow-md flex items-center gap-1.5 mb-1">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span>{videoScenes[simulatedSceneIndex].title}</span>
                  </div>
                  <p className="font-fun text-sm sm:text-base font-bold text-white drop-shadow-lg leading-snug">
                    {videoScenes[simulatedSceneIndex].dialogue}
                  </p>
                </div>
              </div>
            )}

            {/* Center Big Play Button Overlay when paused & not finished */}
            {!isPlaying && !isVideoFinished && (
              <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                <button
                  onClick={togglePlay}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 cursor-pointer ring-4 ring-white/60 animate-pulse-soft"
                  title="Putar Video Cerita"
                >
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current translate-x-1" />
                </button>
              </div>
            )}
          </div>

          {/* Video Control Bar below video */}
          <div className="w-full max-w-2xl mt-3 flex items-center justify-between gap-3 text-white text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 font-bold font-fun"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? 'Jeda' : 'Putar'}</span>
              </button>

              <button
                onClick={handleRestartVideo}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Ulangi Video dari Awal"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Upload video file button for teacher */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Pilih File Video Pribadi (.mp4)"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pilih Video Sendiri</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Fast forward / Selesai Menonton */}
            {!isVideoFinished && (
              <button
                onClick={handleSkipOrFinishVideo}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-fun font-bold transition-transform hover:scale-102 cursor-pointer flex items-center gap-1.5 text-xs shadow-md"
              >
                <span>Selesai Menonton</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Progress scrubber bar */}
          <div className="w-full max-w-2xl mt-2 bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all duration-300"
              style={{ width: `${videoProgress}%` }}
            />
          </div>
        </div>

        {/* ========================================================
            REFLEKSI & PEMECAHAN MASALAH SETELAH MENONTON
            Teks:
            “Kiki ingin bermain bersama teman-temannya. Namun, ia melihat rumahnya masih berantakan dan bingung harus melakukan apa terlebih dahulu.”
            Pertanyaan:
            “Menurutmu, apa yang sebaiknya Kiki lakukan terlebih dahulu?”
            Tombol:
            “Ayo Bantu Kiki!”
            ======================================================== */}
        <div className="p-5 sm:p-8 flex flex-col justify-between space-y-6">
          
          {/* Main Story Narrative Dilemma Text */}
          <div className="bg-amber-50/90 border-2 border-amber-300/90 rounded-2xl p-4 sm:p-5 shadow-inner">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-200 text-amber-950 flex items-center justify-center font-bold text-2xl shrink-0 shadow-xs">
                👦
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span>Dilema Kiki di Rumah:</span>
                </div>
                <p className="font-fun text-base sm:text-lg font-bold text-amber-950 leading-relaxed">
                  “Kiki ingin bermain bersama teman-temannya. Namun, ia melihat rumahnya masih berantakan dan bingung harus melakukan apa terlebih dahulu.”
                </p>
              </div>
            </div>
          </div>

          {/* Guiding Question */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
              <h3 className="font-fun text-base sm:text-xl font-extrabold text-slate-900">
                Menurutmu, apa yang sebaiknya Kiki lakukan terlebih dahulu?
              </h3>
            </div>

            {/* Opinion Choices for Students */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {opinionChoices.map((choice) => {
                const isSelected = selectedOpinion === choice.id;
                return (
                  <button
                    key={choice.id}
                    onClick={() => handleSelectOpinion(choice.id)}
                    className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left font-fun transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-amber-100 border-amber-500 text-amber-950 shadow-md ring-2 ring-amber-400 scale-[1.01]'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-amber-300'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{choice.icon}</span>
                    <span className="text-xs sm:text-sm font-bold leading-snug">
                      {choice.label}
                    </span>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-amber-600 ml-auto shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom opinion text input if user selected 'lainnya' */}
            {selectedOpinion === 'lainnya' && (
              <div className="pt-2 animate-in fade-in duration-200">
                <input
                  type="text"
                  value={customOpinion}
                  onChange={(e) => setCustomOpinion(e.target.value)}
                  placeholder="Ketik pendapatmu di sini (misal: Merapikan tempat tidur lalu izin orang tua)..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-amber-300 focus:border-amber-500 focus:outline-hidden font-fun text-sm text-slate-800"
                />
              </div>
            )}
          </div>

          {/* ========================================================
              TOMBOL UTAMA: “Ayo Bantu Kiki!”
              Membawa peserta didik masuk ke rumah 3D
              ======================================================== */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
              {isOpinionSubmitted ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Pendapatmu telah tersimpan! Ayo jelajahi rumah Kiki untuk mencari tahu Hak dan Kewajibannya.
                </span>
              ) : (
                <span>Sampaikan pendapatmu terlebih dahulu sebelum memulai petualangan.</span>
              )}
            </div>

            <button
              onClick={handleStartApp}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-fun font-extrabold text-base sm:text-lg text-white shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 shadow-orange-300/80 animate-pulse-soft"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Ayo Bantu Kiki!</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
