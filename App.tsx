
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Timetable, 
  UserStats, 
  Assignment, 
  DayOfWeek, 
  ClassSession,
  AppState,
  XP_PER_LEVEL,
  TopicRecord
} from './types';
import { INITIAL_TIMETABLE, INITIAL_BADGES } from './constants';
import { XPBar } from './components/XPBar';
import { Clock } from './components/Clock';
import { getMotivationalMessage, analyzeAssignments } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('academyQuestState');
    if (saved) return JSON.parse(saved);
    return {
      stats: {
        xp: 450,
        level: 1,
        badges: [],
        streak: 3,
        lastActive: new Date().toISOString(),
        attendance: [],
        topicHistory: []
      },
      timetable: INITIAL_TIMETABLE,
      assignments: [
        { id: 'a1', title: 'Calculus Quiz Prep', subject: 'Math', dueDate: '2023-12-01', xpReward: 500, completed: false, priority: 'High' },
        { id: 'a2', title: 'Code a React App', subject: 'CS', dueDate: '2023-12-05', xpReward: 800, completed: false, priority: 'Medium' }
      ],
      isSchoolModeActive: false
    };
  });

  const [currentTopics, setCurrentTopics] = useState(0);
  const [motivation, setMotivation] = useState<string>("Syncing with the Academy server...");
  const [dailyBoss, setDailyBoss] = useState<{ title: string; reason: string; strategy: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'dash' | 'schedule' | 'tasks' | 'stats'>('dash');

  // Persistence
  useEffect(() => {
    localStorage.setItem('academyQuestState', JSON.stringify(state));
  }, [state]);

  // Load AI elements
  useEffect(() => {
    const loadAI = async () => {
      const msg = await getMotivationalMessage('Hero', state.stats.level);
      setMotivation(msg);
      
      const boss = await analyzeAssignments(state.assignments);
      if (boss) setDailyBoss(boss);
    };
    loadAI();
  }, [state.stats.level, state.assignments]);

  const currentDay = useMemo(() => {
    const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }, []);

  const currentSessions = useMemo(() => state.timetable[currentDay] || [], [state.timetable, currentDay]);

  const activeSession = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return currentSessions.find(s => {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      const startTotal = sh * 60 + sm;
      const endTotal = eh * 60 + em;
      return currentMinutes >= startTotal && currentMinutes < endTotal;
    }) || null;
  }, [currentSessions]);

  const nextSession = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return currentSessions
      .filter(s => {
        const [sh, sm] = s.startTime.split(':').map(Number);
        return sh * 60 + sm > currentMinutes;
      })
      .sort((a, b) => {
        const [ah, am] = a.startTime.split(':').map(Number);
        const [bh, bm] = b.startTime.split(':').map(Number);
        return (ah * 60 + am) - (bh * 60 + bm);
      })[0] || null;
  }, [currentSessions]);

  const handleBell = useCallback((endedSession: ClassSession) => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audio.play().catch(() => {});
    
    // Auto-log the topics for the ended session
    if (!endedSession.isBreak && currentTopics > 0) {
      const [sh, sm] = endedSession.startTime.split(':').map(Number);
      const [eh, em] = endedSession.endTime.split(':').map(Number);
      const duration = (eh * 60 + em) - (sh * 60 + sm);
      
      const record: TopicRecord = {
        sessionId: endedSession.id,
        subjectName: endedSession.name,
        count: currentTopics,
        durationMinutes: duration,
        date: new Date().toISOString()
      };

      setState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          topicHistory: [...prev.stats.topicHistory, record],
          xp: prev.stats.xp + (currentTopics * 20) + 100, // XP for finishing session + topics
        }
      }));
      setCurrentTopics(0);
    } else {
      // Basic XP for just attending
      setState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          xp: prev.stats.xp + 50
        }
      }));
    }

    // Level calculation is automated in XPBar, but we keep it in state for AI
    setState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        level: Math.floor(prev.stats.xp / XP_PER_LEVEL) + 1
      }
    }));
  }, [currentTopics]);

  const toggleSchoolMode = () => {
    if (!state.isSchoolModeActive) {
      // Start of day: Log attendance
      const today = new Date().toISOString().split('T')[0];
      const attendedToday = state.stats.attendance.includes(today);
      
      setState(prev => ({
        ...prev,
        isSchoolModeActive: true,
        stats: {
          ...prev.stats,
          attendance: attendedToday ? prev.stats.attendance : [...prev.stats.attendance, today],
          xp: attendedToday ? prev.stats.xp : prev.stats.xp + 200 // First log reward
        }
      }));
    } else {
      setState(prev => ({ ...prev, isSchoolModeActive: false }));
    }
  };

  const completeTask = (id: string) => {
    const task = state.assignments.find(a => a.id === id);
    if (!task || task.completed) return;

    setState(prev => {
      const newXP = prev.stats.xp + task.xpReward;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          xp: newXP,
          level: Math.floor(newXP / XP_PER_LEVEL) + 1,
        },
        assignments: prev.assignments.map(a => 
          a.id === id ? { ...a, completed: true, completedAt: new Date().toISOString() } : a
        )
      };
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto pb-24 lg:pb-8">
      {/* Top HUD */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 glass rounded-2xl p-6 neon-border">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 border-2 border-white/20 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/20">
              👤
            </div>
            {state.isSchoolModeActive && (
               <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-[#050505] animate-pulse"></div>
            )}
          </div>
          <div>
            <h1 className="font-gaming text-2xl text-white tracking-tighter">HERO#001</h1>
            <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.2em] italic max-w-xs leading-tight">
              {motivation}
            </p>
          </div>
        </div>

        <div className="flex-1 w-full md:max-w-md">
          <XPBar xp={state.stats.xp} level={state.stats.level} />
        </div>

        <div className="flex gap-4">
          <div className="text-center bg-gray-900/50 p-3 rounded-xl border border-gray-800 min-w-[80px]">
            <div className="text-[10px] text-gray-500 font-bold uppercase">Attendance</div>
            <div className="font-gaming text-xl text-green-500">{state.stats.attendance.length} 🛡️</div>
          </div>
          <div className="text-center bg-gray-900/50 p-3 rounded-xl border border-gray-800 min-w-[80px]">
            <div className="text-[10px] text-gray-500 font-bold uppercase">Streak</div>
            <div className="font-gaming text-xl text-orange-500">{state.stats.streak} 🔥</div>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Navigation & Stats */}
        <aside className="lg:col-span-3 flex flex-col gap-6">
          <div className="glass rounded-2xl p-2 neon-border flex lg:flex-col gap-1">
            <button onClick={() => setActiveTab('dash')} className={`flex-1 p-3 rounded-xl font-gaming text-xs uppercase transition-all flex items-center gap-3 ${activeTab === 'dash' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-gray-500 hover:text-white'}`}>
              <span className="text-lg">📊</span> HUD
            </button>
            <button onClick={() => setActiveTab('schedule')} className={`flex-1 p-3 rounded-xl font-gaming text-xs uppercase transition-all flex items-center gap-3 ${activeTab === 'schedule' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-gray-500 hover:text-white'}`}>
              <span className="text-lg">📅</span> Maps
            </button>
            <button onClick={() => setActiveTab('tasks')} className={`flex-1 p-3 rounded-xl font-gaming text-xs uppercase transition-all flex items-center gap-3 ${activeTab === 'tasks' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-gray-500 hover:text-white'}`}>
              <span className="text-lg">⚔️</span> Quests
            </button>
            <button onClick={() => setActiveTab('stats')} className={`flex-1 p-3 rounded-xl font-gaming text-xs uppercase transition-all flex items-center gap-3 ${activeTab === 'stats' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-gray-500 hover:text-white'}`}>
              <span className="text-lg">📈</span> Logs
            </button>
          </div>

          <div className="glass rounded-2xl p-6 neon-border">
            <h3 className="font-gaming text-[10px] text-gray-500 mb-4 uppercase tracking-widest">Mastery Badges</h3>
            <div className="grid grid-cols-4 gap-2">
              {INITIAL_BADGES.map(badge => (
                <div key={badge.id} className="aspect-square glass rounded-lg flex items-center justify-center text-xl grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all cursor-help relative group" title={badge.description}>
                  {badge.icon}
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6 neon-border flex flex-col items-center gap-4">
             <div className="text-[10px] font-gaming text-gray-400 uppercase tracking-widest text-center">Protocol Status</div>
             <button 
                onClick={toggleSchoolMode}
                className={`w-full py-4 rounded-xl font-gaming text-sm uppercase tracking-widest transition-all shadow-lg active:scale-95 border-2 ${state.isSchoolModeActive ? 'bg-red-500/20 text-red-500 border-red-500 shadow-red-500/20' : 'bg-cyan-500 text-black border-cyan-400 font-black shadow-cyan-500/40'}`}
              >
                {state.isSchoolModeActive ? 'ABORT MISSION' : 'START SCHOOL DAY'}
              </button>
              <p className="text-[9px] text-gray-500 text-center italic leading-tight">
                {state.isSchoolModeActive ? "Auto-bell and Topic Tracking are ENGAGED." : "Ready for deployment."}
              </p>
          </div>
        </aside>

        {/* Center: Main Content */}
        <section className="lg:col-span-6 flex flex-col gap-6">
          {activeTab === 'dash' && (
            <>
              <Clock 
                currentSession={activeSession} 
                nextSession={nextSession} 
                onBell={handleBell}
                isSchoolMode={state.isSchoolModeActive}
                topicsCompleted={currentTopics}
                onIncrementTopic={() => setCurrentTopics(t => t + 1)}
              />
              
              {dailyBoss && (
                <div className="glass rounded-2xl p-6 border-l-4 border-l-red-500 relative overflow-hidden">
                  <h3 className="font-gaming text-red-500 text-xs mb-2 flex items-center gap-2">
                    <span className="animate-pulse">⚠️</span> PRIORITY BOSS SPAWNED
                  </h3>
                  <h2 className="text-lg font-gaming text-white mb-2">{dailyBoss.title}</h2>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">{dailyBoss.reason}</p>
                  <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">Tactical Plan: </span>
                    <span className="text-[11px] text-gray-300 italic">{dailyBoss.strategy}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass rounded-2xl p-6 neon-border">
                  <h3 className="font-gaming text-[10px] text-cyan-400 mb-4 tracking-[0.3em]">TODAY'S RAIDS</h3>
                  <div className="flex flex-col gap-3">
                    {currentSessions.map(session => {
                      const isActive = session === activeSession;
                      return (
                        <div key={session.id} className={`p-3 rounded-xl flex items-center justify-between transition-all ${isActive ? 'bg-cyan-500/20 border border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-white/5 border border-white/5 opacity-60'}`}>
                          <div>
                            <div className={`font-gaming text-xs ${isActive ? 'text-white' : 'text-gray-400'}`}>{session.name}</div>
                            <div className="text-[9px] text-gray-500 uppercase">{session.startTime} - {session.endTime}</div>
                          </div>
                          {session.isBreak && <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">REGEN</span>}
                          {isActive && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="glass rounded-2xl p-6 neon-border">
                  <h3 className="font-gaming text-[10px] text-yellow-400 mb-4 tracking-[0.3em]">URGENT BOUNTIES</h3>
                  <div className="flex flex-col gap-3">
                    {state.assignments.filter(a => !a.completed).slice(0, 3).map(task => (
                      <div key={task.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <div>
                          <div className="font-gaming text-xs text-white truncate max-w-[120px]">{task.title}</div>
                          <div className="text-[9px] text-red-400 uppercase">Expires: {task.dueDate}</div>
                        </div>
                        <button 
                          onClick={() => completeTask(task.id)}
                          className="w-7 h-7 rounded-full bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-black transition-all flex items-center justify-center border border-cyan-500/30"
                        >
                          ✓
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'stats' && (
            <div className="glass rounded-2xl p-6 neon-border min-h-[500px]">
              <h2 className="font-gaming text-xl text-white mb-6 uppercase tracking-widest">Mission Intelligence Logs</h2>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-[10px] text-gray-500 uppercase mb-1">Total Topics Logged</div>
                  <div className="text-3xl font-gaming text-cyan-400">{state.stats.topicHistory.reduce((acc, curr) => acc + curr.count, 0)}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-[10px] text-gray-500 uppercase mb-1">Active Study Time</div>
                  <div className="text-3xl font-gaming text-purple-400">
                    {Math.round(state.stats.topicHistory.reduce((acc, curr) => acc + curr.durationMinutes, 0) / 60)}h
                  </div>
                </div>
              </div>

              <h3 className="font-gaming text-sm text-gray-400 mb-4 uppercase tracking-widest">Recent Session History</h3>
              <div className="space-y-3">
                 {state.stats.topicHistory.slice(-5).reverse().map((record, idx) => (
                   <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/10 flex justify-between items-center">
                     <div>
                       <div className="font-gaming text-xs text-white">{record.subjectName}</div>
                       <div className="text-[9px] text-gray-500">{new Date(record.date).toLocaleDateString()} • {record.durationMinutes}m duration</div>
                     </div>
                     <div className="text-right">
                       <div className="font-gaming text-lg text-yellow-500">+{record.count}</div>
                       <div className="text-[8px] text-gray-400 uppercase">Topics</div>
                     </div>
                   </div>
                 ))}
                 {state.stats.topicHistory.length === 0 && <div className="text-gray-500 italic text-center py-8">No session data logged yet.</div>}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="glass rounded-2xl p-6 neon-border min-h-[500px]">
              <h2 className="font-gaming text-xl text-white mb-6 uppercase tracking-widest">Territory Maps</h2>
              <div className="space-y-6">
                {(Object.keys(state.timetable) as DayOfWeek[]).map(day => (
                  <div key={day} className={`p-4 rounded-xl border transition-all ${day === currentDay ? 'bg-cyan-500/5 border-cyan-500/30' : 'bg-white/5 border-white/5'}`}>
                    <h3 className={`font-gaming text-xs mb-3 uppercase tracking-widest ${day === currentDay ? 'text-cyan-400' : 'text-gray-500'}`}>{day} {day === currentDay ? '(ACTIVE)' : ''}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {state.timetable[day].map(s => (
                        <div key={s.id} className="bg-black/40 p-3 rounded-lg border border-white/10 group hover:border-cyan-500/50 transition-colors">
                          <span className="block font-gaming text-[10px] text-gray-300 mb-1">{s.name}</span>
                          <span className="text-[9px] text-gray-600 uppercase tabular-nums">{s.startTime} - {s.endTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="glass rounded-2xl p-6 neon-border min-h-[500px]">
               <div className="flex justify-between items-center mb-6">
                <h2 className="font-gaming text-xl text-white uppercase tracking-widest">Active Quests</h2>
                <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-gaming border border-white/10 transition-all uppercase tracking-widest">Initialize New</button>
              </div>
              <div className="space-y-4">
                {state.assignments.map(task => (
                  <div key={task.id} className={`glass p-4 rounded-xl border border-white/10 flex items-center gap-4 transition-all ${task.completed ? 'opacity-40 grayscale' : 'hover:border-cyan-500/40'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${task.completed ? 'bg-green-500/10 text-green-500' : 'bg-cyan-500/10 text-cyan-400'}`}>
                      {task.completed ? '🏆' : '⚔️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-gaming text-xs text-white truncate">{task.title}</h4>
                        <span className={`text-[7px] px-1 py-0.5 rounded font-black uppercase ${task.priority === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-gray-500/20 text-gray-400'}`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="text-[9px] text-gray-500 mt-1 uppercase tracking-tighter">
                        Loot: <span className="text-cyan-400">+{task.xpReward} XP</span> • Target: <span className="text-gray-300">{task.dueDate}</span>
                      </div>
                    </div>
                    {!task.completed && (
                      <button onClick={() => completeTask(task.id)} className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-gaming text-[9px] rounded-lg transition-all active:scale-95 uppercase font-black">
                        Claim
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Party & Social */}
        <aside className="lg:col-span-3 flex flex-col gap-6">
           <div className="glass rounded-2xl p-6 neon-border">
            <h3 className="font-gaming text-[10px] text-purple-400 mb-4 uppercase tracking-widest">Global Ranking</h3>
            <div className="space-y-4">
              {[
                { name: 'X_Factor_Hero', level: 19, avatar: '🐉' },
                { name: 'QuantumScholar', level: 16, avatar: '🌌' },
                { name: 'VoidWalker_7', level: 14, avatar: '🌑' },
              ].map((rival, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-transparent hover:border-purple-500/20 transition-all">
                  <div className="text-xl">{rival.avatar}</div>
                  <div className="flex-1">
                    <div className="text-[10px] font-gaming text-white truncate">{rival.name}</div>
                    <div className="text-[9px] text-gray-500 uppercase tracking-tighter">Level {rival.level}</div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6 neon-border flex-1">
            <h3 className="font-gaming text-[10px] text-gray-500 mb-4 uppercase tracking-widest">Mission Events</h3>
            <div className="space-y-4 text-[10px] overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              <div className="flex gap-2">
                <span className="text-green-500 font-bold">»</span>
                <span className="text-gray-400">System: <span className="text-cyan-400">School Mode Engaged</span> for sector {currentDay}.</span>
              </div>
              {state.stats.attendance.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-yellow-500 font-bold">»</span>
                  <span className="text-gray-400">Log: Attendance recorded for {new Date().toLocaleDateString()}.</span>
                </div>
              )}
              {state.stats.topicHistory.slice(-3).map((h, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-cyan-500 font-bold">»</span>
                  <span className="text-gray-400">Reward: <span className="text-white">{h.count} Topics</span> mastered in {h.subjectName}.</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* Footer Navigation (Mobile) */}
      <footer className="lg:hidden glass fixed bottom-4 left-4 right-4 p-2 rounded-2xl neon-border flex justify-around z-50">
        <button onClick={() => setActiveTab('dash')} className={`p-3 text-xl ${activeTab === 'dash' ? 'text-cyan-400' : 'text-gray-500'}`}>📊</button>
        <button onClick={() => setActiveTab('schedule')} className={`p-3 text-xl ${activeTab === 'schedule' ? 'text-cyan-400' : 'text-gray-500'}`}>📅</button>
        <button onClick={() => setActiveTab('tasks')} className={`p-3 text-xl ${activeTab === 'tasks' ? 'text-cyan-400' : 'text-gray-500'}`}>⚔️</button>
        <button onClick={() => setActiveTab('stats')} className={`p-3 text-xl ${activeTab === 'stats' ? 'text-cyan-400' : 'text-gray-500'}`}>📈</button>
      </footer>
    </div>
  );
};

export default App;
