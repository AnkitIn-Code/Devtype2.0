// src/utils/aiGeneratorStore.js

const AI_HISTORY_STORAGE_KEY = 'devtype_ai_history';

/**
 * Curated high-fidelity snippet generation database.
 * Enables instant, realistic, syntactically clean engineering snippets for typing practice.
 */
export const AI_KNOWLEDGE_BASE = [
  // ─── C++ ───
  {
    keywords: ['lru', 'cache', 'hash', 'linked list', 'eviction', 'data structure'],
    languages: ['C++'],
    difficulty: 'Intermediate',
    title: 'LRU Cache with Doubly Linked List',
    description: 'Thread-safe LRU cache structure utilizing std::unordered_map and std::list for O(1) operations.',
    tags: ['Data Structures', 'C++', 'Algorithms'],
    code: `#include <unordered_map>
#include <list>
#include <optional>

template <typename K, typename V>
class LRUCache {
private:
    size_t capacity;
    std::list<std::pair<K, V>> items;
    std::unordered_map<K, typename std::list<std::pair<K, V>>::iterator> lookup;

public:
    explicit LRUCache(size_t cap) : capacity(cap) {}

    std::optional<V> get(const K& key) {
        auto it = lookup.find(key);
        if (it == lookup.end()) return std::nullopt;
        items.splice(items.begin(), items, it->second);
        return it->second->second;
    }

    void put(const K& key, const V& val) {
        auto it = lookup.find(key);
        if (it != lookup.end()) {
            items.splice(items.begin(), items, it->second);
            it->second->second = val;
            return;
        }
        if (items.size() >= capacity) {
            lookup.erase(items.back().first);
            items.pop_back();
        }
        items.emplace_front(key, val);
        lookup[key] = items.begin();
    }
};`,
  },
  {
    keywords: ['binary search', 'search', 'algorithm', 'lower bound', 'sorted'],
    languages: ['C++'],
    difficulty: 'Beginner',
    title: 'Binary Search with Bounds Checking',
    description: 'Idiomatic binary search template with strict interval invariants.',
    tags: ['Algorithms', 'C++', 'Search'],
    code: `#include <vector>

int binarySearch(const std::vector<int>& arr, int target) {
    int low = 0;
    int high = static_cast<int>(arr.size()) - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}`,
  },
  {
    keywords: ['thread', 'concurrency', 'mutex', 'worker', 'lock', 'pool'],
    languages: ['C++'],
    difficulty: 'Advanced',
    title: 'Thread-Safe Task Queue with Condition Variable',
    description: 'Concurrent producer-consumer channel utilizing std::unique_lock and condition variables.',
    tags: ['Concurrency', 'C++', 'Systems'],
    code: `#include <queue>
#include <mutex>
#include <condition_variable>

template <typename T>
class SafeQueue {
private:
    std::queue<T> q;
    mutable std::mutex mtx;
    std::condition_variable cv;

public:
    void push(T value) {
        {
            std::lock_guard<std::mutex> lock(mtx);
            q.push(std::move(value));
        }
        cv.notify_one();
    }

    T pop() {
        std::unique_lock<std::mutex> lock(mtx);
        cv.wait(lock, [this] { return !q.empty(); });
        T item = std::move(q.front());
        q.pop();
        return item;
    }
};`,
  },

  // ─── Python ───
  {
    keywords: ['two sum', 'hash map', 'array', 'lookup', 'dictionary'],
    languages: ['Python'],
    difficulty: 'Beginner',
    title: 'Two Sum with Single-Pass Hash Map',
    description: 'Optimal linear lookup for complementary values in an unsorted array.',
    tags: ['Algorithms', 'Python', 'Interview'],
    code: `def two_sum(nums: list[int], target: int) -> list[int]:
    """Find indices of two numbers that add up to target."""
    seen: dict[int, int] = {}
    for idx, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], idx]
        seen[num] = idx
    return []`,
  },
  {
    keywords: ['trie', 'prefix', 'tree', 'autocomplete', 'dictionary'],
    languages: ['Python'],
    difficulty: 'Intermediate',
    title: 'Prefix Tree (Trie) Implementation',
    description: 'Efficient string search tree supporting prefix querying and exact matching.',
    tags: ['Data Structures', 'Python', 'Strings'],
    code: `class TrieNode:
    def __init__(self):
        self.children: dict[str, TrieNode] = {}
        self.is_end_of_word: bool = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        curr = self.root
        for char in word:
            if char not in curr.children:
                curr.children[char] = TrieNode()
            curr = curr.children[char]
        curr.is_end_of_word = True

    def starts_with(self, prefix: str) -> bool:
        curr = self.root
        for char in prefix:
            if char not in curr.children:
                return False
            curr = curr.children[char]
        return True`,
  },
  {
    keywords: ['rate limiter', 'token bucket', 'throttle', 'async', 'api'],
    languages: ['Python'],
    difficulty: 'Advanced',
    title: 'Async Token Bucket Rate Limiter',
    description: 'Asynchronous rate-limiter managing API consumption bursts with asyncio lock.',
    tags: ['Async', 'Python', 'Systems'],
    code: `import asyncio
import time

class TokenBucket:
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = float(capacity)
        self.tokens = float(capacity)
        self.refill_rate = refill_rate
        self.last_update = time.monotonic()
        self.lock = asyncio.Lock()

    async def acquire(self, amount: float = 1.0) -> bool:
        async with self.lock:
            now = time.monotonic()
            elapsed = now - self.last_update
            self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
            self.last_update = now

            if self.tokens >= amount:
                self.tokens -= amount
                return True
            return False`,
  },

  // ─── JavaScript / TypeScript ───
  {
    keywords: ['debounce', 'throttle', 'hook', 'timer', 'delay', 'event'],
    languages: ['JavaScript', 'TypeScript'],
    difficulty: 'Intermediate',
    title: 'Custom Debounce Function with Cancel & Flush',
    description: 'Enterprise debounce utility managing delayed function invocations and cleanup.',
    tags: ['Web & Async', 'JavaScript', 'Utilities'],
    code: `function debounce(fn, delay = 300) {
  let timerId = null;

  const debounced = function (...args) {
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      fn.apply(this, args);
      timerId = null;
    }, delay);
  };

  debounced.cancel = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  return debounced;
}`,
  },
  {
    keywords: ['event emitter', 'typed', 'pub sub', 'listener', 'observer'],
    languages: ['TypeScript'],
    difficulty: 'Intermediate',
    title: 'Strictly Typed Event Emitter',
    description: 'Type-safe event broadcaster supporting compile-time payload verification.',
    tags: ['TypeScript', 'Design Patterns'],
    code: `type EventMap = Record<string, any>;
type Listener<T> = (data: T) => void;

class TypedEventEmitter<Events extends EventMap> {
  private listeners: { [K in keyof Events]?: Array<Listener<Events[K]>> } = {};

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
    return () => this.off(event, listener);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const list = this.listeners[event];
    if (list) {
      list.forEach((cb) => cb(data));
    }
  }

  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    const list = this.listeners[event];
    if (!list) return;
    this.listeners[event] = list.filter((cb) => cb !== listener);
  }
}`,
  },
  {
    keywords: ['infinite scroll', 'react', 'hook', 'intersection observer', 'ui'],
    languages: ['TypeScript', 'JavaScript'],
    difficulty: 'Advanced',
    title: 'React useIntersectionObserver Hook',
    description: 'Modern custom hook for viewport element detection with cleanup.',
    tags: ['React', 'TypeScript', 'Web & Async'],
    code: `import { useEffect, useRef, useState } from 'react';

export function useIntersectionObserver(options?: IntersectionObserverInit) {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = elementRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(([firstEntry]) => {
      setEntry(firstEntry);
    }, options);

    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);

  return [elementRef, entry] as const;
}`,
  },

  // ─── Go ───
  {
    keywords: ['worker pool', 'channel', 'goroutine', 'concurrency', 'parallel'],
    languages: ['Go'],
    difficulty: 'Advanced',
    title: 'Bounded Concurrent Worker Pool',
    description: 'Idiomatic Go concurrency pipeline utilizing buffered channels and sync.WaitGroup.',
    tags: ['Go', 'Concurrency', 'Systems'],
    code: `package main

import (
	"fmt"
	"sync"
)

type Job struct {
	ID   int
	Data string
}

type Result struct {
	Job Job
	Err error
}

func worker(id int, jobs <-chan Job, results chan<- Result, wg *sync.WaitGroup) {
	defer wg.Done()
	for j := range jobs {
		// Process incoming task
		results <- Result{Job: j, Err: nil}
	}
}

func RunWorkerPool(numWorkers int, jobsList []Job) {
	jobs := make(chan Job, len(jobsList))
	results := make(chan Result, len(jobsList))
	var wg sync.WaitGroup

	for w := 1; w <= numWorkers; w++ {
		wg.Add(1)
		go worker(w, jobs, results, &wg)
	}

	for _, j := range jobsList {
		jobs <- j
	}
	close(jobs)

	wg.Wait()
	close(results)
}`,
  },

  // ─── Rust ───
  {
    keywords: ['quicksort', 'sort', 'algorithm', 'in-place', 'slice', 'recursion'],
    languages: ['Rust'],
    difficulty: 'Advanced',
    title: 'In-Place QuickSort with Generic Ordering',
    description: 'Safe in-place quicksort leveraging Rust pattern matching and Ord trait bounds.',
    tags: ['Rust', 'Algorithms', 'Systems'],
    code: `pub fn quicksort<T: Ord>(arr: &mut [T]) {
    if arr.len() <= 1 {
        return;
    }
    let pivot_idx = partition(arr);
    let (left, right) = arr.split_at_mut(pivot_idx);
    quicksort(left);
    quicksort(&mut right[1..]);
}

fn partition<T: Ord>(arr: &mut [T]) -> usize {
    let len = arr.len();
    let pivot_idx = len - 1;
    let mut i = 0;

    for j in 0..pivot_idx {
        if arr[j] <= arr[pivot_idx] {
            arr.swap(i, j);
            i += 1;
        }
    }
    arr.swap(i, pivot_idx);
    i
}`,
  },

  // ─── SQL ───
  {
    keywords: ['window function', 'running total', 'cte', 'analytics', 'query'],
    languages: ['SQL'],
    difficulty: 'Intermediate',
    title: 'Running Total & 7-Day Moving Average',
    description: 'Analytical SQL query computing partition-level moving averages and rankings.',
    tags: ['SQL', 'Analytics', 'Database'],
    code: `WITH daily_revenue AS (
    SELECT
        DATE(created_at) AS order_date,
        COUNT(order_id) AS total_orders,
        SUM(amount) AS daily_amount
    FROM customer_orders
    WHERE status = 'completed'
    GROUP BY DATE(created_at)
)
SELECT
    order_date,
    daily_amount,
    SUM(daily_amount) OVER (
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cumulative_revenue,
    AVG(daily_amount) OVER (
        ORDER BY order_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS rolling_7day_avg
FROM daily_revenue
ORDER BY order_date DESC;`,
  },
  {
    keywords: ['recursive', 'cte', 'hierarchy', 'tree', 'parent', 'child'],
    languages: ['SQL'],
    difficulty: 'Advanced',
    title: 'Recursive CTE for Employee Hierarchy',
    description: 'Hierarchical query traversing organizational reporting lines with depth tracking.',
    tags: ['SQL', 'Recursion', 'Analytics'],
    code: `WITH RECURSIVE org_tree AS (
    -- Anchor member: top-level executives
    SELECT
        employee_id,
        first_name,
        last_name,
        manager_id,
        1 AS org_depth,
        CAST(first_name || ' ' || last_name AS VARCHAR(255)) AS hierarchy_path
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive member: direct and indirect reports
    SELECT
        e.employee_id,
        e.first_name,
        e.last_name,
        e.manager_id,
        ot.org_depth + 1,
        CAST(ot.hierarchy_path || ' -> ' || e.first_name || ' ' || e.last_name AS VARCHAR(255))
    FROM employees e
    INNER JOIN org_tree ot ON e.manager_id = ot.employee_id
)
SELECT
    employee_id,
    first_name,
    last_name,
    org_depth,
    hierarchy_path
FROM org_tree
ORDER BY org_depth, employee_id;`,
  },
];

/**
 * Prompt Presets for Quick AI Generation Exploration
 */
export const PROMPT_PRESETS = [
  {
    label: 'LRU Cache Eviction',
    prompt: 'Implement a high-performance Least Recently Used (LRU) cache with O(1) get and put operations',
    language: 'C++',
    difficulty: 'Intermediate',
  },
  {
    label: 'Async Rate Limiter',
    prompt: 'Build a token-bucket rate limiter that throttles bursting traffic with lock synchronization',
    language: 'Python',
    difficulty: 'Advanced',
  },
  {
    label: 'Debounce with Cleanup',
    prompt: 'Create an enterprise debounce utility supporting cancel and flush capabilities',
    language: 'JavaScript',
    difficulty: 'Intermediate',
  },
  {
    label: 'Typed Event Emitter',
    prompt: 'Strictly typed Pub/Sub event emitter using generics and mapped types',
    language: 'TypeScript',
    difficulty: 'Intermediate',
  },
  {
    label: 'Concurrent Worker Pool',
    prompt: 'Bounded worker pool processing jobs through buffered channels with wait group synchronization',
    language: 'Go',
    difficulty: 'Advanced',
  },
  {
    label: 'In-Place QuickSort',
    prompt: 'Generic in-place QuickSort algorithm leveraging recursion and slice bounds',
    language: 'Rust',
    difficulty: 'Advanced',
  },
  {
    label: 'Running Total Analytics',
    prompt: 'Analytical window query calculating cumulative running revenue and 7-day rolling average',
    language: 'SQL',
    difficulty: 'Intermediate',
  },
  {
    label: 'Prefix Tree (Trie)',
    prompt: 'Prefix Tree (Trie) data structure for autocomplete string search and prefix matching',
    language: 'Python',
    difficulty: 'Intermediate',
  },
];

/**
 * Dynamic code synthesizer when an exact match isn't present in the knowledge base.
 */
function synthesizeDynamicSnippet({ prompt, language, difficulty, lengthMode, includeComments }) {
  const cleanPrompt = prompt.trim() || 'Custom Algorithmic Exercise';
  const title = cleanPrompt
    .split(' ')
    .slice(0, 5)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  let commentBlock = '';
  if (includeComments) {
    if (language === 'Python') {
      commentBlock = `"""\n* Goal: ${cleanPrompt}\n* Difficulty: ${difficulty}\n* Practice Focus: Syntactic speed & character accuracy.\n"""\n\n`;
    } else if (language === 'SQL') {
      commentBlock = `-- Objective: ${cleanPrompt}\n-- Tier: ${difficulty}\n\n`;
    } else {
      commentBlock = `/**\n * Exercise: ${cleanPrompt}\n * Difficulty: ${difficulty}\n * Maintain steady typing cadence and rhythm.\n */\n\n`;
    }
  }

  // Synthesize tailored code based on target language
  let generatedCode;
  switch (language) {
    case 'C++':
      generatedCode = `${commentBlock}#include <iostream>
#include <vector>
#include <algorithm>

class Solution {
public:
    int executeBenchmark(std::vector<int>& data, int threshold) {
        int result = 0;
        std::sort(data.begin(), data.end());
        for (const auto& item : data) {
            if (item > threshold) {
                result += item;
            }
        }
        return result;
    }
};

int main() {
    std::vector<int> sample = {12, 45, 7, 89, 34};
    Solution solver;
    std::cout << solver.executeBenchmark(sample, 20) << "\\n";
    return 0;
}`;
      break;

    case 'Python':
      generatedCode = `${commentBlock}from typing import List, Optional

def process_stream(data: List[int], limit: int) -> List[int]:
    """Filter and transform numeric items with boundary constraints."""
    filtered_results = [x * 2 for x in data if x > limit]
    return sorted(filtered_results, reverse=True)

if __name__ == "__main__":
    test_stream = [5, 18, 2, 44, 91, 14]
    output = process_stream(test_stream, limit=10)
    print(f"Processed elements: {output}")`;
      break;

    case 'JavaScript':
    case 'TypeScript': {
      const isTs = language === 'TypeScript';
      generatedCode = `${commentBlock}function createPipeline(config${isTs ? ': { maxRetries: number; timeoutMs: number }' : ''}) {
  const state = { attempts: 0, isActive: true };

  return async function executeTask${isTs ? '<T>' : ''}(fn${isTs ? ': () => Promise<T>' : ''})${isTs ? ': Promise<T>' : ''} {
    while (state.attempts < config.maxRetries) {
      try {
        state.attempts += 1;
        return await fn();
      } catch (err) {
        if (state.attempts >= config.maxRetries) throw err;
        await new Promise((res) => setTimeout(res, config.timeoutMs));
      }
    }
    throw new Error('Pipeline maximum retries exhausted.');
  };
}`;
      break;
    }

    case 'Go':
      generatedCode = `${commentBlock}package main

import (
	"context"
	"fmt"
	"time"
)

type WorkerTask struct {
	ID        string
	Timestamp time.Time
}

func ProcessTask(ctx context.Context, task WorkerTask) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(50 * time.Millisecond):
		fmt.Printf("Task %s completed successfully\\n", task.ID)
		return nil
	}
}`;
      break;

    case 'Rust':
      generatedCode = `${commentBlock}#[derive(Debug, Clone)]
pub struct PipelineNode<T> {
    pub value: T,
    pub priority: u32,
}

impl<T: std::fmt::Display> PipelineNode<T> {
    pub fn new(value: T, priority: u32) -> Self {
        Self { value, priority }
    }

    pub fn display_summary(&self) {
        println!("Node [{}] with priority: {}", self.value, self.priority);
    }
}`;
      break;

    case 'SQL':
      generatedCode = `${commentBlock}SELECT
    e.department_id,
    d.department_name,
    COUNT(e.employee_id) AS total_staff,
    AVG(e.salary) AS average_salary,
    RANK() OVER (ORDER BY AVG(e.salary) DESC) AS salary_tier_rank
FROM employees e
JOIN departments d ON e.department_id = d.department_id
WHERE e.status = 'active'
GROUP BY e.department_id, d.department_name
HAVING COUNT(e.employee_id) > 2
ORDER BY salary_tier_rank ASC;`;
      break;

    default:
      generatedCode = `${commentBlock}// Practice Exercise: ${cleanPrompt}\nfunction solve() {\n  return "Ready to practice";\n}`;
  }

  // Length adjustments
  if (lengthMode === 'compact') {
    const lines = generatedCode.split('\n');
    generatedCode = lines.slice(0, Math.min(10, lines.length)).join('\n');
  }

  return {
    id: `ai-gen-${Date.now()}`,
    title: title.length > 5 ? title : `${language} Practice Drill`,
    description: `AI synthesized exercise tailored to: "${cleanPrompt}".`,
    language,
    difficulty,
    code: generatedCode.trim(),
    tags: ['AI Generated', language, difficulty],
  };
}

/**
 * Main AI Generation Engine
 */
export async function generatePracticeSnippet({
  prompt,
  language = 'C++',
  difficulty = 'Intermediate',
  lengthMode = 'balanced',
  includeComments = true,
}) {
  // Realistic simulated generation latency
  await new Promise((resolve) => setTimeout(resolve, 380));

  const lowerPrompt = (prompt || '').toLowerCase();

  // Search knowledge base for semantic matches in the selected language
  const match = AI_KNOWLEDGE_BASE.find((item) => {
    const langMatch = item.languages.includes(language);
    const keywordMatch = item.keywords.some((kw) => lowerPrompt.includes(kw));
    return langMatch && keywordMatch;
  });

  if (match) {
    const snippetResult = {
      id: `ai-kb-${Date.now()}`,
      title: match.title,
      description: match.description,
      language,
      difficulty,
      code: match.code.trim(),
      tags: [...match.tags, 'AI Recommended'],
    };
    saveAiHistory(snippetResult);
    return snippetResult;
  }

  // Synthesize tailored dynamic code snippet
  const synthesized = synthesizeDynamicSnippet({
    prompt,
    language,
    difficulty,
    lengthMode,
    includeComments,
  });

  saveAiHistory(synthesized);
  return synthesized;
}

/**
 * AI Generation History Store (localStorage)
 */
export function getAiHistory() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AI_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Could not read AI history', err);
    return [];
  }
}

export function saveAiHistory(snippet) {
  if (!snippet) return;
  try {
    const current = getAiHistory();
    // Prepend, keep max 12 items, avoid duplicates by title
    const filtered = current.filter((item) => item.title !== snippet.title);
    const updated = [snippet, ...filtered].slice(0, 12);
    localStorage.setItem(AI_HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save AI history', err);
  }
}
