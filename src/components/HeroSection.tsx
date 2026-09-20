import React, { useState, useRef, useEffect } from 'react';
import { AVATAR_URL } from '../data/portfolioData';
import { spawnPixelBurst } from '../utils/fx';
import { ChibiViewer } from './ChibiViewer';
import { fetchPortfolioState, saveServerAvatar, resetServerAvatar } from '../utils/portfolioApi';
import { useAuth } from '../context/AuthContext';

interface HeroSectionProps {
  onOpenContact: (e?: React.MouseEvent) => void;
  onSendLove: (e?: React.MouseEvent) => void;
}

const AVATAR_STORAGE_KEY = 'pa_custom_avatar_v1';

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenContact, onSendLove }) => {
  const { isAdmin, openLoginModal } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarSrc, setAvatarSrc] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(AVATAR_STORAGE_KEY);
      if (saved && saved.trim()) return saved;
    } catch {
      // ignore storage error
    }
    return AVATAR_URL;
  });
  const [avatarNotice, setAvatarNotice] = useState<string | null>(null);
  const [isSavingServer, setIsSavingServer] = useState(false);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Tải ảnh mới nhất từ máy chủ để bất kỳ ai mở link cũng thấy ảnh mới của bạn
  useEffect(() => {
    fetchPortfolioState().then((state) => {
      if (state.avatarUrl) {
        setAvatarSrc(state.avatarUrl);
        try {
          localStorage.setItem(AVATAR_STORAGE_KEY, state.avatarUrl);
        } catch {
          // ignore
        }
      }
    });
  }, []);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh (.jpg, .png, .webp, ...)!');
      return;
    }

    setIsSavingServer(true);
    setAvatarNotice('Đang lưu ảnh lên máy chủ để ai mở link cũng thấy ảnh mới... ⏳');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setAvatarSrc(base64);
        try {
          localStorage.setItem(AVATAR_STORAGE_KEY, base64);
        } catch {
          // ignore quota
        }

        const res = await saveServerAvatar(base64);
        setIsSavingServer(false);
        if (res.success && res.avatarUrl) {
          setAvatarSrc(res.avatarUrl);
          try {
            localStorage.setItem(AVATAR_STORAGE_KEY, res.avatarUrl);
          } catch {
            // ignore
          }
          setAvatarNotice('✨ ĐÃ CẬP NHẬT ẢNH THÀNH CÔNG! Bất kỳ ai mở link này đều sẽ thấy ảnh mới của bạn!');
        } else {
          setAvatarNotice('✨ Đã cập nhật ảnh thành công!');
        }
        setTimeout(() => setAvatarNotice(null), 5000);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveUrlAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = customUrlInput.trim();
    if (!cleanUrl) return;

    setIsSavingServer(true);
    setAvatarNotice('Đang lưu link ảnh lên máy chủ... ⏳');
    setAvatarSrc(cleanUrl);
    setShowUrlDialog(false);
    setCustomUrlInput('');

    try {
      localStorage.setItem(AVATAR_STORAGE_KEY, cleanUrl);
    } catch {
      // ignore
    }

    const res = await saveServerAvatar(cleanUrl);
    setIsSavingServer(false);
    if (res.success) {
      setAvatarNotice('✨ ĐÃ LƯU ẢNH LÊN MÁY CHỦ! Người khác bấm link sẽ thấy ngay ảnh mới này!');
    } else {
      setAvatarNotice('✨ Đã cập nhật ảnh đại diện mới!');
    }
    setTimeout(() => setAvatarNotice(null), 5000);
  };

  const handleResetAvatar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSavingServer(true);
    setAvatarSrc(AVATAR_URL);
    try {
      localStorage.removeItem(AVATAR_STORAGE_KEY);
    } catch {
      // ignore
    }
    await resetServerAvatar();
    setIsSavingServer(false);
    setAvatarNotice('Đã khôi phục ảnh đại diện ban đầu!');
    setTimeout(() => setAvatarNotice(null), 3000);
  };

  const handleStageClick = (e: React.MouseEvent) => {
    spawnPixelBurst(e.clientX, e.clientY, 8);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    spawnPixelBurst(e.clientX, e.clientY, 10);
  };

  return (
    <section className="relative" id="hero">
      {/* Hidden Avatar File Input */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileChange}
      />

      {/* Stage Badge */}
      <div
        className="mb-4 inline-flex items-center gap-2 bg-[#1f1730]/90 border-[3px] border-[#5a3696] px-4 py-2 pixel-box-sm cursor-pointer"
        onClick={handleStageClick}
      >
        <span className="w-3 h-3 bg-[#26c281] border border-black inline-block animate-ping" />
        <span className="font-['Space_Mono'] text-xs text-[#26c281] uppercase tracking-wider font-bold">
          STAGE 1: CANDY REALM • LIVE GAMEPLAY 🌍
        </span>
      </div>

      {avatarNotice && (
        <div className="mb-4 bg-[#26c281] text-[#120a21] border-2 border-black px-4 py-2 text-xs font-['Space_Mono'] font-bold flex items-center justify-between shadow-[3px_3px_0px_#0a0514] animate-bounce">
          <span>✨ {avatarNotice}</span>
          <button type="button" onClick={() => setAvatarNotice(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {/* Main Profile Box */}
      <div className="bg-[#1f1730]/95 backdrop-blur-sm border-[4px] border-[#6c3fb5] pixel-box-lg p-6 md:p-8 relative overflow-hidden shadow-[6px_6px_0px_#0a0514]">
        {/* Header Ribbon */}
        <div className="flex flex-wrap items-center justify-between border-b-[3px] border-[#5a3696] pb-4 mb-6 gap-4 bg-[#231b34] -mx-6 -mt-6 md:-mx-8 md:-mt-8 p-4 md:px-8">
          <div className="flex items-center gap-3">
            <span className="font-['Space_Mono'] text-xs bg-[#120a21] text-[#f6c833] border border-[#5a3696] px-2.5 py-1 select-none font-bold">
              CHAR_STATUS.EXE
            </span>
            <span className="font-['Space_Mono'] text-xs text-[#f3eeff]">
              Class: Creative Code Paladin // Alignment: Chaotic Creative
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-[#ef4444] border-2 border-black inline-block" />
            <span className="w-4 h-4 bg-[#f6c833] border-2 border-black inline-block" />
            <span className="w-4 h-4 bg-[#45b7d1] border-2 border-black inline-block" />
          </div>
        </div>

        {/* Main Grid: Avatar & Chibi vs Stats & Bio */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Avatar Column */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <div className="absolute -top-4 -right-3 z-10 bg-[#f6c833] border-[3px] border-black px-3 py-1 font-['Space_Mono'] text-xs text-[#120a21] font-bold shadow-[3px_3px_0px_#0a0514]">
                LV. 19 ★
              </div>
              <div className="w-56 h-56 md:w-64 md:h-64 bg-[#2e263f] border-[4px] border-[#f6c833] shadow-[6px_6px_0px_#0a0514] p-3 relative overflow-hidden flex items-center justify-center">
                <img
                  key={avatarSrc}
                  src={avatarSrc}
                  alt="Phương Anh Avatar"
                  className="w-full h-full object-cover border-[3px] border-[#5a3696] bg-[#120a21] select-none group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Hover Overlay Button to change avatar - Admin only */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      avatarInputRef.current?.click();
                    }}
                    className="absolute inset-x-3 bottom-8 bg-[#120a21]/90 hover:bg-[#f6c833] text-[#f6c833] hover:text-[#120a21] border border-[#f6c833] py-1 font-['Space_Mono'] text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                    <span>ĐỔI ẢNH ĐẠI DIỆN NÀY</span>
                  </button>
                )}

                <div className="absolute bottom-2 left-2 right-2 bg-[#120a21]/95 text-[#f6c833] text-center py-0.5 font-['Space_Mono'] text-[10px] select-none border border-[#5a3696] font-bold">
                  STATUS: ĐANG ONLINE &amp; KHÁM PHÁ THẾ GIỚI SỐ
                </div>
              </div>
            </div>

            {/* Avatar controls: Only shown for ADMIN */}
            {isAdmin ? (
              <>
                <div className="mt-2 flex flex-wrap justify-center items-center gap-2">
                  <button
                    type="button"
                    disabled={isSavingServer}
                    onClick={() => avatarInputRef.current?.click()}
                    className="bg-[#45b7d1] hover:bg-[#38a0b8] text-[#120a21] text-[11px] font-['Space_Mono'] font-bold px-3 py-1.5 border border-black shadow-[2px_2px_0px_#0a0514] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-xs">upload</span>
                    <span>{isSavingServer ? 'ĐANG LƯU SERVER...' : 'TẢI ẢNH MỚI LÊN LINK'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSavingServer}
                    onClick={() => setShowUrlDialog(true)}
                    className="bg-[#f6c833] hover:bg-[#e0b020] text-[#120a21] text-[11px] font-['Space_Mono'] font-bold px-2.5 py-1.5 border border-black shadow-[2px_2px_0px_#0a0514] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-xs">link</span>
                    <span>DÁN LINK ẢNH</span>
                  </button>
                  {avatarSrc !== AVATAR_URL && (
                    <button
                      type="button"
                      disabled={isSavingServer}
                      onClick={handleResetAvatar}
                      title="Khôi phục ảnh gốc ban đầu"
                      className="bg-[#2e263f] hover:bg-[#ef4444] hover:text-white text-[#d1c5ad] text-[11px] font-['Space_Mono'] font-bold px-2 py-1.5 border border-black shadow-[2px_2px_0px_#0a0514] cursor-pointer disabled:opacity-50"
                    >
                      ↺ GỐC
                    </button>
                  )}
                </div>

                {/* Server Sync Indicator for Admin */}
                <div className="mt-2 text-[10px] font-['Space_Mono'] text-[#26c281] bg-[#120a21]/90 border border-[#26c281]/40 px-2.5 py-1 flex items-center gap-1.5 shadow-[1px_1px_0px_#000]">
                  <span className="w-2 h-2 rounded-full bg-[#26c281] inline-block animate-pulse shrink-0" />
                  <span>👑 Admin: Ảnh tải lên sẽ lưu vĩnh viễn trên máy chủ cho mọi người xem</span>
                </div>
              </>
            ) : (
              /* Viewer Mode: Read-only, prevents strangers from modifying */
              <div className="mt-2 flex flex-col items-center gap-1">
                <div className="text-[10px] font-['Space_Mono'] text-[#d1c5ad] bg-[#120a21]/80 border border-[#5a3696] px-2.5 py-1 flex items-center gap-1.5 shadow-[1px_1px_0px_#000]">
                  <span className="material-symbols-outlined text-[#45b7d1] text-xs">lock</span>
                  <span>Chế độ Người xem (Viewer) — Nội dung được bảo vệ</span>
                </div>
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="text-[10px] font-['Space_Mono'] text-[#f6c833] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Bạn là Phương Anh? Bấm vào đây để đăng nhập Admin</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
              </div>
            )}

            {/* URL Dialog Modal */}
            {showUrlDialog && (
              <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
                onClick={() => setShowUrlDialog(false)}
              >
                <div
                  className="bg-[#1f1730] border-[3px] border-[#f6c833] pixel-box-sm p-5 w-full max-w-md shadow-[6px_6px_0px_#0a0514]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b-2 border-[#5a3696] pb-2 mb-3">
                    <h3 className="text-sm font-bold text-[#f6c833] font-['Space_Grotesk'] flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">link</span>
                      <span>DÁN ĐƯỜNG DẪN ẢNH (URL)</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowUrlDialog(false)}
                      className="text-[#eaddff] hover:text-[#ef4444] font-bold text-sm"
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleSaveUrlAvatar} className="space-y-3 font-['Space_Mono']">
                    <p className="text-xs text-[#eaddff]">
                      Nhập link ảnh (từ Google Drive, Pinterest, Facebook, Imgur, v.v.). Link này sẽ được lưu lên server và hiển thị cho bất kỳ ai mở trang web của bạn:
                    </p>
                    <input
                      type="url"
                      required
                      placeholder="https://example.com/my-photo.jpg"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      className="w-full bg-[#120a21] border-2 border-[#5a3696] focus:border-[#f6c833] text-xs text-[#f3eeff] px-3 py-2 outline-none"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowUrlDialog(false)}
                        className="px-3 py-1 bg-[#2e263f] text-xs text-[#d1c5ad] border border-black"
                      >
                        HỦY
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1 bg-[#f6c833] hover:bg-[#d4a414] text-xs text-[#120a21] font-bold border border-black shadow-[2px_2px_0px_#000]"
                      >
                        LƯU LÊN SERVER
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Achievement Badges Strip */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="bg-[#2e263f] border-[2px] border-[#5a3696] px-2.5 py-1 font-['Space_Mono'] text-[11px] flex items-center gap-1 shadow-[2px_2px_0px_#0a0514] text-[#f3eeff] font-bold">
                🤓 Nerd
              </span>
              <span className="bg-[#2e263f] border-[2px] border-[#5a3696] px-2.5 py-1 font-['Space_Mono'] text-[11px] flex items-center gap-1 shadow-[2px_2px_0px_#0a0514] text-[#f3eeff] font-bold">
                🎧 Night Owl
              </span>
            </div>

            {/* Chibi Controller */}
            <ChibiViewer />
          </div>

          {/* Stats & Bio Column */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-[#f6c833] font-['Space_Mono'] text-xs font-bold">
                <span className="material-symbols-outlined text-[18px]">token</span>
                PLAYER_NAME: PHƯƠNG ANH
              </div>
              <h1 className="text-2xl md:text-3xl font-['Space_Grotesk'] text-[#f6c833] arcade-title-shadow mt-1 font-extrabold">
                Chào Mừng Đến Với MY WORLD Của Phương Anh!
              </h1>
              <p className="font-['Space_Mono'] text-sm text-[#f3eeff] mt-2 leading-relaxed">
                My name is Võ Phương Anh, a second-year student passionate about web design and
                frontend development in Ho Chi Minh City. To me, web development is a creative
                journey where I transform ideas into aesthetic, user-friendly digital experiences.
                Even as a beginner, I am constantly learning, exploring, and refining my skills
                every day. Welcome to my creative space-where code meets passion, and every project
                is a steps towards growing without bounds!
              </p>
            </div>

            {/* RPG Stat Bars */}
            <div className="space-y-3 bg-[#231b34] border-[3px] border-[#5a3696] p-4 pixel-box-sm">
              <div>
                <div className="flex justify-between items-center mb-1 font-['Space_Mono'] text-xs text-[#f3eeff] font-bold">
                  <span className="flex items-center gap-1.5 text-[#26c281]">
                    <span className="material-symbols-outlined text-[16px]">favorite</span>
                    HP (Năng Lượng Sáng Tạo)
                  </span>
                  <span className="text-[#26c281]">50 / 100</span>
                </div>
                <div className="h-4 w-full bg-[#120a21] border-[2px] border-[#5a3696] p-0.5">
                  <div
                    className="h-full bg-[#26c281] shadow-[0_0_8px_rgba(38,194,129,0.6)] transition-all duration-500"
                    style={{ width: '50%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 font-['Space_Mono'] text-xs text-[#f3eeff] font-bold">
                  <span className="flex items-center gap-1.5 text-[#d93876]">
                    <span className="material-symbols-outlined text-[16px]">coffee</span>
                    MP (Caffeine &amp; Tập Trung)
                  </span>
                  <span className="text-[#d93876]">33 / 100</span>
                </div>
                <div className="h-4 w-full bg-[#120a21] border-[2px] border-[#5a3696] p-0.5">
                  <div
                    className="h-full bg-[#d93876] shadow-[0_0_8px_rgba(217,56,118,0.6)] transition-all duration-500"
                    style={{ width: '33%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 font-['Space_Mono'] text-xs text-[#f3eeff] font-bold">
                  <span className="flex items-center gap-1.5 text-[#f6c833]">
                    <span className="material-symbols-outlined text-[16px]">military_tech</span>
                    EXP (Kinh Nghiệm Thực Chiến)
                  </span>
                  <span className="text-[#f6c833]">2,500 / 10,000 XP</span>
                </div>
                <div className="h-4 w-full bg-[#120a21] border-[2px] border-[#5a3696] p-0.5">
                  <div
                    className="h-full bg-[#f6c833] shadow-[0_0_8px_rgba(246,200,51,0.6)] transition-all duration-500"
                    style={{ width: '25%' }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons: Love + Gửi Bồ Câu */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                type="button"
                onClick={onSendLove}
                className="bg-[#d93876] hover:bg-[#ef4444] text-white font-['Space_Mono'] text-sm px-6 py-3 pixel-btn-action flex items-center gap-2 font-bold tracking-wider uppercase"
              >
                <span className="material-symbols-outlined text-[20px]">favorite</span>
                <span>💖 THẢ TIM (+1 LOVE)</span>
              </button>

              <button
                type="button"
                id="heroContactBtn"
                onClick={onOpenContact}
                className="bg-[#2e263f] hover:bg-[#39304a] text-[#f6c833] border-[3px] border-[#f6c833] px-6 py-3 pixel-btn-action flex items-center gap-2 font-bold tracking-wider uppercase cursor-pointer shadow-[0_0_12px_rgba(246,200,51,0.3)] hover:scale-105 transition-all"
              >
                <span className="material-symbols-outlined text-[#45b7d1] text-[22px]">
                  forward_to_inbox
                </span>
                <span>🕊️ GỬI BỒ CÂU LIÊN HỆ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
