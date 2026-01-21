
import React from 'react';
import { XP_PER_LEVEL } from '../types';

interface XPBarProps {
  xp: number;
  level: number;
}

export const XPBar: React.FC<XPBarProps> = ({ xp, level }) => {
  const currentXP = xp % XP_PER_LEVEL;
  const progress = (currentXP / XP_PER_LEVEL) * 100;

  return (
    <div className="w-full flex flex-col gap-1">
      <div className="flex justify-between items-end mb-1">
        <div className="flex items-baseline gap-2">
          <span className="font-gaming text-2xl font-bold text-cyan-400 glow-cyan">LVL {level}</span>
          <span className="text-xs text-gray-500 font-medium">RANK: ACADEMIC WARRIOR</span>
        </div>
        <span className="font-gaming text-sm text-gray-400">{currentXP} / {XP_PER_LEVEL} XP</span>
      </div>
      <div className="h-4 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800 p-[2px]">
        <div 
          className="h-full xp-bar-gradient rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
