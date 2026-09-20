import React, { useEffect, useState } from 'react';
import { audioSynth } from '../utils/audioSynth';
import { spawnPixelBurst } from '../utils/fx';
import { useAuth } from '../context/AuthContext';

interface TopNavProps {
  onOpenContact: (e?: React.MouseEvent) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenContact }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { isAdmin, openLoginModal, openPasswordModal, logout } = useAuth();
  const [showAdminMenu, setShowAdminMenu] = useState(false);

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
      <div className="w-full px-4 sm:px-6 py-2.5 max-w-[1200px] mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#hero" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-[#120a21] border-[2px] border-[#f6c833] shadow-[2px_2px_0px_#0a0514] flex items-center justify-center p-1 group-hover:rotate-6 transition-transform overflow-hidden">
            <img
              src="/favicon.svg"
              alt="Logo MY WORLD"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-lg font-['Space_Grotesk'] font-extrabold text-[#f6c833] arcade-glow-gold tracking-wider">
            MY WORLD
          </span>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-5">
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
        <div className="flex items-center gap-2.5">
          {/* Admin / Viewer Role Status Button */}
          {isAdmin ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="h-8 md:h-9 px-2.5 md:px-3 bg-[#f6c833] hover:bg-[#e0b020] text-[#120a21] border-[2px] border-black flex items-center gap-1.5 shadow-[2px_2px_0px_#0a0514] font-['Space_Mono'] text-[11px] font-bold cursor-pointer"
                title="Quyền Admin (Đang kích hoạt)"
              >
                <span>👑 ADMIN</span>
                <span className="material-symbols-outlined text-xs">arrow_drop_down</span>
              </button>

              {showAdminMenu && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-48 bg-[#1f1730] border-2 border-[#f6c833] pixel-box-sm shadow-[4px_4px_0px_#0a0514] font-['Space_Mono'] z-50 text-xs py-1"
                  onClick={() => setShowAdminMenu(false)}
                >
                  <div className="px-3 py-1.5 border-b border-[#5a3696] text-[10px] text-[#f6c833] font-bold">
                    CHỦ TRANG WEB
                  </div>
                  <button
                    type="button"
                    onClick={openPasswordModal}
                    className="w-full text-left px-3 py-2 hover:bg-[#2e263f] text-[#45b7d1] flex items-center gap-1.5 font-bold cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">lock_reset</span>
                    <span>Đổi mật khẩu</span>
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full text-left px-3 py-2 hover:bg-[#2e263f] text-[#ef4444] flex items-center gap-1.5 font-bold cursor-pointer border-t border-[#5a3696]"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    <span>Về Viewer (Đăng xuất)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={openLoginModal}
              className="h-8 md:h-9 px-2.5 md:px-3 bg-[#120a21] hover:bg-[#2e263f] text-[#eaddff] hover:text-[#f6c833] border-[2px] border-[#5a3696] flex items-center gap-1.5 shadow-[2px_2px_0px_#0a0514] font-['Space_Mono'] text-[11px] font-bold cursor-pointer transition-all"
              title="Khách xem (Bấm để đăng nhập Admin)"
            >
              <span className="material-symbols-outlined text-[#45b7d1] text-sm">visibility</span>
              <span className="hidden sm:inline">VIEWER:</span>
              <span className="text-[#f6c833] underline">ĐĂNG NHẬP</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            className="h-8 md:h-9 px-2.5 md:px-3 bg-[#2e263f] border-[2px] border-[#5a3696] flex items-center gap-1.5 shadow-[2px_2px_0px_#0a0514] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
            title="Bật/Tắt nhạc nền 8-bit chiptune"
          >
            <span
              className={`material-symbols-outlined text-[16px] md:text-[18px] ${
                isPlaying ? 'text-[#f6c833] animate-pulse' : 'text-[#f6c833]'
              }`}
            >
              {isPlaying ? 'volume_up' : 'music_note'}
            </span>
            <span
              className={`font-['Space_Mono'] text-[10px] uppercase font-bold tracking-wider hidden lg:inline ${
                isPlaying ? 'text-[#f6c833]' : 'text-[#eaddff]'
              }`}
            >
              8-BIT: {isPlaying ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Pigeon Contact */}
          <button
            type="button"
            onClick={onOpenContact}
            className="hidden sm:inline-flex items-center gap-1.5 bg-[#26c281] text-[#120a21] font-['Space_Mono'] text-xs px-3 py-2 pixel-btn-action font-bold uppercase tracking-wider"
          >
            <span>BỒ CÂU</span>
            <span className="material-symbols-outlined text-[16px]">forward_to_inbox</span>
          </button>
        </div>
      </div>
    </header>
  );
};

