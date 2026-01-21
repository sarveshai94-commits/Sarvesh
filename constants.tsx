
import React from 'react';

export const INITIAL_BADGES = [
  { id: 'early_bird', name: 'Early Bird', description: 'Complete a task 24h before deadline', icon: '🌅' },
  { id: 'study_warrior', name: 'Study Warrior', description: 'Complete 10 assignments', icon: '⚔️' },
  { id: 'perfectionist', name: 'Perfectionist', description: 'No missed classes for a week', icon: '💎' },
  { id: 'night_owl', name: 'Night Owl', description: 'Finish a task after 10 PM', icon: '🦉' },
  { id: 'first_blood', name: 'First Blood', description: 'Complete your first assignment', icon: '🩸' },
];

export const INITIAL_TIMETABLE = {
  'Monday': [
    { id: '1', name: 'Mathematics', startTime: '08:30', endTime: '09:30' },
    { id: '2', name: 'Physics', startTime: '09:40', endTime: '10:40' },
    { id: '3', name: 'Recess', startTime: '10:40', endTime: '11:00', isBreak: true },
    { id: '4', name: 'Literature', startTime: '11:00', endTime: '12:00' },
    { id: '5', name: 'Lunch Break', startTime: '12:00', endTime: '13:00', isBreak: true },
    { id: '6', name: 'Computer Science', startTime: '13:00', endTime: '14:30' },
  ],
  'Tuesday': [
    { id: '7', name: 'Chemistry', startTime: '09:00', endTime: '10:30' },
    { id: '8', name: 'History', startTime: '10:45', endTime: '12:00' },
  ],
  // ... more can be added by user
};
