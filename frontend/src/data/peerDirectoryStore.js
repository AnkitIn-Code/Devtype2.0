// src/data/peerDirectoryStore.js

/**
 * Curated directory of discoverable developer peers on DevType 2.0.
 * Each peer has rich, complete telemetry, connection graphs (whom they are connected with),
 * and following/followers networks.
 */

export const INITIAL_PEER_DIRECTORY = [
  {
    id: 'peer-elena',
    name: 'elena_rust',
    displayName: 'Elena Rostova',
    title: 'Senior Systems Engineer',
    bio: 'Building low-latency distributed kernels. Obsessed with zero-cost abstractions, cache locality, and 120+ WPM keystroke flow.',
    avatar: 'ER',
    avatarBg: 'linear-gradient(135deg, #1E3A8A, #3B82F6)',
    status: 'Online',
    level: 14,
    xp: 3420,
    streak: 28,
    bestWpm: 124,
    avgWpm: 108,
    sessions: 512,
    precision: 99.4,
    favLang: 'Rust',
    joinedDate: 'March 2024',
    githubUrl: 'https://github.com/elena-rust-systems',
    website: 'https://elena.systems',
    mutualCount: 4,
    connectedPeers: [
      { id: 'peer-marcus', name: 'marcus_v', displayName: 'Marcus Vance', title: 'Distributed Systems Architect', avatar: 'MV', avatarBg: 'linear-gradient(135deg, #065F46, #10B981)', bestWpm: 115, status: 'Online' },
      { id: 'peer-priya', name: 'priya_dev', displayName: 'Priya Sharma', title: 'Staff Frontend Architect', avatar: 'PS', avatarBg: 'linear-gradient(135deg, #312E81, #4F46E5)', bestWpm: 108, status: 'In Practice' },
      { id: 'peer-kai', name: 'kaichen_algo', displayName: 'Kai Chen', title: 'Competitive Programmer', avatar: 'KC', avatarBg: 'linear-gradient(135deg, #78350F, #D97706)', bestWpm: 136, status: 'Online' },
      { id: 'peer-liam', name: 'liam_oc', displayName: 'Liam O\'Connor', title: 'Backend Security Specialist', avatar: 'LO', avatarBg: 'linear-gradient(135deg, #075985, #0284C7)', bestWpm: 102, status: 'Offline' }
    ],
    following: [
      { id: 'f-1', name: 'linus_torvalds', displayName: 'Linus Torvalds', title: 'Linux Kernel BDFL', avatar: 'LT', avatarBg: 'linear-gradient(135deg, #1E293B, #475569)' },
      { id: 'f-2', name: 'marcus_v', displayName: 'Marcus Vance', title: 'Distributed Systems Architect', avatar: 'MV', avatarBg: 'linear-gradient(135deg, #065F46, #10B981)' },
      { id: 'f-3', name: 'dan_abramov', displayName: 'Dan Abramov', title: 'React & Compilers', avatar: 'DA', avatarBg: 'linear-gradient(135deg, #0284C7, #38BDF8)' },
      { id: 'f-4', name: 'david_h', displayName: 'David Heinemeier Hansson', title: 'Creator of Rails', avatar: 'DH', avatarBg: 'linear-gradient(135deg, #DC2626, #F87171)' }
    ],
    followers: [
      { id: 'fol-1', name: 'marcus_v', displayName: 'Marcus Vance', title: 'Distributed Systems Architect', avatar: 'MV', avatarBg: 'linear-gradient(135deg, #065F46, #10B981)' },
      { id: 'fol-2', name: 'priya_dev', displayName: 'Priya Sharma', title: 'Staff Frontend Architect', avatar: 'PS', avatarBg: 'linear-gradient(135deg, #312E81, #4F46E5)' },
      { id: 'fol-3', name: 'sarah_j', displayName: 'Sarah Jenkins', title: 'Full Stack Engineer', avatar: 'SJ', avatarBg: 'linear-gradient(135deg, #831843, #EC4899)' },
      { id: 'fol-4', name: 'alex_systems', displayName: 'Alex Rivera', title: 'Cloud Infrastructure', avatar: 'AR', avatarBg: 'linear-gradient(135deg, #4C1D95, #8B5CF6)' }
    ],
    recentSessions: [
      { snippet: 'Zero-Copy Circular Ring Buffer', language: 'Rust', wpm: 121, accuracy: 99.5, duration: '1m 12s' },
      { snippet: 'Lock-Free MPSC Work Queue', language: 'Rust', wpm: 118, accuracy: 99.2, duration: '2m 04s' },
      { snippet: 'POSIX Shared Memory Allocator', language: 'C++', wpm: 114, accuracy: 98.9, duration: '1m 45s' }
    ],
    badges: ['Century Sprinter (100+ WPM)', 'Clean Typist (99% Acc)', 'Algorithmic Master', '28-Day Streak Master']
  },
  {
    id: 'peer-marcus',
    name: 'marcus_v',
    displayName: 'Marcus Vance',
    title: 'Distributed Systems Architect',
    bio: 'Go and C++ practitioner. Profiling cache line misses, optimizing p99 latencies, and accelerating keystroke cadence.',
    avatar: 'MV',
    avatarBg: 'linear-gradient(135deg, #065F46, #10B981)',
    status: 'Online',
    level: 12,
    xp: 2890,
    streak: 19,
    bestWpm: 115,
    avgWpm: 99,
    sessions: 388,
    precision: 98.7,
    favLang: 'Go',
    joinedDate: 'January 2024',
    githubUrl: 'https://github.com/marcus-vance',
    website: 'https://marcusv.dev',
    mutualCount: 3,
    connectedPeers: [
      { id: 'peer-elena', name: 'elena_rust', displayName: 'Elena Rostova', title: 'Senior Systems Engineer', avatar: 'ER', avatarBg: 'linear-gradient(135deg, #1E3A8A, #3B82F6)', bestWpm: 124, status: 'Online' },
      { id: 'peer-sarah', name: 'sarah_j', displayName: 'Sarah Jenkins', title: 'Full Stack Engineer', avatar: 'SJ', avatarBg: 'linear-gradient(135deg, #831843, #EC4899)', bestWpm: 98, status: 'Online' },
      { id: 'peer-liam', name: 'liam_oc', displayName: 'Liam O\'Connor', title: 'Backend Security Specialist', avatar: 'LO', avatarBg: 'linear-gradient(135deg, #075985, #0284C7)', bestWpm: 102, status: 'Offline' }
    ],
    following: [
      { id: 'f-1', name: 'rob_pike', displayName: 'Rob Pike', title: 'Co-creator of Go & UTF-8', avatar: 'RP', avatarBg: 'linear-gradient(135deg, #0D9488, #2DD4BF)' },
      { id: 'f-2', name: 'elena_rust', displayName: 'Elena Rostova', title: 'Senior Systems Engineer', avatar: 'ER', avatarBg: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' },
      { id: 'f-3', name: 'brian_k', displayName: 'Brian Kernighan', title: 'Computing Pioneer', avatar: 'BK', avatarBg: 'linear-gradient(135deg, #475569, #94A3B8)' }
    ],
    followers: [
      { id: 'fol-1', name: 'elena_rust', displayName: 'Elena Rostova', title: 'Senior Systems Engineer', avatar: 'ER', avatarBg: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' },
      { id: 'fol-2', name: 'sarah_j', displayName: 'Sarah Jenkins', title: 'Full Stack Engineer', avatar: 'SJ', avatarBg: 'linear-gradient(135deg, #831843, #EC4899)' },
      { id: 'fol-3', name: 'liam_oc', displayName: 'Liam O\'Connor', title: 'Backend Security Specialist', avatar: 'LO', avatarBg: 'linear-gradient(135deg, #075985, #0284C7)' }
    ],
    recentSessions: [
      { snippet: 'Raft Consensus Protocol Leader Election', language: 'Go', wpm: 111, accuracy: 98.8, duration: '1m 30s' },
      { snippet: 'Goroutine Worker Pool with Backpressure', language: 'Go', wpm: 108, accuracy: 99.1, duration: '1m 15s' }
    ],
    badges: ['Century Sprinter (100+ WPM)', 'Concurrency Pioneer', 'Consistency King']
  },
  {
    id: 'peer-priya',
    name: 'priya_dev',
    displayName: 'Priya Sharma',
    title: 'Staff Frontend Architect',
    bio: 'Design systems, AST compilers, and ultra-fluid web performance. TypeScript, WebAssembly, and fluid UI interaction lover.',
    avatar: 'PS',
    avatarBg: 'linear-gradient(135deg, #312E81, #4F46E5)',
    status: 'In Practice',
    level: 11,
    xp: 2450,
    streak: 15,
    bestWpm: 108,
    avgWpm: 94,
    sessions: 310,
    precision: 99.1,
    favLang: 'TypeScript',
    joinedDate: 'April 2024',
    githubUrl: 'https://github.com/priya-sharma-ui',
    website: 'https://priyasharma.io',
    mutualCount: 2,
    connectedPeers: [
      { id: 'peer-elena', name: 'elena_rust', displayName: 'Elena Rostova', title: 'Senior Systems Engineer', avatar: 'ER', avatarBg: 'linear-gradient(135deg, #1E3A8A, #3B82F6)', bestWpm: 124, status: 'Online' },
      { id: 'peer-kai', name: 'kaichen_algo', displayName: 'Kai Chen', title: 'Competitive Programmer', avatar: 'KC', avatarBg: 'linear-gradient(135deg, #78350F, #D97706)', bestWpm: 136, status: 'Online' }
    ],
    following: [
      { id: 'f-1', name: 'dan_abramov', displayName: 'Dan Abramov', title: 'React & Compilers', avatar: 'DA', avatarBg: 'linear-gradient(135deg, #0284C7, #38BDF8)' },
      { id: 'f-2', name: 'sophie_alpert', displayName: 'Sophie Alpert', title: 'Frontend Systems Leader', avatar: 'SA', avatarBg: 'linear-gradient(135deg, #EC4899, #F472B6)' },
      { id: 'f-3', name: 'elena_rust', displayName: 'Elena Rostova', title: 'Senior Systems Engineer', avatar: 'ER', avatarBg: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }
    ],
    followers: [
      { id: 'fol-1', name: 'elena_rust', displayName: 'Elena Rostova', title: 'Senior Systems Engineer', avatar: 'ER', avatarBg: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' },
      { id: 'fol-2', name: 'sarah_j', displayName: 'Sarah Jenkins', title: 'Full Stack Engineer', avatar: 'SJ', avatarBg: 'linear-gradient(135deg, #831843, #EC4899)' },
      { id: 'fol-3', name: 'kai_algo', displayName: 'Kai Chen', title: 'Competitive Programmer', avatar: 'KC', avatarBg: 'linear-gradient(135deg, #78350F, #D97706)' }
    ],
    recentSessions: [
      { snippet: 'Virtual DOM Diffing & Reconciliation', language: 'TypeScript', wpm: 104, accuracy: 99.4, duration: '1m 20s' },
      { snippet: 'Deep Object Clone with Type Guards', language: 'TypeScript', wpm: 99, accuracy: 98.9, duration: '0m 55s' }
    ],
    badges: ['Century Sprinter (100+ WPM)', 'Clean Typist (99% Acc)', 'UI Maestro']
  },
  {
    id: 'peer-kai',
    name: 'kaichen_algo',
    displayName: 'Kai Chen',
    title: 'Competitive Programmer & ML',
    bio: 'Grandmaster coder. Specializing in graph algorithms, DP optimization, and high-cadence C++ typing.',
    avatar: 'KC',
    avatarBg: 'linear-gradient(135deg, #78350F, #D97706)',
    status: 'Online',
    level: 16,
    xp: 4150,
    streak: 42,
    bestWpm: 136,
    avgWpm: 121,
    sessions: 680,
    precision: 99.6,
    favLang: 'C++',
    joinedDate: 'November 2023',
    githubUrl: 'https://github.com/kai-chen-algo',
    website: 'https://kaichen.codes',
    mutualCount: 3,
    connectedPeers: [
      { id: 'peer-elena', name: 'elena_rust', displayName: 'Elena Rostova', title: 'Senior Systems Engineer', avatar: 'ER', avatarBg: 'linear-gradient(135deg, #1E3A8A, #3B82F6)', bestWpm: 124, status: 'Online' },
      { id: 'peer-priya', name: 'priya_dev', displayName: 'Priya Sharma', title: 'Staff Frontend Architect', avatar: 'PS', avatarBg: 'linear-gradient(135deg, #312E81, #4F46E5)', bestWpm: 108, status: 'In Practice' }
    ],
    following: [
      { id: 'f-1', name: 'tourist', displayName: 'Gennady Korotkevich', title: 'Competitive Programming Legend', avatar: 'GK', avatarBg: 'linear-gradient(135deg, #B91C1C, #EF4444)' },
      { id: 'f-2', name: 'petr', displayName: 'Petr Mitrichev', title: 'Algorithmist', avatar: 'PM', avatarBg: 'linear-gradient(135deg, #1D4ED8, #3B82F6)' }
    ],
    followers: [
      { id: 'fol-1', name: 'elena_rust', displayName: 'Elena Rostova', title: 'Senior Systems Engineer', avatar: 'ER', avatarBg: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' },
      { id: 'fol-2', name: 'priya_dev', displayName: 'Priya Sharma', title: 'Staff Frontend Architect', avatar: 'PS', avatarBg: 'linear-gradient(135deg, #312E81, #4F46E5)' },
      { id: 'fol-3', name: 'liam_oc', displayName: 'Liam O\'Connor', title: 'Backend Security Specialist', avatar: 'LO', avatarBg: 'linear-gradient(135deg, #075985, #0284C7)' }
    ],
    recentSessions: [
      { snippet: 'Segment Tree with Lazy Propagation', language: 'C++', wpm: 132, accuracy: 99.8, duration: '1m 40s' },
      { snippet: 'Heavy-Light Decomposition on Trees', language: 'C++', wpm: 128, accuracy: 99.4, duration: '2m 10s' }
    ],
    badges: ['Velocity Apex (130+ WPM)', 'Algorithmic Grandmaster', 'Flawless Precision (99.5%+)']
  },
  {
    id: 'peer-sarah',
    name: 'sarah_j',
    displayName: 'Sarah Jenkins',
    title: 'Full Stack Engineer',
    bio: 'Crafting resilient distributed APIs with Python, FastAPI, and Postgres. Focused on code speed and clean syntax rhythms.',
    avatar: 'SJ',
    avatarBg: 'linear-gradient(135deg, #831843, #EC4899)',
    status: 'Online',
    level: 9,
    xp: 1980,
    streak: 11,
    bestWpm: 98,
    avgWpm: 86,
    sessions: 240,
    precision: 97.9,
    favLang: 'Python',
    joinedDate: 'June 2024',
    githubUrl: 'https://github.com/sarah-jenkins',
    website: '',
    mutualCount: 2,
    connectedPeers: [
      { id: 'peer-marcus', name: 'marcus_v', displayName: 'Marcus Vance', title: 'Distributed Systems Architect', avatar: 'MV', avatarBg: 'linear-gradient(135deg, #065F46, #10B981)', bestWpm: 115, status: 'Online' },
      { id: 'peer-liam', name: 'liam_oc', displayName: 'Liam O\'Connor', title: 'Backend Security Specialist', avatar: 'LO', avatarBg: 'linear-gradient(135deg, #075985, #0284C7)', bestWpm: 102, status: 'Offline' }
    ],
    following: [
      { id: 'f-1', name: 'tiangolo', displayName: 'Sebastián Ramírez', title: 'Creator of FastAPI', avatar: 'SR', avatarBg: 'linear-gradient(135deg, #0D9488, #14B8A6)' },
      { id: 'f-2', name: 'marcus_v', displayName: 'Marcus Vance', title: 'Distributed Systems Architect', avatar: 'MV', avatarBg: 'linear-gradient(135deg, #065F46, #10B981)' }
    ],
    followers: [
      { id: 'fol-1', name: 'marcus_v', displayName: 'Marcus Vance', title: 'Distributed Systems Architect', avatar: 'MV', avatarBg: 'linear-gradient(135deg, #065F46, #10B981)' },
      { id: 'fol-2', name: 'elena_rust', displayName: 'Elena Rostova', title: 'Senior Systems Engineer', avatar: 'ER', avatarBg: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }
    ],
    recentSessions: [
      { snippet: 'Async Database Connection Pool Manager', language: 'Python', wpm: 94, accuracy: 98.2, duration: '1m 05s' },
      { snippet: 'Pydantic Model Serialization Decorator', language: 'Python', wpm: 91, accuracy: 97.8, duration: '0m 50s' }
    ],
    badges: ['Speed Sprinter', 'Python Craftsman', 'Rising Talent']
  },
  {
    id: 'peer-liam',
    name: 'liam_oc',
    displayName: 'Liam O\'Connor',
    title: 'Backend Security Specialist',
    bio: 'Java/Kotlin and cryptographic protocols. Precision over brute speed, consistently hitting triple digit velocities.',
    avatar: 'LO',
    avatarBg: 'linear-gradient(135deg, #075985, #0284C7)',
    status: 'Offline',
    level: 10,
    xp: 2120,
    streak: 14,
    bestWpm: 102,
    avgWpm: 89,
    sessions: 275,
    precision: 98.9,
    favLang: 'Java',
    joinedDate: 'May 2024',
    githubUrl: 'https://github.com/liam-oconnor-sec',
    website: '',
    mutualCount: 2,
    connectedPeers: [
      { id: 'peer-marcus', name: 'marcus_v', displayName: 'Marcus Vance', title: 'Distributed Systems Architect', avatar: 'MV', avatarBg: 'linear-gradient(135deg, #065F46, #10B981)', bestWpm: 115, status: 'Online' },
      { id: 'peer-sarah', name: 'sarah_j', displayName: 'Sarah Jenkins', title: 'Full Stack Engineer', avatar: 'SJ', avatarBg: 'linear-gradient(135deg, #831843, #EC4899)', bestWpm: 98, status: 'Online' }
    ],
    following: [
      { id: 'f-1', name: 'marcus_v', displayName: 'Marcus Vance', title: 'Distributed Systems Architect', avatar: 'MV', avatarBg: 'linear-gradient(135deg, #065F46, #10B981)' },
      { id: 'f-2', name: 'elena_rust', displayName: 'Elena Rostova', title: 'Senior Systems Engineer', avatar: 'ER', avatarBg: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }
    ],
    followers: [
      { id: 'fol-1', name: 'marcus_v', displayName: 'Marcus Vance', title: 'Distributed Systems Architect', avatar: 'MV', avatarBg: 'linear-gradient(135deg, #065F46, #10B981)' },
      { id: 'fol-2', name: 'kai_algo', displayName: 'Kai Chen', title: 'Competitive Programmer', avatar: 'KC', avatarBg: 'linear-gradient(135deg, #78350F, #D97706)' }
    ],
    recentSessions: [
      { snippet: 'AES-256 GCM Authenticated Encryption', language: 'Java', wpm: 99, accuracy: 99.1, duration: '1m 24s' },
      { snippet: 'Concurrent Lock-Free SkipList Map', language: 'Java', wpm: 96, accuracy: 98.7, duration: '1m 50s' }
    ],
    badges: ['Century Sprinter (100+ WPM)', 'Security Architect', 'Keystroke Sentinel']
  }
];

/**
 * Searches and synthesizes peer profiles.
 * If user enters a custom handle, synthesizes a complete rich profile for them.
 */
export function searchPeerDirectory(query = '') {
  const clean = query.trim().toLowerCase().replace(/^@/, '');
  if (!clean) return INITIAL_PEER_DIRECTORY;

  const matches = INITIAL_PEER_DIRECTORY.filter(
    (p) =>
      p.name.toLowerCase().includes(clean) ||
      p.displayName.toLowerCase().includes(clean) ||
      p.title.toLowerCase().includes(clean) ||
      p.favLang.toLowerCase().includes(clean)
  );

  // If no direct match in default directory, synthesize a dynamic profile for this handle
  if (matches.length === 0 && clean.length >= 2) {
    const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
    const synthesized = {
      id: `peer-${clean}`,
      name: clean,
      displayName: capitalized,
      title: 'Software Developer',
      bio: `Developer practicing on DevType 2.0. Exploring syntax mastery and cadence optimization.`,
      avatar: clean.slice(0, 2).toUpperCase(),
      avatarBg: 'linear-gradient(135deg, #1E3A8A, #3B82F6)',
      status: 'Online',
      level: Math.floor(Math.random() * 8) + 2,
      xp: 1200,
      streak: Math.floor(Math.random() * 10) + 1,
      bestWpm: Math.floor(Math.random() * 40) + 75,
      avgWpm: Math.floor(Math.random() * 30) + 65,
      sessions: Math.floor(Math.random() * 150) + 20,
      precision: 98.5,
      favLang: 'TypeScript',
      joinedDate: 'Recent Developer',
      githubUrl: `https://github.com/${clean}`,
      website: '',
      mutualCount: 1,
      connectedPeers: [
        INITIAL_PEER_DIRECTORY[0],
        INITIAL_PEER_DIRECTORY[1]
      ],
      following: [INITIAL_PEER_DIRECTORY[0]],
      followers: [INITIAL_PEER_DIRECTORY[1]],
      recentSessions: [
        { snippet: 'Fibonacci Sequence Generator', language: 'TypeScript', wpm: 82, accuracy: 98.5, duration: '0m 45s' }
      ],
      badges: ['DevType Novice', 'Active Practitioner']
    };
    return [synthesized];
  }

  return matches;
}

/**
 * Retrieves the full profile of a peer by id or handle.
 */
export function getPeerFullProfile(peerIdOrHandle) {
  if (!peerIdOrHandle) return null;
  const target = String(peerIdOrHandle).toLowerCase().replace(/^@/, '');
  const found = INITIAL_PEER_DIRECTORY.find(
    (p) => p.id === target || p.name.toLowerCase() === target
  );
  if (found) return found;

  // Synthesize for handle
  const clean = target;
  const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
  return {
    id: `peer-${clean}`,
    name: clean,
    displayName: capitalized,
    title: 'Software Developer',
    bio: `Active coder on DevType 2.0. Sharpening muscle memory across algorithms and modern syntax.`,
    avatar: clean.slice(0, 2).toUpperCase(),
    avatarBg: 'linear-gradient(135deg, #1E3A8A, #3B82F6)',
    status: 'Online',
    level: 5,
    xp: 950,
    streak: 4,
    bestWpm: 88,
    avgWpm: 76,
    sessions: 45,
    precision: 98.2,
    favLang: 'Code',
    joinedDate: 'Recent Developer',
    githubUrl: `https://github.com/${clean}`,
    website: '',
    mutualCount: 1,
    connectedPeers: [INITIAL_PEER_DIRECTORY[0], INITIAL_PEER_DIRECTORY[2]],
    following: [INITIAL_PEER_DIRECTORY[0]],
    followers: [INITIAL_PEER_DIRECTORY[1]],
    recentSessions: [
      { snippet: 'Array Quick Sort Partitioning', language: 'JavaScript', wpm: 86, accuracy: 98.0, duration: '1m 02s' }
    ],
    badges: ['DevType Novice', 'Active Typist']
  };
}
