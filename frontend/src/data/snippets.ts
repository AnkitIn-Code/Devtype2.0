// src/data/snippets.ts

export interface CodeSnippet {
  id: string;
  title: string;
  fileName?: string;
  language: 'C++' | 'Python' | 'JavaScript' | 'TypeScript' | 'Java' | 'Rust' | 'Go' | 'SQL';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category?: 'Data Structures' | 'Algorithms' | 'Concurrency' | 'Web & Async' | 'SQL & Analytics' | 'Custom';
  description: string;
  xp: number;
  code: string;
  popularity?: number;
  createdAt?: string;
  tags?: string[];
  isSpotlight?: boolean;
}

export const CATEGORIES = [
  'All Collections',
  'Data Structures',
  'Algorithms',
  'Concurrency',
  'Web & Async',
  'SQL & Analytics',
] as const;

export const SNIPPETS: CodeSnippet[] = [
  // ── C++ ──
  {
    id: 'cpp-lru-cache',
    title: 'LRU Cache Implementation',
    fileName: 'lru_cache.cpp',
    language: 'C++',
    difficulty: 'Intermediate',
    category: 'Data Structures',
    description: 'Doubly linked list and hash map for O(1) get and put operations. High-frequency interview benchmark.',
    xp: 50,
    popularity: 98,
    createdAt: '2026-09-01',
    isSpotlight: true,
    tags: ['O(1)', 'Doubly Linked List', 'Hash Map'],
    code: `class LRUCache {
private:
    int cap;
    list<pair<int, int>> cache;
    unordered_map<int, list<pair<int, int>>::iterator> map;

public:
    LRUCache(int capacity) : cap(capacity) {}

    int get(int key) {
        if (map.find(key) == map.end()) return -1;
        cache.splice(cache.begin(), cache, map[key]);
        return map[key]->second;
    }

    void put(int key, int value) {
        if (map.find(key) != map.end()) {
            map[key]->second = value;
            cache.splice(cache.begin(), cache, map[key]);
            return;
        }
        if (cache.size() == cap) {
            map.erase(cache.back().first);
            cache.pop_back();
        }
        cache.push_front({key, value});
        map[key] = cache.begin();
    }
};`,
  },
  {
    id: 'cpp-binary-search',
    title: 'Binary Search Algorithm',
    fileName: 'binary_search.cpp',
    language: 'C++',
    difficulty: 'Beginner',
    category: 'Algorithms',
    description: 'Find target element index in a sorted vector in logarithmic O(log N) time.',
    xp: 30,
    popularity: 95,
    createdAt: '2026-08-15',
    tags: ['Binary Search', 'Logarithmic Time', 'Pointers'],
    code: `int binarySearch(const vector<int>& nums, int target) {
    int left = 0;
    int right = nums.size() - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}`,
  },
  {
    id: 'cpp-graph-bfs',
    title: 'Breadth-First Search (BFS)',
    fileName: 'graph_bfs.cpp',
    language: 'C++',
    difficulty: 'Advanced',
    category: 'Algorithms',
    description: 'Level-order graph traversal with queue and visited tracker.',
    xp: 75,
    popularity: 88,
    createdAt: '2026-09-05',
    tags: ['Graph', 'Queue', 'BFS Traversal'],
    code: `vector<int> bfs(int start, const vector<vector<int>>& adj) {
    vector<bool> visited(adj.size(), false);
    queue<int> q;
    vector<int> order;

    visited[start] = true;
    q.push(start);

    while (!q.empty()) {
        int node = q.front();
        q.pop();
        order.push_back(node);

        for (int neighbor : adj[node]) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                q.push(neighbor);
            }
        }
    }
    return order;
}`,
  },

  // ── Python ──
  {
    id: 'py-two-sum',
    title: 'Two Sum Hash Map',
    fileName: 'two_sum.py',
    language: 'Python',
    difficulty: 'Beginner',
    category: 'Data Structures',
    description: 'Find two indices that sum up to target in O(N) linear time using single-pass hash map.',
    xp: 30,
    popularity: 99,
    createdAt: '2026-08-10',
    tags: ['Hash Map', 'Array Lookup', 'O(N)'],
    code: `def two_sum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
  },
  {
    id: 'py-merge-intervals',
    title: 'Merge Overlapping Intervals',
    fileName: 'merge_intervals.py',
    language: 'Python',
    difficulty: 'Intermediate',
    category: 'Algorithms',
    description: 'Sort intervals and merge overlapping ranges cleanly into unified spans.',
    xp: 50,
    popularity: 91,
    createdAt: '2026-08-28',
    tags: ['Intervals', 'Greedy', 'Sorting'],
    code: `def merge_intervals(intervals: list[list[int]]) -> list[list[int]]:
    if not intervals:
        return []
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]

    for current in intervals[1:]:
        prev = merged[-1]
        if current[0] <= prev[1]:
            prev[1] = max(prev[1], current[1])
        else:
            merged.append(current)

    return merged`,
  },
  {
    id: 'py-trie',
    title: 'Prefix Tree (Trie)',
    fileName: 'prefix_trie.py',
    language: 'Python',
    difficulty: 'Advanced',
    category: 'Data Structures',
    description: 'Efficient string dictionary structure with fast insert and prefix search.',
    xp: 75,
    popularity: 90,
    createdAt: '2026-09-15',
    tags: ['Trie', 'Prefix Search', 'Tree'],
    code: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end = True

    def search(self, word: str) -> bool:
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_end`,
  },

  // ── JavaScript / TypeScript ──
  {
    id: 'js-debounce',
    title: 'Debounce with Immediate Option',
    fileName: 'debounce.js',
    language: 'JavaScript',
    difficulty: 'Intermediate',
    category: 'Web & Async',
    description: 'Delay execution of a callback until inactivity period passes.',
    xp: 45,
    popularity: 93,
    createdAt: '2026-09-02',
    tags: ['Debounce', 'Closures', 'Async Timers'],
    code: `function debounce(fn, delay = 300) {
  let timerId = null;

  return function (...args) {
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      fn.apply(this, args);
      timerId = null;
    }, delay);
  };
}`,
  },
  {
    id: 'ts-event-emitter',
    title: 'Typed Event Emitter',
    fileName: 'event_emitter.ts',
    language: 'TypeScript',
    difficulty: 'Advanced',
    category: 'Web & Async',
    description: 'Type-safe event dispatcher supporting subscribe, unsubscribe, and typed payloads.',
    xp: 70,
    popularity: 87,
    createdAt: '2026-09-20',
    tags: ['Generics', 'PubSub', 'Type Safe'],
    code: `type Listener<T> = (data: T) => void;

export class TypedEmitter<EventMap extends Record<string, any>> {
  private events: { [K in keyof EventMap]?: Listener<EventMap[K]>[] } = {};

  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): () => void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event]!.push(listener);
    return () => this.off(event, listener);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const list = this.events[event];
    if (list) {
      list.forEach((cb) => cb(payload));
    }
  }

  off<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void {
    const list = this.events[event];
    if (list) {
      this.events[event] = list.filter((l) => l !== listener);
    }
  }
}`,
  },

  // ── Rust ──
  {
    id: 'rs-quicksort',
    title: 'In-Place QuickSort',
    fileName: 'quicksort.rs',
    language: 'Rust',
    difficulty: 'Intermediate',
    category: 'Algorithms',
    description: 'Recursive in-place array partitioning algorithm with memory safety.',
    xp: 60,
    popularity: 92,
    createdAt: '2026-09-10',
    tags: ['In-Place', 'Partitioning', 'Recursion'],
    code: `pub fn quick_sort<T: Ord>(slice: &mut [T]) {
    if slice.len() <= 1 {
        return;
    }
    let pivot_idx = partition(slice);
    let (left, right) = slice.split_at_mut(pivot_idx);
    quick_sort(left);
    quick_sort(&mut right[1..]);
}

fn partition<T: Ord>(slice: &mut [T]) -> usize {
    let len = slice.len();
    let pivot_idx = len - 1;
    let mut i = 0;
    for j in 0..pivot_idx {
        if slice[j] <= slice[pivot_idx] {
            slice.swap(i, j);
            i += 1;
        }
    }
    slice.swap(i, pivot_idx);
    i
}`,
  },

  // ── Go ──
  {
    id: 'go-worker-pool',
    title: 'Concurrent Worker Pool',
    fileName: 'worker_pool.go',
    language: 'Go',
    difficulty: 'Intermediate',
    category: 'Concurrency',
    description: 'Process buffered jobs concurrently with Goroutines, buffered channels, and WaitGroup.',
    xp: 55,
    popularity: 96,
    createdAt: '2026-09-14',
    tags: ['Goroutines', 'Channels', 'WaitGroup'],
    code: `package main

import (
    "fmt"
    "sync"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for job := range jobs {
        results <- job * 2
    }
}

func RunPool(jobList []int, numWorkers int) []int {
    jobs := make(chan int, len(jobList))
    results := make(chan int, len(jobList))
    var wg sync.WaitGroup

    for w := 1; w <= numWorkers; w++ {
        wg.Add(1)
        go worker(w, jobs, results, &wg)
    }

    for _, j := range jobList {
        jobs <- j
    }
    close(jobs)
    wg.Wait()
    close(results)

    var output []int
    for r := range results {
        output = append(output, r)
    }
    return output
}`,
  },

  // ── Java ──
  {
    id: 'java-memo-fib',
    title: 'Memoized Fibonacci Calculation',
    fileName: 'Fibonacci.java',
    language: 'Java',
    difficulty: 'Beginner',
    category: 'Algorithms',
    description: 'Dynamic programming top-down memoization avoiding redundant branch calculations.',
    xp: 35,
    popularity: 94,
    createdAt: '2026-09-12',
    tags: ['DP', 'Memoization', 'Recursion'],
    code: `public class Fibonacci {
    private static final Map<Integer, Long> memo = new HashMap<>();

    public static long fib(int n) {
        if (n <= 1) return n;
        if (memo.containsKey(n)) {
            return memo.get(n);
        }
        long result = fib(n - 1) + fib(n - 2);
        memo.put(n, result);
        return result;
    }
}`,
  },

  // ── SQL ──
  {
    id: 'sql-window-running-total',
    title: 'Running Total & Window Functions',
    fileName: 'monthly_revenue.sql',
    language: 'SQL',
    difficulty: 'Intermediate',
    category: 'SQL & Analytics',
    description: 'Calculate cumulative revenue and month-over-month lag using analytical window OVER().',
    xp: 45,
    popularity: 89,
    createdAt: '2026-09-18',
    tags: ['Window Functions', 'Running Total', 'LAG'],
    code: `WITH MonthlySales AS (
    SELECT
        DATE_TRUNC('month', order_date) AS sale_month,
        SUM(amount) AS monthly_revenue
    FROM orders
    WHERE status = 'completed'
    GROUP BY 1
)
SELECT
    sale_month,
    monthly_revenue,
    SUM(monthly_revenue) OVER (ORDER BY sale_month) AS running_total,
    LAG(monthly_revenue, 1) OVER (ORDER BY sale_month) AS prev_month_rev
FROM MonthlySales
ORDER BY sale_month DESC;`,
  },
];

export const LANGUAGES = ['All', 'C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'SQL', 'Rust', 'Go'] as const;
export const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const;
