// src/services/multiplayerService.js
/**
 * Typed service interfaces and simulation layer for CodeType Multiplayer.
 * Designed with an explicit separation between mock data and actual WebSocket contracts,
 * making future backend integration (e.g. Socket.io / native WS) a drop-in replacement.
 */

/* ================================================================
   MULTIPLAYER GAME MODES (RANKED & UNRANKED)
   ================================================================ */
export const MULTIPLAYER_MODES = [
  // ── Ranked Section (Competitive ELO Stakes) ──
  {
    id: 'classic',
    title: 'Classic Race',
    section: 'ranked',
    tagline: '4-Player Ranked Sprint',
    description: 'Simultaneous 4-player code typing race. Finish in the top 2 to increase your ELO rating; lower positions lose points.',
    playerRange: '4 Players',
    badge: 'Ranked',
    stakes: '+20 to +32 ELO on Win',
    iconName: 'Flag',
    color: '#2563EB',
    tone: 'cobalt',
  },
  {
    id: 'duel',
    title: '1v1 Battle',
    section: 'ranked',
    tagline: 'Direct Ranked Duel',
    description: 'High-stakes head-to-head duel. Out-type your opponent in speed and precision to seize maximum ELO points.',
    playerRange: '2 Players',
    badge: 'High Stakes',
    stakes: 'Winner Takes All ELO',
    iconName: 'Swords',
    color: '#E11D48',
    tone: 'rose',
  },
  // ── Unranked Section (No Rating Impact) ──
  {
    id: 'bug-fix',
    title: 'Bug Fix Race',
    section: 'unranked',
    tagline: 'Spot & Patch Code Sprint',
    description: 'Inspect intentional syntax bugs, logic errors, and anti-patterns, then type the correct patch under casual unranked conditions.',
    playerRange: '2–6 Players',
    badge: 'Casual',
    stakes: 'No Rating Impact',
    iconName: 'Bug',
    color: '#0284C7',
    tone: 'blue',
  },
  {
    id: 'private-room',
    title: 'Private Room',
    section: 'unranked',
    tagline: 'Custom Room with Friends',
    description: 'Create or join a private room with a Room ID to race with friends without touching your competitive ELO rating.',
    playerRange: '2–8 Players',
    badge: 'Private',
    stakes: 'Casual Friends',
    iconName: 'Users',
    color: '#10B981',
    tone: 'emerald',
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
    name: '1v1 Battle: Algorithms',
    modeId: 'duel',
    modeName: '1v1 Battle',
    host: 'sarah_codes (Host)',
    language: 'Python',
    difficulty: 'Advanced',
    currentPlayers: 1,
    maxPlayers: 2,
    ping: '18ms',
    status: 'Waiting',
  },
  {
    id: 'room-bug-fix',
    code: 'DEV-7714',
    name: 'Bug Fix: React Hooks',
    modeId: 'bug-fix',
    modeName: 'Bug Fix Race',
    host: 'marcus_fe (Host)',
    language: 'TypeScript',
    difficulty: 'Intermediate',
    currentPlayers: 2,
    maxPlayers: 4,
    ping: '22ms',
    status: 'Waiting',
  },
  {
    id: 'room-private-demo',
    code: 'DEV-5192',
    name: 'Private Room (Code: DEV-5192)',
    modeId: 'private-room',
    modeName: 'Private Room',
    host: 'elena_systems (Host)',
    language: 'Go',
    difficulty: 'Advanced',
    currentPlayers: 1,
    maxPlayers: 4,
    ping: '25ms',
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
