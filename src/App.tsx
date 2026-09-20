import React, { useState } from 'react';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { HobbiesZone } from './components/HobbiesZone';
import { PolaroidPinboard } from './components/PolaroidPinboard';
import { QuestLog } from './components/QuestLog';
import { SkillInventory } from './components/SkillInventory';
import { SocialModal } from './components/SocialModal';
import { TopNav } from './components/TopNav';
import { COSMIC_BG_URL } from './data/portfolioData';
import { spawnFlyingHeart } from './utils/fx';

export default function App() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [friendshipHearts, setFriendshipHearts] = useState(143);

  const handleOpenContact = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsContactModalOpen(true);
  };

  const handleCloseContact = () => {
    setIsContactModalOpen(false);
  };

  const handleSendLove = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    setFriendshipHearts((prev) => prev + 1);
    spawnFlyingHeart(e?.clientX, e?.clientY);
  };

  return (
    <div className="crt-scanlines text-[#eaddff] font-['Space_Mono'] antialiased min-h-screen relative overflow-x-hidden">
      {/* Full-Page Pixel Cosmic Space Background */}
      <div
        className="fixed inset-0 w-full h-full bg-cover bg-center opacity-45 pointer-events-none z-0 pixelated-render"
        style={{
          backgroundImage: `url('${COSMIC_BG_URL}')`,
          backgroundAttachment: 'fixed',
        }}
      />

      {/* Top HUD Nav */}
      <TopNav onOpenContact={handleOpenContact} />

      {/* Main Canvas Content */}
      <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 space-y-12 relative z-10">
        <HeroSection onOpenContact={handleOpenContact} onSendLove={handleSendLove} />
        <SkillInventory />
        <QuestLog />
        <HobbiesZone friendshipHearts={friendshipHearts} onSendLove={handleSendLove} />
        <PolaroidPinboard onOpenContact={handleOpenContact} />
      </main>

      {/* Retro Social Popup Modal */}
      <SocialModal isOpen={isContactModalOpen} onClose={handleCloseContact} />

      {/* Arcade Footer */}
      <Footer onOpenContact={handleOpenContact} />
    </div>
  );
}
