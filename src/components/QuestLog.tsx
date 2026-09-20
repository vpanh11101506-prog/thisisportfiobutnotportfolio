import React from 'react';
import { QUEST_ITEMS } from '../data/portfolioData';
import { spawnPixelBurst } from '../utils/fx';

export const QuestLog: React.FC = () => {
  const handleCardClick = (e: React.MouseEvent) => {
    spawnPixelBurst(e.clientX, e.clientY, 6);
  };

  return (
    <section className="space-y-6" id="questbook">
      <div className="flex items-center justify-between border-b-[3px] border-[#5a3696] pb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#f6c833] text-2xl">menu_book</span>
          <h2 className="text-xl md:text-2xl font-['Space_Grotesk'] text-[#f6c833] arcade-glow-gold uppercase font-bold">
            Nhật Ký Nhiệm Vụ (Quest Log)
          </h2>
        </div>
        <span className="font-['Space_Mono'] text-xs bg-[#45b7d1] text-[#120a21] font-bold border-[2px] border-black px-3 py-1 shadow-[2px_2px_0px_#0a0514]">
          3 QUESTS COMPLETED
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {QUEST_ITEMS.map((quest) => (
          <div
            key={quest.id}
            onClick={handleCardClick}
            className={`bg-[#1f1730]/95 border-[3px] border-[#5a3696] p-5 pixel-box-sm flex flex-col justify-between ${quest.borderColor} transition-all cursor-pointer`}
          >
            <div>
              <div className="flex items-center justify-between text-[#d93876] font-['Space_Mono'] text-xs mb-2 font-bold">
                <span className={quest.status === 'CURRENT' ? 'text-[#d93876]' : quest.roleColor}>
                  {quest.tag}
                </span>
                <span className={`${quest.statusColor} px-1.5 py-0.5 uppercase text-[10px]`}>
                  {quest.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#f6c833] font-['Space_Grotesk']">
                {quest.title}
              </h3>
              <p className={`font-['Space_Mono'] text-xs ${quest.roleColor} mt-1 font-bold`}>
                {quest.role}
              </p>
              <p className="font-['Space_Mono'] text-xs text-[#f3eeff] mt-3 leading-relaxed">
                {quest.desc}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t-2 border-[#5a3696] bg-[#231b34] -mx-5 -mb-5 p-3 flex items-center justify-between">
              <span className="font-['Space_Mono'] text-xs text-[#eaddff] font-bold">REWARD:</span>
              <span className={`font-['Space_Mono'] text-xs ${quest.rewardColor} font-bold`}>
                {quest.reward}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
