import React, { useState, useRef, useEffect } from 'react';
import { POLAROID_ITEMS } from '../data/portfolioData';
import { PolaroidItem } from '../types';
import { spawnPixelBurst } from '../utils/fx';

interface PolaroidPinboardProps {
  onOpenContact: (e?: React.MouseEvent) => void;
}

const LOCAL_STORAGE_KEY = 'pa_custom_polaroids_v1';

// Pre-upload pending item structure
interface PendingUploadItem {
  id: string;
  image: string;
  title: string;
  tags: string;
  badge: string;
}

export const PolaroidPinboard: React.FC<PolaroidPinboardProps> = ({ onOpenContact }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PolaroidItem | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<PolaroidItem | null>(null);
  const [pendingUpload, setPendingUpload] = useState<PendingUploadItem | null>(null);

  const [polaroidList, setPolaroidList] = useState<PolaroidItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore JSON error
    }
    return POLAROID_ITEMS;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  // Save changes to localStorage
  const updateList = (newList: PolaroidItem[]) => {
    setPolaroidList(newList);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newList));
    } catch {
      // ignore storage quota error
    }
  };

  const handleResetToDefault = () => {
    setPolaroidList(POLAROID_ITEMS);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setUploadNotice('Đã khôi phục danh sách ảnh mặc định!');
    setTimeout(() => setUploadNotice(null), 3000);
  };

  // Helper to process uploaded file (convert to base64 data URL and open edit preview modal)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chỉ chọn tệp hình ảnh (.jpg, .png, .webp, v.v.)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (!base64Url) return;

      const cleanFileName = file.name.replace(/\.[^/.]+$/, '');
      setPendingUpload({
        id: `custom-polaroid-${Date.now()}`,
        image: base64Url,
        title: cleanFileName || 'Kỷ niệm mới',
        tags: '#myphoto #memory #original',
        badge: '★ ORIGINAL',
      });
    };
    reader.readAsDataURL(file);
  };

  // Confirm posting the pending upload with custom title
  const handleConfirmPendingUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUpload) return;

    const parsedTags = pendingUpload.tags
      .split(' ')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const newPolaroid: PolaroidItem = {
      id: pendingUpload.id,
      title: pendingUpload.title.trim() || 'Khoảnh khắc kỷ niệm 📷',
      image: pendingUpload.image,
      tags: parsedTags.length > 0 ? parsedTags : ['#myphoto', '#memory'],
      badge: pendingUpload.badge.trim() || '★ ORIGINAL',
      pinColor: 'bg-[#f6c833]',
      rotation: Math.random() > 0.5 ? 'rotate-1' : '-rotate-1',
      badgeColor: 'text-[#f6c833]',
    };

    const updated = [newPolaroid, ...polaroidList];
    updateList(updated);
    setUploadNotice(`Đã ghim ảnh "${newPolaroid.title}" lên bảng thành công! ✨`);
    setPendingUpload(null);
    setTimeout(() => setUploadNotice(null), 4000);
  };

  // Save changes when editing an existing photo title
  const handleSaveEditPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;

    const updated = polaroidList.map((item) =>
      item.id === editingPhoto.id ? editingPhoto : item
    );
    updateList(updated);
    if (selectedPhoto && selectedPhoto.id === editingPhoto.id) {
      setSelectedPhoto(editingPhoto);
    }
    setUploadNotice(`Đã cập nhật thông tin ảnh "${editingPhoto.title}"!`);
    setEditingPhoto(null);
    setTimeout(() => setUploadNotice(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => processImageFile(file));
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  // Support paste image (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [polaroidList]);

  const handleRemovePhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = polaroidList.filter((p) => p.id !== id);
    updateList(updated);
    setUploadNotice('Đã gỡ ảnh khỏi bảng ghim.');
    setTimeout(() => setUploadNotice(null), 3000);
  };

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => processImageFile(file));
    }
  };

  return (
    <section className="space-y-6" id="guestbook">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-[#5a3696] pb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#f6c833] text-2xl">photo_library</span>
          <h2 className="text-xl md:text-2xl font-['Space_Grotesk'] text-[#f6c833] arcade-glow-gold uppercase font-bold">
            📌 BẢNG GHIM KỶ NIỆM &amp; POLAROID (PHOTO PINBOARD)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="font-['Space_Mono'] text-xs bg-[#26c281] hover:bg-[#20a36c] text-[#120a21] font-bold border-[2px] border-black px-3 py-1.5 shadow-[2px_2px_0px_#0a0514] cursor-pointer pixel-btn-action flex items-center gap-1.5"
            title="Tải lên tệp ảnh gốc của bạn hoặc kéo thả / dán Ctrl+V"
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            <span>TẢI ẢNH CỦA BẠN VÔ</span>
          </button>
          <button
            type="button"
            onClick={handleResetToDefault}
            className="font-['Space_Mono'] text-xs bg-[#2e263f] hover:bg-[#3d3254] text-[#eaddff] font-bold border-[2px] border-black px-2.5 py-1.5 shadow-[2px_2px_0px_#0a0514] cursor-pointer pixel-btn-action flex items-center gap-1"
            title="Khôi phục lại bộ ảnh"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Notification Toast when uploaded */}
      {uploadNotice && (
        <div className="bg-[#26c281]/20 border-2 border-[#26c281] text-[#26c281] px-4 py-2 font-['Space_Mono'] text-xs font-bold flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{uploadNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Polaroid Board (7 cols) */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`lg:col-span-7 bg-[#1f1730]/95 border-[4px] ${
            isDraggingOver ? 'border-[#26c281] ring-4 ring-[#26c281]/40' : 'border-[#5a3696]'
          } pixel-box-md p-5 relative overflow-hidden shadow-[6px_6px_0px_#0a0514] transition-all`}
        >
          <div className="flex items-center justify-between bg-[#120a21] border-b-2 border-[#5a3696] text-[#f6c833] px-3 py-2 -mx-5 -mt-5 mb-5">
            <span className="font-['Space_Mono'] text-xs font-bold uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#45b7d1]">push_pin</span>
              POLAROID_BOARD.EXE // Ghim ảnh kỷ niệm &amp; khoảnh khắc đáng nhớ
            </span>
            <div className="flex gap-1.5">
              <span className="w-3 h-3 bg-[#ef4444] inline-block border border-black" />
              <span className="w-3 h-3 bg-[#f6c833] inline-block border border-black" />
              <span className="w-3 h-3 bg-[#45b7d1] inline-block border border-black" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {polaroidList.map((item) => (
              <div
                key={item.id}
                onClick={(e) => {
                  setSelectedPhoto(item);
                  spawnPixelBurst(e.clientX, e.clientY, 10);
                }}
                className={`bg-[#f3eeff] text-[#120a21] p-3 border-[3px] border-black shadow-[4px_4px_0px_#0a0514] relative transition-transform hover:scale-105 hover:rotate-0 duration-150 transform ${item.rotation} cursor-pointer group`}
              >
                {/* Physical Pin */}
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full ${item.pinColor} border-2 border-black shadow-[1px_1px_0px_#0a0514] z-10`}
                />

                {/* Action buttons (available on cards) */}
                <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPhoto(item);
                    }}
                    title="Chỉnh sửa tiêu đề & thông tin"
                    className="w-6 h-6 bg-[#f6c833] hover:bg-[#d4a414] text-[#120a21] text-xs font-bold rounded-none border border-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 cursor-pointer"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleRemovePhoto(item.id, e)}
                    title="Gỡ ảnh này"
                    className="w-6 h-6 bg-[#ef4444] hover:bg-red-600 text-white text-xs font-bold rounded-none border border-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div
                  className={`w-full h-48 overflow-hidden border border-black/20 ${
                    item.isCustomBg ? 'bg-[#22163b] flex items-center justify-center p-2' : 'bg-[#120a21]'
                  }`}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className={`w-full h-48 ${
                      item.isCustomBg ? 'object-contain pixelated-render' : 'object-cover'
                    } group-hover:scale-105 transition-transform duration-200`}
                  />
                </div>

                <div className="pt-2.5 pb-1 font-['Space_Mono']">
                  <div className="text-xs font-bold text-[#1a0f2e] truncate flex items-center justify-between">
                    <span>{item.title}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[#5a3696] font-bold mt-1">
                    <span>{item.tags.join(' ')}</span>
                    <span className={item.badgeColor}>{item.badge}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Upload Button Card on Pinboard */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#231b34] border-[3px] border-dashed border-[#26c281] p-4 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_#0a0514] cursor-pointer hover:bg-[#2c2242] transition-colors group"
            >
              <div className="w-12 h-12 bg-[#2e263f] border-2 border-[#26c281] rounded-full flex items-center justify-center mb-2 shadow-[2px_2px_0px_#0a0514] group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[#26c281] text-2xl">
                  add_photo_alternate
                </span>
              </div>
              <div className="font-['Space_Grotesk'] text-sm text-[#26c281] font-bold mb-1">
                Ghim ảnh gốc của bạn lên +
              </div>
              <p className="font-['Space_Mono'] text-[11px] text-[#f3eeff] mb-2 leading-relaxed">
                Click chọn file ảnh máy tính hoặc nhấn <b>Ctrl+V</b> (Paste) để ghim trực tiếp ảnh gốc!
              </p>
              <div className="inline-flex items-center gap-1 text-[10px] font-['Space_Mono'] text-[#26c281] bg-[#120a21] px-2 py-1 border border-[#26c281] font-bold">
                <span>📂 Hỗ trợ JPG, PNG, WEBP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Guild Board & Direct Contacts (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#1f1730]/95 border-[3px] border-[#5a3696] p-5 pixel-box-sm">
            <h3 className="text-base font-bold text-[#f6c833] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#45b7d1]">push_pin</span>
              Bảng Thông Cáo Hiệp Hội
            </h3>
            <p className="font-['Space_Mono'] text-xs text-[#f3eeff] mt-2 leading-relaxed">
              Tôi luôn sẵn sàng tiếp nhận các dự án freelance thú vị, lời mời gia nhập bang hội sáng
              tạo hoặc các cuộc trò chuyện về web development &amp; pixel art!
            </p>

            <div className="mt-4 pt-4 border-t-2 border-[#5a3696] space-y-2 font-['Space_Mono'] text-xs text-[#eaddff]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#d93876] text-[18px]">
                  location_on
                </span>
                <span className="text-[#f3eeff]">Base Camp: TP. Hồ Chí Minh, Việt Nam</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#45b7d1] text-[18px]">
                  alternate_email
                </span>
                <span className="text-[#f3eeff]">vp.anh11101506@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f6c833] text-[18px]">
                  schedule
                </span>
                <span className="text-[#f3eeff]">Giờ thức giấc: 08:30 - 23:00 (GMT+7)</span>
              </div>
            </div>

            {/* Direct Social Link Buttons */}
            <div className="mt-4 pt-3 border-t border-[#5a3696]/60 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpenContact}
                className="bg-[#231b34] hover:bg-[#2e263f] border border-[#d93876] text-[#d93876] text-[11px] font-bold px-2.5 py-1 flex items-center gap-1 pixel-btn-action cursor-pointer"
              >
                <span>📸 Instagram</span>
              </button>
              <button
                type="button"
                onClick={onOpenContact}
                className="bg-[#231b34] hover:bg-[#2e263f] border border-[#45b7d1] text-[#45b7d1] text-[11px] font-bold px-2.5 py-1 flex items-center gap-1 pixel-btn-action cursor-pointer"
              >
                <span>🌐 Facebook</span>
              </button>
              <button
                type="button"
                onClick={onOpenContact}
                className="bg-[#231b34] hover:bg-[#2e263f] border border-[#26c281] text-[#26c281] text-[11px] font-bold px-2.5 py-1 flex items-center gap-1 pixel-btn-action cursor-pointer"
              >
                <span>✈️ Telegram</span>
              </button>
            </div>
          </div>

          {/* Stickers & Stamps */}
          <div className="bg-[#1f1730]/95 border-[3px] border-[#5a3696] p-4 pixel-box-sm">
            <span className="font-['Space_Mono'] text-[11px] text-[#f6c833] block mb-2 font-bold tracking-wider uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#f6c833] text-[16px]">stars</span>
              STICKERS &amp; STAMPS // THEMED COLLECTION:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={(e) => spawnPixelBurst(e.clientX, e.clientY, 6)}
                className="border-2 border-dashed border-[#f6c833]/80 p-1.5 bg-[#231b34] hover:bg-[#2e263f] text-[#f6c833] font-['Space_Mono'] text-[10px] font-bold cursor-pointer transition-transform hover:scale-105"
              >
                🌻 SUNFLOWER BLOOM
              </button>
              <button
                type="button"
                onClick={(e) => spawnPixelBurst(e.clientX, e.clientY, 6)}
                className="border-2 border-dashed border-[#45b7d1]/80 p-1.5 bg-[#231b34] hover:bg-[#2e263f] text-[#45b7d1] font-['Space_Mono'] text-[10px] font-bold cursor-pointer transition-transform hover:scale-105"
              >
                🎂 SUNNY BIRTHDAY
              </button>
              <button
                type="button"
                onClick={(e) => spawnPixelBurst(e.clientX, e.clientY, 6)}
                className="border-2 border-dashed border-[#d93876]/80 p-1.5 bg-[#231b34] hover:bg-[#2e263f] text-[#d93876] font-['Space_Mono'] text-[10px] font-bold cursor-pointer transition-transform hover:scale-105"
              >
                🐾 3 SLEEPY CATS
              </button>
              <button
                type="button"
                onClick={(e) => spawnPixelBurst(e.clientX, e.clientY, 6)}
                className="border-2 border-dashed border-[#26c281]/80 p-1.5 bg-[#231b34] hover:bg-[#2e263f] text-[#26c281] font-['Space_Mono'] text-[10px] font-bold cursor-pointer transition-transform hover:scale-105"
              >
                🧶 CROCHET WITH LOVE
              </button>
              <button
                type="button"
                onClick={(e) => spawnPixelBurst(e.clientX, e.clientY, 6)}
                className="border-2 border-dashed border-[#f6c833]/80 p-1.5 bg-[#231b34] hover:bg-[#2e263f] text-[#f6c833] font-['Space_Mono'] text-[10px] font-bold cursor-pointer transition-transform hover:scale-105"
              >
                💻 LAPTOP WARMER
              </button>
              <button
                type="button"
                onClick={(e) => spawnPixelBurst(e.clientX, e.clientY, 6)}
                className="border-2 border-dashed border-[#d93876]/80 p-1.5 bg-[#231b34] hover:bg-[#2e263f] text-[#d93876] font-['Space_Mono'] text-[10px] font-bold cursor-pointer transition-transform hover:scale-105"
              >
                🐱 PURR CO-PILOT
              </button>
              <button
                type="button"
                onClick={(e) => spawnPixelBurst(e.clientX, e.clientY, 6)}
                className="border-2 border-dashed border-[#45b7d1]/80 p-1.5 bg-[#231b34] hover:bg-[#2e263f] text-[#45b7d1] font-['Space_Mono'] text-[10px] font-bold cursor-pointer transition-transform hover:scale-105"
              >
                ☀️ WARM SUNSHINE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox / Zoom Modal for clicked photo */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="max-w-md w-full bg-[#f3eeff] text-[#120a21] p-4 border-[4px] border-black shadow-[10px_10px_0px_#0a0514] relative modal-enter-active"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-[#ef4444] text-white font-bold flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_#0a0514] cursor-pointer hover:bg-red-600"
            >
              ✕
            </button>
            <div className="w-full h-80 overflow-hidden border-2 border-black/20 bg-[#120a21] flex items-center justify-center">
              <img
                src={selectedPhoto.image}
                alt={selectedPhoto.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-3 font-['Space_Mono']">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#1a0f2e]">{selectedPhoto.title}</h4>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPhoto(selectedPhoto);
                      setSelectedPhoto(null);
                    }}
                    className="text-xs bg-[#f6c833] text-[#120a21] px-2 py-0.5 border border-black font-bold flex items-center gap-1 cursor-pointer hover:bg-[#d4a414]"
                  >
                    ✎ Sửa ảnh / Tiêu đề
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs mt-1">
                <span className="text-[#5a3696] font-bold">{selectedPhoto.tags.join(' ')}</span>
                <span className="font-bold text-[#d93876]">{selectedPhoto.badge}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Upload Dialog: Chỉnh sửa tiêu đề trước khi ghim ảnh */}
      {pendingUpload && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setPendingUpload(null)}
        >
          <div
            className="max-w-lg w-full bg-[#1f1730] text-[#f3eeff] border-[4px] border-[#26c281] shadow-[10px_10px_0px_#0a0514] relative modal-enter-active overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header bar */}
            <div className="bg-[#120a21] border-b-2 border-[#26c281] px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#26c281] font-['Space_Mono'] text-xs font-bold uppercase">
                <span className="material-symbols-outlined text-base">edit_note</span>
                <span>CHỈNH TIÊU ĐỀ ẢNH TRƯỚC KHI GHIM</span>
              </div>
              <button
                type="button"
                onClick={() => setPendingUpload(null)}
                className="w-7 h-7 bg-[#ef4444] text-white font-bold flex items-center justify-center border border-black cursor-pointer hover:bg-red-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPendingUpload} className="p-5 space-y-4 font-['Space_Mono']">
              {/* Preview image & form input */}
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* Image preview box styled like a mini polaroid */}
                <div className="w-36 h-44 bg-[#f3eeff] text-[#120a21] p-2 border-2 border-black shrink-0 shadow-[3px_3px_0px_#0a0514]">
                  <div className="w-full h-32 bg-[#120a21] overflow-hidden border border-black/20 flex items-center justify-center">
                    <img
                      src={pendingUpload.image}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[10px] font-bold truncate mt-1 text-[#1a0f2e]">
                    {pendingUpload.title || 'Chưa có tên'}
                  </div>
                </div>

                <div className="flex-1 w-full space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#f6c833] uppercase mb-1">
                      🏷️ Tiêu đề bức ảnh (Title):
                    </label>
                    <input
                      type="text"
                      autoFocus
                      required
                      value={pendingUpload.title}
                      onChange={(e) =>
                        setPendingUpload({ ...pendingUpload, title: e.target.value })
                      }
                      placeholder="Ví dụ: Hoàng hôn chiều tà, Sinh nhật 20 tuổi..."
                      className="w-full bg-[#120a21] border-2 border-[#5a3696] focus:border-[#26c281] text-[#f3eeff] px-3 py-2 text-xs outline-none shadow-[2px_2px_0px_#0a0514]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#45b7d1] uppercase mb-1">
                      🔖 Hashtag / Phân loại:
                    </label>
                    <input
                      type="text"
                      value={pendingUpload.tags}
                      onChange={(e) =>
                        setPendingUpload({ ...pendingUpload, tags: e.target.value })
                      }
                      placeholder="#summer #memory #bff"
                      className="w-full bg-[#120a21] border-2 border-[#5a3696] focus:border-[#45b7d1] text-[#f3eeff] px-3 py-1.5 text-xs outline-none shadow-[2px_2px_0px_#0a0514]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#d93876] uppercase mb-1">
                      ⭐ Nhãn góc (Badge):
                    </label>
                    <input
                      type="text"
                      value={pendingUpload.badge}
                      onChange={(e) =>
                        setPendingUpload({ ...pendingUpload, badge: e.target.value })
                      }
                      placeholder="★ ORIGINAL, ★ MEMORY, ★ FAV"
                      className="w-full bg-[#120a21] border-2 border-[#5a3696] focus:border-[#d93876] text-[#f3eeff] px-3 py-1.5 text-xs outline-none shadow-[2px_2px_0px_#0a0514]"
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#5a3696]">
                <button
                  type="button"
                  onClick={() => setPendingUpload(null)}
                  className="bg-[#2e263f] hover:bg-[#3d3254] text-[#eaddff] text-xs font-bold px-4 py-2 border border-black cursor-pointer"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  className="bg-[#26c281] hover:bg-[#20a36c] text-[#120a21] text-xs font-bold px-5 py-2 border-2 border-black shadow-[3px_3px_0px_#0a0514] cursor-pointer flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 transition-transform"
                >
                  <span className="material-symbols-outlined text-sm">push_pin</span>
                  <span>ĐỒNG Ý GHIM LÊN BẢNG</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Photo Modal: Chỉnh sửa ảnh đã ghim */}
      {editingPhoto && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setEditingPhoto(null)}
        >
          <div
            className="max-w-md w-full bg-[#1f1730] text-[#f3eeff] border-[4px] border-[#f6c833] shadow-[10px_10px_0px_#0a0514] relative modal-enter-active overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#120a21] border-b-2 border-[#f6c833] px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#f6c833] font-['Space_Mono'] text-xs font-bold uppercase">
                <span className="material-symbols-outlined text-base">edit</span>
                <span>CHỈNH SỬA TIÊU ĐỀ ẢNH ĐÃ GHIM</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingPhoto(null)}
                className="w-7 h-7 bg-[#ef4444] text-white font-bold flex items-center justify-center border border-black cursor-pointer hover:bg-red-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditPhoto} className="p-5 space-y-4 font-['Space_Mono']">
              {/* Image Preview and Changer */}
              <div>
                <label className="block text-[11px] font-bold text-[#f6c833] uppercase mb-1">
                  Hình ảnh (Nhấn để đổi ảnh mới hoặc tải từ máy):
                </label>
                <div className="flex gap-3 items-center">
                  <div className="w-28 h-28 bg-[#120a21] border-2 border-black/50 overflow-hidden flex items-center justify-center shrink-0 relative group">
                    <img
                      key={editingPhoto.image}
                      src={editingPhoto.image}
                      alt={editingPhoto.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <label
                      htmlFor="editPhotoFileInput"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-[10px] font-bold text-center p-1"
                    >
                      <span className="material-symbols-outlined text-lg">upload</span>
                      <span>ĐỔI ẢNH</span>
                    </label>
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      id="editPhotoFileInput"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const newBase64 = ev.target?.result as string;
                            if (newBase64) {
                              setEditingPhoto({ ...editingPhoto, image: newBase64 });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                        e.target.value = '';
                      }}
                    />
                    <label
                      htmlFor="editPhotoFileInput"
                      className="inline-flex items-center gap-1.5 bg-[#45b7d1] hover:bg-[#38a0b8] text-[#120a21] text-xs font-bold px-3 py-1.5 border border-black cursor-pointer shadow-[2px_2px_0px_#0a0514]"
                    >
                      <span className="material-symbols-outlined text-sm">upload_file</span>
                      <span>CHỌN ẢNH TỪ MÁY...</span>
                    </label>

                    <div className="text-[10px] text-[#eaddff]/80">Hoặc dán URL ảnh trực tiếp:</div>
                    <input
                      type="url"
                      placeholder="https://... dán link ảnh"
                      value={editingPhoto.image.startsWith('data:') ? '' : editingPhoto.image}
                      onChange={(e) => {
                        if (e.target.value.trim()) {
                          setEditingPhoto({ ...editingPhoto, image: e.target.value.trim() });
                        }
                      }}
                      className="w-full bg-[#120a21] border border-[#5a3696] focus:border-[#45b7d1] text-[#f3eeff] px-2.5 py-1 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#f6c833] uppercase mb-1">
                  Tiêu đề bức ảnh:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editingPhoto.title}
                  onChange={(e) =>
                    setEditingPhoto({ ...editingPhoto, title: e.target.value })
                  }
                  className="w-full bg-[#120a21] border-2 border-[#5a3696] focus:border-[#f6c833] text-[#f3eeff] px-3 py-2 text-xs outline-none shadow-[2px_2px_0px_#0a0514]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#45b7d1] uppercase mb-1">
                  Hashtag / Phân loại (cách nhau bởi khoảng trắng):
                </label>
                <input
                  type="text"
                  value={editingPhoto.tags.join(' ')}
                  onChange={(e) =>
                    setEditingPhoto({
                      ...editingPhoto,
                      tags: e.target.value
                        .split(' ')
                        .filter(Boolean)
                        .map((t) => (t.startsWith('#') ? t : `#${t}`)),
                    })
                  }
                  className="w-full bg-[#120a21] border-2 border-[#5a3696] focus:border-[#45b7d1] text-[#f3eeff] px-3 py-1.5 text-xs outline-none shadow-[2px_2px_0px_#0a0514]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#d93876] uppercase mb-1">
                  Nhãn góc (Badge):
                </label>
                <input
                  type="text"
                  value={editingPhoto.badge}
                  onChange={(e) =>
                    setEditingPhoto({ ...editingPhoto, badge: e.target.value })
                  }
                  className="w-full bg-[#120a21] border-2 border-[#5a3696] focus:border-[#d93876] text-[#f3eeff] px-3 py-1.5 text-xs outline-none shadow-[2px_2px_0px_#0a0514]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#5a3696]">
                <button
                  type="button"
                  onClick={() => setEditingPhoto(null)}
                  className="bg-[#2e263f] hover:bg-[#3d3254] text-[#eaddff] text-xs font-bold px-4 py-2 border border-black cursor-pointer"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  className="bg-[#f6c833] hover:bg-[#d4a414] text-[#120a21] text-xs font-bold px-5 py-2 border-2 border-black shadow-[3px_3px_0px_#0a0514] cursor-pointer flex items-center gap-1.5"
                >
                  <span>LƯU THAY ĐỔI</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
