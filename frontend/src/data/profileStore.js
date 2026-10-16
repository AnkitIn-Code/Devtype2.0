// src/data/profileStore.js

export const DEFAULT_PROFILE = {
  displayName: 'Alex Spoor',
  username: 'spoor',
  title: 'Full Stack Systems Engineer',
  bio: 'Building low-latency web interfaces, practicing algorithmic syntax, and refining daily keystroke velocity.',
  avatar: 'SP',
  avatarBg: 'linear-gradient(135deg, #1E3A8A, #3B82F6)',
  level: 24,
  xp: 24800,
  nextLevelXp: 30000,
  streak: 28,
  bestWpm: 118,
  avgWpm: 92,
  sessions: 428,
  precision: 98.6,
  favLang: 'C++',
  joinedDate: 'September 2025',
  githubUrl: 'https://github.com',
  website: 'https://codetype.dev',
};

export const INITIAL_FRIENDS = {
  connected: [
    {
      id: 'f-1',
      name: 'alex_systems',
      displayName: 'Alex Chen',
      avatar: 'AC',
      avatarBg: 'linear-gradient(135deg, #1E3A8A, #3B82F6)',
      title: 'Principal Systems Eng',
      level: 56,
      bestWpm: 124,
      status: 'Online',
      primaryLang: 'C++',
    },
    {
      id: 'f-2',
      name: 'elena_rustacean',
      displayName: 'Elena Rostova',
      avatar: 'ER',
      avatarBg: 'linear-gradient(135deg, #7C2D12, #EA580C)',
      title: 'Rust Core Maintainer',
      level: 52,
      bestWpm: 118,
      status: 'In Practice',
      primaryLang: 'Rust',
    },
    {
      id: 'f-3',
      name: 'sarah_pythonic',
      displayName: 'Sarah Jenkins',
      avatar: 'SJ',
      avatarBg: 'linear-gradient(135deg, #312E81, #4F46E5)',
      title: 'ML Platform Lead',
      level: 46,
      bestWpm: 108,
      status: 'Online',
      primaryLang: 'Python',
    },
    {
      id: 'f-4',
      name: 'david_kim',
      displayName: 'David Kim',
      avatar: 'DK',
      avatarBg: 'linear-gradient(135deg, #065F46, #10B981)',
      title: 'Security Architect',
      level: 38,
      bestWpm: 98,
      status: 'Offline',
      primaryLang: 'Go',
    },
  ],
  received: [
    {
      id: 'f-5',
      name: 'marcus_ts',
      displayName: 'Marcus Brody',
      avatar: 'MB',
      avatarBg: 'linear-gradient(135deg, #075985, #0284C7)',
      title: 'Staff Frontend Architect',
      level: 49,
      bestWpm: 112,
      primaryLang: 'TypeScript',
    },
    {
      id: 'f-6',
      name: 'lucas_silva',
      displayName: 'Lucas Silva',
      avatar: 'LS',
      avatarBg: 'linear-gradient(135deg, #831843, #EC4899)',
      title: 'Backend Engineer',
      level: 28,
      bestWpm: 86,
      primaryLang: 'Java',
    },
  ],
  sent: [
    {
      id: 'f-7',
      name: 'emily_go',
      displayName: 'Emily Watson',
      avatar: 'EW',
      avatarBg: 'linear-gradient(135deg, #134E4A, #14B8A6)',
      title: 'Cloud Infrastructure Lead',
      level: 42,
      bestWpm: 104,
      primaryLang: 'Go',
    },
  ],
};

export const CHALLENGE_STATS = {
  easy: { solved: 24, total: 30, color: '#10B981' },
  medium: { solved: 18, total: 25, color: '#F59E0B' },
  hard: { solved: 6, total: 15, color: '#F43F5E' },
};

export const RECENT_ACTIVITY = [
  {
    id: 'act-1',
    snippetName: 'Least Recently Used (LRU) Cache',
    language: 'C++',
    difficulty: 'Intermediate',
    wpm: 114,
    accuracy: 99.2,
    duration: '45s',
    date: 'Today, 2:15 PM',
  },
  {
    id: 'act-2',
    snippetName: 'Binary Search Implementation',
    language: 'C++',
    difficulty: 'Easy',
    wpm: 118,
    accuracy: 100,
    duration: '32s',
    date: 'Yesterday, 6:40 PM',
  },
  {
    id: 'act-3',
    snippetName: 'Two Sum Algorithmic Pass',
    language: 'Python',
    difficulty: 'Easy',
    wpm: 96,
    accuracy: 98.4,
    duration: '28s',
    date: 'Oct 14, 2026',
  },
  {
    id: 'act-4',
    snippetName: 'Debounce Utility with Cancellation',
    language: 'TypeScript',
    difficulty: 'Intermediate',
    wpm: 102,
    accuracy: 97.8,
    duration: '40s',
    date: 'Oct 13, 2026',
  },
  {
    id: 'act-5',
    snippetName: 'Merge Non-Overlapping Intervals',
    language: 'Java',
    difficulty: 'Hard',
    wpm: 91,
    accuracy: 99.0,
    duration: '52s',
    date: 'Oct 12, 2026',
  },
];

const PROFILE_KEY = 'codetype_user_profile_v1';
const FRIENDS_KEY = 'codetype_user_friends_v1';

export function getStoredProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load profile', e);
  }
  return DEFAULT_PROFILE;
}

export function saveStoredProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

export function getStoredFriends() {
  try {
    const raw = localStorage.getItem(FRIENDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load friends', e);
  }
  return INITIAL_FRIENDS;
}

export function saveStoredFriends(friends) {
  try {
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
  } catch (e) {
    console.error('Failed to save friends', e);
  }
}
