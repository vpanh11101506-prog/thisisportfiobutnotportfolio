import React, { useEffect, useState } from 'react';
import { audioSynth } from '../utils/audioSynth';
import { spawnPixelBurst } from '../utils/fx';

interface TopNavProps {
  onOpenContact: (e?: React.MouseEvent) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenContact }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return audioSynth.subscribe((playing) => {
      setIsPlaying(playing);
    });
  }, []);

  const handleToggleSound = (e: React.MouseEvent) => {
    audioSynth.toggle();
    spawnPixelBurst(e.clientX, e.clientY, 8);
  };

  return (
    <header className="bg-[#1f1730]/95 backdrop-blur-md border-b-[3px] border-[#5a3696] shadow-[0px_4px_0px_#0a0514] sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 py-3 max-w-[1200px] mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#hero" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-[#f6c833] border-[3px] border-black flex items-center justify-center shadow-[2px_2px_0px_#0a0514] group-hover:rotate-6 transition-transform">
            <span className="material-symbols-outlined text-[#120a21] font-bold text-xl">
              videogame_asset
            </span>
          </div>
          <span className="text-lg font-['Space_Grotesk'] font-extrabold text-[#f6c833] arcade-glow-gold tracking-wider">
            🎮 MY WORLD
          </span>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#hero"
            className="border-b-[3px] border-[#f6c833] text-[#f6c833] font-['Space_Mono'] text-xs pb-1 uppercase font-bold"
          >
            TRANG CHỦ
          </a>
          <a
            href="#skills"
            className="text-[#d1c5ad] font-['Space_Mono'] text-xs hover:text-[#f6c833] pb-1 uppercase font-bold transition-colors"
          >
            KỸ NĂNG
          </a>
          <a
            href="#questbook"
            className="text-[#d1c5ad] font-['Space_Mono'] text-xs hover:text-[#f6c833] pb-1 uppercase font-bold transition-colors"
          >
            QUESTBOOK
          </a>
          <a
            href="#hobbies"
            className="text-[#d1c5ad] font-['Space_Mono'] text-xs hover:text-[#f6c833] pb-1 uppercase font-bold transition-colors"
          >
            SỞ THÍCH
          </a>
          <button
            type="button"
            className="text-[#45b7d1] font-['Space_Mono'] text-xs hover:text-[#f6c833] pb-1 uppercase font-bold flex items-center gap-1 cursor-pointer transition-colors"
            onClick={onOpenContact}
          >
            🕊️ BỒ CÂU
          </button>
        </nav>

        {/* Trailing Action Clusters */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleSound}
            className="h-9 px-3 bg-[#2e263f] border-[2px] border-[#5a3696] flex items-center gap-1.5 shadow-[2px_2px_0px_#0a0514] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
            title="Bật/Tắt nhạc nền 8-bit chiptune"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${
                isPlaying ? 'text-[#f6c833] animate-pulse' : 'text-[#f6c833]'
              }`}
            >
              {isPlaying ? 'volume_up' : 'music_note'}
            </span>
            <span
              className={`font-['Space_Mono'] text-[10px] uppercase font-bold tracking-wider ${
                isPlaying ? 'text-[#f6c833]' : 'text-[#eaddff]'
              }`}
            >
              ♬ 8-BIT BGM: {isPlaying ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenContact}
            className="hidden sm:inline-flex items-center gap-2 bg-[#26c281] text-[#120a21] font-['Space_Mono'] text-xs px-3.5 py-2 pixel-btn-action font-bold uppercase tracking-wider"
          >
            <span>GỬI BỒ CÂU</span>
            <span className="material-symbols-outlined text-[16px]">forward_to_inbox</span>
          </button>
        </div>
      </div>
    </header>
  );
};
