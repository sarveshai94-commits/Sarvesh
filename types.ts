
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface ClassSession {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  room?: string;
  isBreak?: boolean;
}

export interface Timetable {
  [key: string]: ClassSession[];
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  xpReward: number;
  completed: boolean;
  completedAt?: string;
  priority: 'Low' | 'Medium' | 'High';
}

export interface TopicRecord {
  sessionId: string;
  subjectName: string;
  count: number;
  durationMinutes: number;
  date: string;
}

export interface UserStats {
  xp: number;
  level: number;
  badges: Badge[];
  streak: number;
  lastActive: string;
  attendance: string[]; // List of ISO dates
  topicHistory: TopicRecord[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export const XP_PER_LEVEL = 1000;

export interface AppState {
  stats: UserStats;
  timetable: Timetable;
  assignments: Assignment[];
  isSchoolModeActive: boolean;
}
