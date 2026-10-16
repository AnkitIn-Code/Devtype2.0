// src/services/multiplayerService.js
/**
 * Typed service interfaces and simulation layer for CodeType Multiplayer.
 * Designed with an explicit separation between mock data and actual WebSocket contracts,
 * making future backend integration (e.g. Socket.io / native WS) a drop-in replacement.
 */

/* ================================================================
   SEVEN CORE MULTIPLAYER GAME MODES
   ================================================================ */
export const MULTIPLAYER_MODES = [
  {
    id: 'classic',
    title: 'Classic Race',
    tagline: 'Pure typing sprint',
    description: 'Simultaneous heads-up code typing sprint. First developer to finish all syntactically correct lines wins.',
    playerRange: '2–8 Players',
    badge: 'Popular',
    iconName: 'Flag',
    color: '#2563EB',
    tone: 'cobalt',
  },
  {
    id: 'duel',
    title: '1v1 Ranked Duel',
    tagline: 'Competitive ELO match',
    description: 'High-stakes head-to-head duel with strict accuracy penalties and competitive ranked rating adjustments.',
    playerRange: '2 Players',
    badge: 'Ranked',
    iconName: 'Swords',
    color: '#E11D48',
    tone: 'rose',
  },
  {
    id: 'battle-royale',
    title: 'Battle Royale',
    tagline: 'Checkpoint elimination',
    description: 'Massive developer arena where the lowest 20% velocity percentiles are eliminated at syntax checkpoints.',
    playerRange: '8–32 Players',
    badge: 'Survival',
    iconName: 'Crown',
    color: '#D97706',
    tone: 'amber',
  },
  {
    id: 'relay',
    title: 'Relay Race',
    tagline: 'Cooperative team passing',
    description: 'Squad vs squad relay. Each teammate types a discrete module or function before handing off the cursor baton.',
    playerRange: '4–8 Players (2v2 / 4v4)',
    badge: 'Team',
    iconName: 'Users',
    color: '#059669',
    tone: 'emerald',
  },
  {
    id: 'ghost',
    title: 'Ghost Race',
    tagline: 'Asynchronous pace car',
    description: 'Race synchronously against recorded telemetry of your Personal Best or global leaderboard benchmarks.',
    playerRange: '1–4 Players',
    badge: 'Time Attack',
    iconName: 'Ghost',
    color: '#7C3AED',
    tone: 'purple',
  },
  {
    id: 'boss-fight',
    title: 'Boss Fight',
    tagline: 'Co-op damage sprint',
    description: 'Cooperative raid where aggregate team WPM and accuracy inflict real-time damage against an automated boss entity.',
    playerRange: '3–6 Players',
    badge: 'Raid Co-op',
    iconName: 'ShieldAlert',
    color: '#DC2626',
    tone: 'rose',
  },
  {
    id: 'bug-fix',
    title: 'Bug Fix Race',
    tagline: 'Identify and patch code',
    description: 'Inspect intentional syntax bugs, logic errors, and anti-patterns, then type the correct patch under time pressure.',
    playerRange: '2–6 Players',
    badge: 'Debug Sprint',
    iconName: 'Bug',
    color: '#0284C7',
    tone: 'blue',
  },
];

/* ================================================================
   OPEN LOBBY DEMO DATASET
   (Deterministic live simulation, explicitly labeled as benchmark bots)
   ================================================================ */
export const INITIAL_OPEN_ROOMS = [
  {
    id: 'room-cpp-sprint',
    code: 'DEV-8412',
    name: 'C++ Systems Sprint',
    modeId: 'classic',
    modeName: 'Classic Race',
    host: 'alex_dev (Host)',
    language: 'C++',
    difficulty: 'Intermediate',
    currentPlayers: 3,
    maxPlayers: 6,
    ping: '24ms',
    status: 'Waiting',
  },
  {
    id: 'room-py-duel',
    code: 'DEV-3920',
    name: 'FastAPI Duel 1v1',
    modeId: 'duel',
    modeName: '1v1 Ranked Duel',
    host: 'sarah_codes (Host)',
    language: 'Python',
    difficulty: 'Advanced',
    currentPlayers: 1,
    maxPlayers: 2,
    ping: '18ms',
    status: 'Waiting',
  },
  {
    id: 'room-br-arena',
    code: 'DEV-7714',
    name: 'Frontend Royale: TS Hooks',
    modeId: 'battle-royale',
    modeName: 'Battle Royale',
    host: 'marcus_fe (Host)',
    language: 'TypeScript',
    difficulty: 'Intermediate',
    currentPlayers: 7,
    maxPlayers: 16,
    ping: '32ms',
    status: 'Waiting',
  },
  {
    id: 'room-go-boss',
    code: 'DEV-5192',
    name: 'Goroutines Raid Boss',
    modeId: 'boss-fight',
    modeName: 'Boss Fight',
    host: 'elena_systems (Host)',
    language: 'Go',
    difficulty: 'Advanced',
    currentPlayers: 4,
    maxPlayers: 5,
    ping: '28ms',
    status: 'Waiting',
  },
];

/* ================================================================
   RECENT MATCHES HISTORY
   ================================================================ */
export const RECENT_MATCHES_HISTORY = [
  {
    id: 'match-101',
    mode: 'Classic Race',
    date: 'Today, 1:15 PM',
    snippetTitle: 'LRU Cache Eviction',
    language: 'C++',
    place: 1,
    totalPlayers: 4,
    wpm: 66,
    accuracy: 98.4,
    xpEarned: 120,
    opponents: ['Benchmark Bot (61 WPM)', 'Racer Echo (58 WPM)', 'Dev Alpha (52 WPM)'],
  },
  {
    id: 'match-102',
    mode: '1v1 Ranked Duel',
    date: 'Yesterday, 6:40 PM',
    snippetTitle: 'Two Sum Hash Map',
    language: 'Python',
    place: 1,
    totalPlayers: 2,
    wpm: 71,
    accuracy: 99.1,
    xpEarned: 150,
    opponents: ['Ranked Rival [Bot] (64 WPM)'],
  },
  {
    id: 'match-103',
    mode: 'Battle Royale',
    date: 'Oct 14, 2026',
    snippetTitle: 'Typed Event Emitter',
    language: 'TypeScript',
    place: 3,
    totalPlayers: 12,
    wpm: 62,
    accuracy: 96.0,
    xpEarned: 85,
    opponents: ['CodeNinja (69 WPM)', 'ByteMaster (65 WPM)'],
  },
  {
    id: 'match-104',
    mode: 'Boss Fight',
    date: 'Oct 13, 2026',
    snippetTitle: 'Concurrent Worker Pool',
    language: 'Go',
    place: 1,
    totalPlayers: 4,
    wpm: 58,
    accuracy: 97.2,
    xpEarned: 200,
    opponents: ['Boss Defeated in 1m 42s'],
  },
];

/* ================================================================
   SAMPLE REFERENCE SNIPPETS FOR MULTIPLAYER
   ================================================================ */
export const MULTIPLAYER_SNIPPETS = {
  'C++': {
    title: 'LRU Cache Implementation',
    difficulty: 'Intermediate',
    code: `template <typename K, typename V>
class LRUCache {
    size_t capacity;
    std::list<std::pair<K, V>> items;
    std::unordered_map<K, typename std::list<std::pair<K, V>>::iterator> map;

public:
    explicit LRUCache(size_t cap) : capacity(cap) {}

    std::optional<V> get(const K& key) {
        auto it = map.find(key);
        if (it == map.end()) return std::nullopt;
        items.splice(items.begin(), items, it->second);
        return it->second->second;
    }
};`,
  },
  Python: {
    title: 'Two Sum Hash Map',
    difficulty: 'Beginner',
    code: `def two_sum(nums: list[int], target: int) -> list[int]:
    lookup = {}
    for idx, num in enumerate(nums):
        diff = target - num
        if diff in lookup:
            return [lookup[diff], idx]
        lookup[num] = idx
    return []`,
  },
  TypeScript: {
    title: 'Typed Event Emitter',
    difficulty: 'Intermediate',
    code: `class TypedEventEmitter<Events extends Record<string, any>> {
  private handlers = new Map<keyof Events, Set<Function>>();

  on<K extends keyof Events>(event: K, handler: (data: Events[K]) => void) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }
}`,
  },
  JavaScript: {
    title: 'Debounce with Immediate Option',
    difficulty: 'Intermediate',
    code: `function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}`,
  },
  Go: {
    title: 'Concurrent Worker Pool',
    difficulty: 'Advanced',
    code: `func RunPool(workers int, jobs <-chan int, results chan<- int) {
    var wg sync.WaitGroup
    for w := 0; w < workers; w++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for j := range jobs {
                results <- j * 2
            }
        }()
    }
    wg.Wait()
}`,
  },
  Rust: {
    title: 'In-Place QuickSort',
    difficulty: 'Advanced',
    code: `pub fn quicksort<T: Ord>(arr: &mut [T]) {
    if arr.len() <= 1 { return; }
    let pivot = partition(arr);
    let (left, right) = arr.split_at_mut(pivot);
    quicksort(left);
    quicksort(&mut right[1..]);
}`,
  },
  SQL: {
    title: 'Running Total Window Function',
    difficulty: 'Intermediate',
    code: `SELECT
    order_date,
    amount,
    SUM(amount) OVER (
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total
FROM sales_records;`,
  },
};

/* ================================================================
   WEBSOCKET INTERFACE CONTRACT DEFINITIONS
   ================================================================ */
/**
 * Standard WebSocket message packet structure.
 * @typedef {Object} WsPacket
 * @property {'JOIN_ROOM' | 'LEAVE_ROOM' | 'READY_TOGGLE' | 'START_COUNTDOWN' | 'PROGRESS_UPDATE' | 'FINISH_RACE' | 'ROOM_STATE'} type
 * @property {string} roomId
 * @property {string} senderId
 * @property {any} payload
 */

/**
 * Service implementation layer.
 * Frontend prototype uses MockMultiplayerService, keeping full structural fidelity.
 */
class MockMultiplayerService {
  constructor() {
    this.rooms = [...INITIAL_OPEN_ROOMS];
    this.listeners = new Map();
  }

  // Generate clean room code
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'DEV-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Get active rooms
  getOpenRooms() {
    return [...this.rooms];
  }

  // Create room
  createRoom({ name, modeId, language, difficulty, maxPlayers = 4, isPrivate = false }) {
    const mode = MULTIPLAYER_MODES.find((m) => m.id === modeId) || MULTIPLAYER_MODES[0];
    const code = this.generateRoomCode();
    const newRoom = {
      id: `room-${Date.now()}`,
      code,
      name: name?.trim() || `${language} ${mode.title}`,
      modeId: mode.id,
      modeName: mode.title,
      host: 'You (Host)',
      language,
      difficulty,
      currentPlayers: 1,
      maxPlayers: Number(maxPlayers) || 4,
      ping: '15ms',
      status: 'Waiting',
      isPrivate,
      participants: [
        {
          id: 'player-me',
          name: 'You (Host)',
          isHost: true,
          isReady: true,
          isHuman: true,
          wpm: 0,
          progress: 0,
          rank: 1,
        },
        {
          id: 'bot-1',
          name: 'Apex_Bot [Benchmark Bot]',
          isHost: false,
          isReady: true,
          isHuman: false,
          targetWpm: 64,
          wpm: 0,
          progress: 0,
          rank: 2,
        },
        {
          id: 'bot-2',
          name: 'Nexus_Bot [Benchmark Bot]',
          isHost: false,
          isReady: false,
          isHuman: false,
          targetWpm: 56,
          wpm: 0,
          progress: 0,
          rank: 3,
        },
      ],
    };

    this.rooms.unshift(newRoom);
    return newRoom;
  }

  // Join room by ID or code
  joinRoom(roomIdOrCode) {
    const found = this.rooms.find(
      (r) => r.id === roomIdOrCode || r.code.toUpperCase() === roomIdOrCode.toUpperCase()
    );
    if (!found) {
      // Fallback: create mock room for this code
      return {
        id: `room-${Date.now()}`,
        code: roomIdOrCode.toUpperCase(),
        name: `Room ${roomIdOrCode}`,
        modeId: 'classic',
        modeName: 'Classic Race',
        host: 'Host Developer',
        language: 'C++',
        difficulty: 'Intermediate',
        currentPlayers: 2,
        maxPlayers: 4,
        ping: '22ms',
        status: 'Waiting',
        participants: [
          {
            id: 'player-host',
            name: 'Room Host [Benchmark Bot]',
            isHost: true,
            isReady: true,
            isHuman: false,
            targetWpm: 60,
            wpm: 0,
            progress: 0,
            rank: 1,
          },
          {
            id: 'player-me',
            name: 'You (Player)',
            isHost: false,
            isReady: false,
            isHuman: true,
            wpm: 0,
            progress: 0,
            rank: 2,
          },
        ],
      };
    }

    // Clone and ensure "You" are included
    const roomCopy = JSON.parse(JSON.stringify(found));
    if (!roomCopy.participants) {
      roomCopy.participants = [
        {
          id: 'player-host',
          name: `${roomCopy.host} [Bot]`,
          isHost: true,
          isReady: true,
          isHuman: false,
          targetWpm: 62,
          wpm: 0,
          progress: 0,
          rank: 1,
        },
        {
          id: 'player-me',
          name: 'You (Player)',
          isHost: false,
          isReady: false,
          isHuman: true,
          wpm: 0,
          progress: 0,
          rank: 2,
        },
      ];
    }
    return roomCopy;
  }
}

export const multiplayerService = new MockMultiplayerService();
