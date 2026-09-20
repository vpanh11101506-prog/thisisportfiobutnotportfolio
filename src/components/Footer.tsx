import React from 'react';

interface FooterProps {
  onOpenContact: (e?: React.MouseEvent) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenContact }) => {
  return (
    <footer className="bg-[#120a21]/95 backdrop-blur-md border-t-[3px] border-[#5a3696] mt-16 relative z-10">
      <div className="w-full py-8 px-4 sm:px-6 max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <span className="text-lg font-bold text-[#f6c833] font-['Space_Grotesk']">MY WORLD</span>
          <span className="hidden sm:inline text-[#5a3696]">|</span>
          <span className="text-xs font-['Space_Mono'] text-[#d1c5ad]">
            © 2024 MY WORLD • Built with 16-bit Love &amp; Adventure Spirit
          </span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
          <a
            href="#hero"
            className="text-[#d1c5ad] font-['Space_Mono'] text-xs hover:text-[#f6c833] uppercase font-bold transition-colors"
          >
            Bản đồ thế giới
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d1c5ad] font-['Space_Mono'] text-xs hover:text-[#f6c833] uppercase font-bold transition-colors"
          >
            Mã nguồn
          </a>
          <button
            type="button"
            onClick={onOpenContact}
            className="text-[#45b7d1] font-['Space_Mono'] text-xs hover:text-[#f6c833] uppercase font-bold cursor-pointer transition-colors"
          >
            🕊️ Bồ Câu Liên Hệ
          </button>
          <a
            href="#guestbook"
            className="text-[#d1c5ad] font-['Space_Mono'] text-xs hover:text-[#f6c833] uppercase font-bold transition-colors"
          >
            Báo cáo Bug
          </a>
        </nav>
      </div>
    </footer>
  );
};
