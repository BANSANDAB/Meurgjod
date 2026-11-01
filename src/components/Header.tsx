import React from 'react';
import { Palette, Heart } from 'lucide-react';

interface HeaderProps {
  onOpenThemeModal: () => void;
  currentUser: string;
  onToggleUser: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenThemeModal, currentUser, onToggleUser }) => {
  return (
    <header className="relative pt-2 pb-1 px-3.5 flex items-center justify-between select-none">
      {/* App Title & Subtitle */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(18,53,107,0.45)]">
            จดให้ไว
          </h1>
          {/* Active Couple User Switcher Chip */}
          <button
            onClick={onToggleUser}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/95 text-navy-text border border-white/90 shadow-xs active:scale-95 transition-all"
            title="กดเพื่อสลับผู้ใช้งานระหว่าง โจ กับ ตาล"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{currentUser === 'โจ' ? '👦 โจ' : '👧 ตาล'}</span>
            <span className="text-[9px] text-navy-muted">(สลับ)</span>
          </button>
        </div>
        <p className="text-[10px] font-semibold text-white/95 drop-shadow-[0_1px_2px_rgba(18,53,107,0.35)] flex items-center gap-1 mt-0.2">
          <span>ผู้ช่วยดูแลการเงินคู่ และสุขภาพ</span>
          <Heart className="w-3 h-3 text-pink-300 fill-pink-300 inline animate-bounce" />
        </p>
      </div>

      {/* Right side: Couple mascot illustration & Theme button */}
      <div className="flex items-center gap-1.5">
        {/* Cute Couple Avatar */}
        <div 
          onClick={onToggleUser}
          className="relative w-9 h-9 rounded-xl overflow-hidden shadow-xs border-2 border-white/90 cursor-pointer active:scale-95 transition-transform bg-white/40"
          title="คู่รัก: โจ & ตาล"
        >
          <img 
            src="./assets/couple-avatar.png" 
            alt="Jo & Tanz" 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Theme Button */}
        <button
          onClick={onOpenThemeModal}
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-btn-yellow/95 hover:bg-yellow-200 text-navy-text font-bold text-[11px] shadow-xs border border-amber-200/80 active:scale-95 transition-all"
        >
          <Palette className="w-3 h-3 text-amber-600" />
          <span>ธีม</span>
        </button>
      </div>
    </header>
  );
};
