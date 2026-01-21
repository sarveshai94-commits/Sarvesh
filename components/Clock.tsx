
import React, { useState, useEffect } from 'react';
import { ClassSession } from '../types';

interface ClockProps {
  currentSession: ClassSession | null;
  nextSession: ClassSession | null;
  onBell: (sessionEnded: ClassSession) => void;
  isSchoolMode: boolean;
  topicsCompleted: number;
  onIncrementTopic: () => void;
}

export const Clock: React.FC<ClockProps> = ({ 
  currentSession, 
  nextSession, 
  onBell, 
  isSchoolMode, 
  topicsCompleted,
  onIncrementTopic 
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);

      if (isSchoolMode && currentSession) {
        const [hour, min] = currentSession.endTime.split(':').map(Number);
        if (now.getHours() === hour && now.getMinutes() === min && now.getSeconds() === 0) {
          onBell(currentSession);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentSession, onBell, isSchoolMode]);

  const getTimeLeft = () => {
    if (!currentSession) return null;
    const [eh, em] = currentSession.endTime.split(':').map(Number);
    const end = new Date();
    end.setHours(eh, em, 0);
    
    const diff = end.getTime() - time.getTime();
    if (diff < 0) return "00:00";
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const timeLeft = getTimeLeft();

  return (
    <div className={`glass neon-border rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden group transition-all duration-500 ${isSchoolMode ? 'border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.2)] scale-[1.02]' : ''}`}>
      {isSchoolMode && (
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-[10px] font-gaming text-red-500 uppercase tracking-tighter">Mission Active</span>
        </div>
      )}

      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
        <svg className="w-24 h-24 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
        </svg>
      </div>

      <div className="font-gaming text-5xl mb-4 text-white tracking-tighter tabular-nums">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>

      {currentSession ? (
        <div className="text-center w-full">
          <div className="text-cyan-400 font-bold uppercase tracking-widest text-xs mb-1">
            {currentSession.isBreak ? 'Regen Phase' : 'Current Objective'}
          </div>
          <div className="font-gaming text-2xl text-white mb-4 flex items-center justify-center gap-3">
             {currentSession.name}
             <span className="text-xs bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">LOCKED</span>
          </div>
          
          <div className="flex flex-col items-center mb-6">
            <div className={`text-6xl font-gaming glow-red transition-colors ${timeLeft === '00:00' ? 'text-red-600' : 'text-cyan-500'}`}>
              {timeLeft}
            </div>
            <div className="text-[10px] text-gray-500 mt-2 uppercase tracking-[0.2em]">Until Bell Tolls</div>
          </div>

          {!currentSession.isBreak && isSchoolMode && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center justify-between">
              <div className="text-left">
                <div className="text-[10px] text-gray-400 uppercase font-bold">Topics Mastery</div>
                <div className="font-gaming text-xl text-yellow-500">{topicsCompleted}</div>
              </div>
              <button 
                onClick={onIncrementTopic}
                className="bg-yellow-500/20 hover:bg-yellow-500 text-yellow-500 hover:text-black p-2 rounded-lg border border-yellow-500/50 transition-all active:scale-90 font-gaming text-xs"
              >
                + LOG TOPIC
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <p className="font-gaming text-xl italic tracking-widest">IDLE STATE</p>
          <p className="text-xs mt-2 uppercase">Initiate School Day to begin tracking</p>
        </div>
      )}

      {nextSession && (
        <div className="mt-6 pt-6 border-t border-white/10 w-full text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Incoming Sector</div>
          <div className="text-sm font-gaming text-gray-400">
            {nextSession.name} <span className="text-cyan-500/60 mx-2">>></span> {nextSession.startTime}
          </div>
        </div>
      )}
    </div>
  );
};
