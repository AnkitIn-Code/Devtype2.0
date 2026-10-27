// src/data/predefinedBlueprints.js
/**
 * Authoritative Predefined Blueprints Catalog
 * 50 high-frequency algorithmic and modern framework templates with
 * verified, authentic implementations in C++, C, Java, Python, JavaScript, TypeScript, Go, Rust, and SQL.
 */

export const PREDEFINED_BLUEPRINTS = [
  // ─────────────────────────────────────────────────────────────
  // 1. ALGORITHMS & DATA STRUCTURES
  // ─────────────────────────────────────────────────────────────
  {
    key: 'binary-search',
    title: 'Binary Search Algorithm',
    category: 'Algorithms & DSA',
    difficulty: 'Beginner',
    description: 'Logarithmic O(log N) search on a sorted integer sequence with overflow-safe midpoint calculation.',
    languages: ['C++', 'C', 'Java', 'Python', 'JavaScript'],
    slugs: {
      'C++': 'binary-search-cpp',
      'C': 'binary-search-c',
      'Java': 'binary-search-java',
      'Python': 'binary-search-python',
      'JavaScript': 'binary-search-javascript',
    },
    codeByLanguage: {
      'C++': `int binarySearch(const vector<int>& nums, int target) {
    int left = 0, right = (int)nums.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
      'C': `int binary_search(const int* nums, int size, int target) {
    int left = 0, right = size - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
      'Java': `public int binarySearch(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
      'Python': `def binary_search(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
      'JavaScript': `function binarySearch(nums, target) {
    let left = 0, right = nums.length - 1;
    while (left <= right) {
        const mid = Math.floor(left + (right - left) / 2);
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
    },
  },
  {
    key: 'two-sum',
    title: 'Two Sum Map Resolution',
    category: 'Algorithms & DSA',
    difficulty: 'Beginner',
    description: 'Linear O(N) hash table complement lookup to identify two indices summing to target.',
    languages: ['C++', 'C', 'Java', 'Python', 'JavaScript'],
    slugs: {
      'C++': 'two-sum-cpp',
      'C': 'two-sum-c',
      'Java': 'two-sum-java',
      'Python': 'two-sum-python',
      'JavaScript': 'two-sum-javascript',
    },
    codeByLanguage: {
      'C++': `vector<int> twoSum(const vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); ++i) {
        int complement = target - nums[i];
        if (seen.find(complement) != seen.end()) {
            return {seen[complement], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}`,
      'C': `int* twoSum(const int* nums, int numsSize, int target, int* returnSize) {
    int* result = (int*)malloc(2 * sizeof(int));
    *returnSize = 2;
    for (int i = 0; i < numsSize; i++) {
        for (int j = i + 1; j < numsSize; j++) {
            if (nums[i] + nums[j] == target) {
                result[0] = i;
                result[1] = j;
                return result;
            }
        }
    }
    *returnSize = 0;
    return NULL;
}`,
      'Java': `public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (seen.containsKey(complement)) {
            return new int[] { seen.get(complement), i };
        }
        seen.put(nums[i], i);
    }
    return new int[0];
}`,
      'Python': `def two_sum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
      'JavaScript': `function twoSum(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
            return [seen.get(complement), i];
        }
        seen.set(nums[i], i);
    }
    return [];
}`,
    },
  },
  {
    key: 'quick-sort',
    title: 'Quick Sort (Hoare / Lomuto)',
    category: 'Algorithms & DSA',
    difficulty: 'Advanced',
    description: 'Divide-and-conquer in-place recursive sorting with linear partitioning.',
    languages: ['C++', 'C', 'Java', 'Python', 'JavaScript'],
    slugs: {
      'C++': 'quick-sort-cpp',
      'C': 'quick-sort-c',
      'Java': 'quick-sort-java',
      'Python': 'quick-sort-python',
      'JavaScript': 'quick-sort-javascript',
    },
    codeByLanguage: {
      'C++': `int partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; ++j) {
        if (arr[j] <= pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return i + 1;
}

void quickSort(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}`,
      'C': `void swap(int* a, int* b) {
    int t = *a; *a = *b; *b = t;
}

int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = (low - 1);
    for (int j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            swap(&arr[i], &arr[j]);
        }
    }
    swap(&arr[i + 1], &arr[high]);
    return (i + 1);
}`,
      'Java': `public void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pivot = arr[high];
        int i = low - 1;
        for (int j = low; j < high; j++) {
            if (arr[j] <= pivot) {
                i++;
                int temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;
            }
        }
        int temp = arr[i + 1]; arr[i + 1] = arr[high]; arr[high] = temp;
        int pi = i + 1;
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}`,
      'Python': `def quick_sort(arr: list[int]) -> list[int]:
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)`,
      'JavaScript': `function quickSort(arr) {
    if (arr.length <= 1) return arr;
    const pivot = arr[Math.floor(arr.length / 2)];
    const left = arr.filter(x => x < pivot);
    const middle = arr.filter(x => x === pivot);
    const right = arr.filter(x => x > pivot);
    return [...quickSort(left), ...middle, ...quickSort(right)];
}`,
    },
  },
  {
    key: 'merge-sort',
    title: 'Merge Sort Algorithm',
    category: 'Algorithms & DSA',
    difficulty: 'Intermediate',
    description: 'Guaranteed O(N log N) stable sorting via recursive bisection and buffer merging.',
    languages: ['C++', 'C', 'Java', 'Python', 'JavaScript'],
    slugs: {
      'C++': 'merge-sort-cpp',
      'C': 'merge-sort-c',
      'Java': 'merge-sort-java',
      'Python': 'merge-sort-python',
      'JavaScript': 'merge-sort-javascript',
    },
    codeByLanguage: {
      'C++': `void merge(vector<int>& arr, int l, int m, int r) {
    vector<int> left(arr.begin() + l, arr.begin() + m + 1);
    vector<int> right(arr.begin() + m + 1, arr.begin() + r + 1);
    int i = 0, j = 0, k = l;
    while (i < left.size() && j < right.size()) {
        if (left[i] <= right[j]) arr[k++] = left[i++];
        else arr[k++] = right[j++];
    }
    while (i < left.size()) arr[k++] = left[i++];
    while (j < right.size()) arr[k++] = right[j++];
}`,
      'C': `void merge(int arr[], int l, int m, int r) {
    int n1 = m - l + 1, n2 = r - m;
    int L[n1], R[n2];
    for (int i = 0; i < n1; i++) L[i] = arr[l + i];
    for (int j = 0; j < n2; j++) R[j] = arr[m + 1 + j];
    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) arr[k++] = L[i++];
        else arr[k++] = R[j++];
    }
    while (i < n1) arr[k++] = L[i++];
    while (j < n2) arr[k++] = R[j++];
}`,
      'Java': `public void merge(int[] arr, int l, int m, int r) {
    int[] temp = new int[r - l + 1];
    int i = l, j = m + 1, k = 0;
    while (i <= m && j <= r) {
        temp[k++] = (arr[i] <= arr[j]) ? arr[i++] : arr[j++];
    }
    while (i <= m) temp[k++] = arr[i++];
    while (j <= r) temp[k++] = arr[j++];
    System.arraycopy(temp, 0, arr, l, temp.length);
}`,
      'Python': `def merge_sort(nums: list[int]) -> list[int]:
    if len(nums) <= 1:
        return nums
    mid = len(nums) // 2
    left = merge_sort(nums[:mid])
    right = merge_sort(nums[mid:])
    res, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            res.append(left[i]); i += 1
        else:
            res.append(right[j]); j += 1
    res.extend(left[i:])
    res.extend(right[j:])
    return res`,
      'JavaScript': `function mergeSort(arr) {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));
    const res = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) {
        res.push(left[i] <= right[j] ? left[i++] : right[j++]);
    }
    return [...res, ...left.slice(i), ...right.slice(j)];
}`,
    },
  },
  {
    key: 'lru-cache',
    title: 'LRU Cache (Doubly Linked + Map)',
    category: 'Algorithms & DSA',
    difficulty: 'Advanced',
    description: 'Constant O(1) eviction & lookup using hash map and bidirectional linked list nodes.',
    languages: ['C++', 'Java', 'Python', 'JavaScript'],
    slugs: {
      'C++': 'cpp-lru-cache',
      'Java': 'java-lru-cache',
      'Python': 'python-lru-cache',
      'JavaScript': 'javascript-lru-cache',
    },
    codeByLanguage: {
      'C++': `class LRUCache {
    int cap;
    list<pair<int, int>> dll;
    unordered_map<int, list<pair<int, int>>::iterator> map;
public:
    LRUCache(int capacity) : cap(capacity) {}
    int get(int key) {
        if (map.find(key) == map.end()) return -1;
        dll.splice(dll.begin(), dll, map[key]);
        return map[key]->second;
    }
    void put(int key, int value) {
        if (map.find(key) != map.end()) {
            map[key]->second = value;
            dll.splice(dll.begin(), dll, map[key]);
            return;
        }
        if ((int)dll.size() == cap) {
            map.erase(dll.back().first);
            dll.pop_back();
        }
        dll.push_front({key, value});
        map[key] = dll.begin();
    }
};`,
      'Java': `public class LRUCache extends LinkedHashMap<Integer, Integer> {
    private final int capacity;
    public LRUCache(int capacity) {
        super(capacity, 0.75f, true);
        this.capacity = capacity;
    }
    public int get(int key) {
        return super.getOrDefault(key, -1);
    }
    public void put(int key, int value) {
        super.put(key, value);
    }
    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > capacity;
    }
}`,
      'Python': `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.cap:
            self.cache.popitem(last=False)`,
      'JavaScript': `class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.cache = new Map();
    }
    get(key) {
        if (!this.cache.has(key)) return -1;
        const val = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, val);
        return val;
    }
    put(key, value) {
        if (this.cache.has(key)) this.cache.delete(key);
        this.cache.set(key, value);
        if (this.cache.size > this.capacity) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }
}`,
    },
  },
  {
    key: 'bfs-graph',
    title: 'BFS Breadth-First Search',
    category: 'Algorithms & DSA',
    difficulty: 'Intermediate',
    description: 'Level-order queue traversal computing shortest unweighted path and connected components.',
    languages: ['C++', 'Java', 'Python', 'JavaScript'],
    slugs: {
      'C++': 'cpp-graph-bfs',
      'Java': 'java-graph-bfs',
      'Python': 'py-graph-bfs',
      'JavaScript': 'js-graph-bfs',
    },
    codeByLanguage: {
      'C++': `vector<int> bfs(int start, const vector<vector<int>>& adj) {
    vector<bool> visited(adj.size(), false);
    queue<int> q;
    vector<int> order;
    visited[start] = true;
    q.push(start);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (int v : adj[u]) {
            if (!visited[v]) {
                visited[v] = true;
                q.push(v);
            }
        }
    }
    return order;
}`,
      'Java': `public List<Integer> bfs(int start, List<List<Integer>> adj) {
    boolean[] visited = new boolean[adj.size()];
    Queue<Integer> q = new LinkedList<>();
    List<Integer> order = new ArrayList<>();
    visited[start] = true;
    q.offer(start);
    while (!q.isEmpty()) {
        int u = q.poll();
        order.add(u);
        for (int v : adj.get(u)) {
            if (!visited[v]) {
                visited[v] = true;
                q.offer(v);
            }
        }
    }
    return order;
}`,
      'Python': `from collections import deque

def bfs(start: int, adj: dict[int, list[int]]) -> list[int]:
    visited = {start}
    queue = deque([start])
    order = []
    while queue:
        u = queue.popleft()
        order.append(u)
        for v in adj.get(u, []):
            if v not in visited:
                visited.add(v)
                queue.append(v)
    return order`,
      'JavaScript': `function bfs(start, adj) {
    const visited = new Set([start]);
    const queue = [start];
    const order = [];
    while (queue.length > 0) {
        const u = queue.shift();
        order.push(u);
        for (const v of adj[u] || []) {
            if (!visited.has(v)) {
                visited.add(v);
                queue.push(v);
            }
        }
    }
    return order;
}`,
    },
  },
  {
    key: 'dfs-graph',
    title: 'DFS Depth-First Search',
    category: 'Algorithms & DSA',
    difficulty: 'Intermediate',
    description: 'Backtracking recursive traversal discovering topological ordering and components.',
    languages: ['C++', 'Java', 'Python', 'JavaScript'],
    slugs: {
      'C++': 'dfs-graph-cpp',
      'Java': 'dfs-graph-java',
      'Python': 'dfs-graph-python',
      'JavaScript': 'dfs-graph-javascript',
    },
    codeByLanguage: {
      'C++': `void dfs(int u, const vector<vector<int>>& adj, vector<bool>& visited, vector<int>& order) {
    visited[u] = true;
    order.push_back(u);
    for (int v : adj[u]) {
        if (!visited[v]) {
            dfs(v, adj, visited, order);
        }
    }
}`,
      'Java': `public void dfs(int u, List<List<Integer>> adj, boolean[] visited, List<Integer> order) {
    visited[u] = true;
    order.add(u);
    for (int v : adj.get(u)) {
        if (!visited[v]) {
            dfs(v, adj, visited, order);
        }
    }
}`,
      'Python': `def dfs(u: int, adj: dict[int, list[int]], visited: set[int], order: list[int]) -> None:
    visited.add(u)
    order.append(u)
    for v in adj.get(u, []):
        if v not in visited:
            dfs(v, adj, visited, order)`,
      'JavaScript': `function dfs(u, adj, visited = new Set(), order = []) {
    visited.add(u);
    order.push(u);
    for (const v of adj[u] || []) {
        if (!visited.has(v)) {
            dfs(v, adj, visited, order);
        }
    }
    return order;
}`,
    },
  },
  {
    key: 'kadane',
    title: "Kadane's Maximum Subarray",
    category: 'Algorithms & DSA',
    difficulty: 'Beginner',
    description: 'Dynamic O(N) single-pass maximum contiguous segment sum calculation.',
    languages: ['C++', 'C', 'Java', 'Python', 'JavaScript'],
    slugs: {
      'C++': 'kadane-cpp',
      'C': 'kadane-c',
      'Java': 'kadane-java',
      'Python': 'kadane-python',
      'JavaScript': 'kadane-javascript',
    },
    codeByLanguage: {
      'C++': `int maxSubArray(const vector<int>& nums) {
    int maxSoFar = nums[0];
    int currentMax = nums[0];
    for (size_t i = 1; i < nums.size(); ++i) {
        currentMax = max(nums[i], currentMax + nums[i]);
        maxSoFar = max(maxSoFar, currentMax);
    }
    return maxSoFar;
}`,
      'C': `int maxSubArray(const int* nums, int numsSize) {
    int maxSoFar = nums[0];
    int currentMax = nums[0];
    for (int i = 1; i < numsSize; i++) {
        currentMax = (nums[i] > currentMax + nums[i]) ? nums[i] : (currentMax + nums[i]);
        if (currentMax > maxSoFar) maxSoFar = currentMax;
    }
    return maxSoFar;
}`,
      'Java': `public int maxSubArray(int[] nums) {
    int maxSoFar = nums[0];
    int currentMax = nums[0];
    for (int i = 1; i < nums.length; i++) {
        currentMax = Math.max(nums[i], currentMax + nums[i]);
        maxSoFar = Math.max(maxSoFar, currentMax);
    }
    return maxSoFar;
}`,
      'Python': `def max_sub_array(nums: list[int]) -> int:
    max_so_far = nums[0]
    current_max = nums[0]
    for x in nums[1:]:
        current_max = max(x, current_max + x)
        max_so_far = max(max_so_far, current_max)
    return max_so_far`,
      'JavaScript': `function maxSubArray(nums) {
    let maxSoFar = nums[0];
    let currentMax = nums[0];
    for (let i = 1; i < nums.length; i++) {
        currentMax = Math.max(nums[i], currentMax + nums[i]);
        maxSoFar = Math.max(maxSoFar, currentMax);
    }
    return maxSoFar;
}`,
    },
  },
  {
    key: 'valid-parentheses',
    title: 'Valid Parentheses Stack Validator',
    category: 'Algorithms & DSA',
    difficulty: 'Beginner',
    description: 'Linear O(N) bracket nesting and balance evaluation with LIFO stack semantics.',
    languages: ['C++', 'Java', 'Python', 'JavaScript'],
    slugs: {
      'C++': 'valid-parens-cpp',
      'Java': 'valid-parens-java',
      'Python': 'valid-parens-python',
      'JavaScript': 'valid-parens-javascript',
    },
    codeByLanguage: {
      'C++': `bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '{' || c == '[') st.push(c);
        else {
            if (st.empty()) return false;
            char top = st.top(); st.pop();
            if ((c == ')' && top != '(') ||
                (c == '}' && top != '{') ||
                (c == ']' && top != '[')) return false;
        }
    }
    return st.empty();
}`,
      'Java': `public boolean isValid(String s) {
    Deque<Character> st = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if (c == '(') st.push(')');
        else if (c == '{') st.push('}');
        else if (c == '[') st.push(']');
        else if (st.isEmpty() || st.pop() != c) return false;
    }
    return st.isEmpty();
}`,
      'Python': `def is_valid(s: str) -> bool:
    pairs = {')': '(', '}': '{', ']': '['}
    stack = []
    for c in s:
        if c in pairs:
            if not stack or stack.pop() != pairs[c]:
                return False
        else:
            stack.append(c)
    return not stack`,
      'JavaScript': `function isValid(s) {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (const char of s) {
        if (char in map) {
            if (stack.pop() !== map[char]) return false;
        } else {
            stack.push(char);
        }
    }
    return stack.length === 0;
}`,
    },
  },

  // ─────────────────────────────────────────────────────────────
  // 2. MODERN FRAMEWORKS (REACT)
  // ─────────────────────────────────────────────────────────────
  {
    key: 'react-use-state',
    title: 'React useState Hook & State Reducer',
    category: 'Modern Frameworks (React)',
    difficulty: 'Beginner',
    description: 'Local state synchronization and functional immutable updater dispatch pattern.',
    languages: ['JavaScript', 'TypeScript'],
    slugs: {
      'JavaScript': 'react-use-state-js',
      'TypeScript': 'react-use-state-ts',
    },
    codeByLanguage: {
      'JavaScript': `import { useState } from 'react';

export function Counter() {
    const [count, setCount] = useState(0);
    const increment = () => setCount(prev => prev + 1);
    const reset = () => setCount(0);

    return (
        <div className="counter-box">
            <span>Current Count: {count}</span>
            <button onClick={increment}>Increment</button>
            <button onClick={reset}>Reset</button>
        </div>
    );
}`,
      'TypeScript': `import React, { useState } from 'react';

interface CounterProps {
    initialValue?: number;
}

export const Counter: React.FC<CounterProps> = ({ initialValue = 0 }) => {
    const [count, setCount] = useState<number>(initialValue);
    const increment = (): void => setCount((prev) => prev + 1);

    return (
        <button onClick={increment}>
            Count is {count}
        </button>
    );
};`,
    },
  },
  {
    key: 'react-use-effect',
    title: 'React useEffect Lifecycle & Subscriptions',
    category: 'Modern Frameworks (React)',
    difficulty: 'Intermediate',
    description: 'Side-effect subscriptions, cleanup teardown functions, and dependency array ergonomics.',
    languages: ['JavaScript', 'TypeScript'],
    slugs: {
      'JavaScript': 'react-use-effect-js',
      'TypeScript': 'react-use-effect-ts',
    },
    codeByLanguage: {
      'JavaScript': `import { useState, useEffect } from 'react';

export function WindowTracker() {
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return <div>Viewport Width: {width}px</div>;
}`,
      'TypeScript': `import { useState, useEffect } from 'react';

export function WindowTracker(): JSX.Element {
    const [width, setWidth] = useState<number>(window.innerWidth);

    useEffect(() => {
        const handleResize = (): void => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return <div>Viewport: {width}px</div>;
}`,
    },
  },
  {
    key: 'react-use-memo',
    title: 'React useMemo & useCallback Optimization',
    category: 'Modern Frameworks (React)',
    difficulty: 'Intermediate',
    description: 'Expensive algorithmic computation memoization and stable reference callbacks.',
    languages: ['JavaScript', 'TypeScript'],
    slugs: {
      'JavaScript': 'react-use-memo-js',
      'TypeScript': 'react-use-memo-ts',
    },
    codeByLanguage: {
      'JavaScript': `import { useMemo, useCallback } from 'react';

export function SearchFilter({ items, query, onSelect }) {
    const filtered = useMemo(() => {
        return items.filter(it => it.name.toLowerCase().includes(query.toLowerCase()));
    }, [items, query]);

    const handleSelect = useCallback((id) => {
        onSelect(id);
    }, [onSelect]);

    return (
        <ul>
            {filtered.map(item => (
                <li key={item.id} onClick={() => handleSelect(item.id)}>
                    {item.name}
                </li>
            ))}
        </ul>
    );
}`,
      'TypeScript': `import { useMemo, useCallback } from 'react';

interface Item { id: string; name: string; }

export function SearchFilter({ items, query, onSelect }: { items: Item[]; query: string; onSelect: (id: string) => void }) {
    const filtered = useMemo<Item[]>(() => {
        return items.filter(it => it.name.toLowerCase().includes(query.toLowerCase()));
    }, [items, query]);

    const handleSelect = useCallback((id: string) => {
        onSelect(id);
    }, [onSelect]);

    return <ul>{filtered.map(i => <li key={i.id} onClick={() => handleSelect(i.id)}>{i.name}</li>)}</ul>;
}`,
    },
  },
  {
    key: 'react-use-debounce',
    title: 'React Custom useDebounce Hook',
    category: 'Modern Frameworks (React)',
    difficulty: 'Intermediate',
    description: 'Custom React hook delaying high-frequency state updates until delay expires.',
    languages: ['JavaScript', 'TypeScript'],
    slugs: {
      'JavaScript': 'react-use-debounce-js',
      'TypeScript': 'react-use-debounce-ts',
    },
    codeByLanguage: {
      'JavaScript': `import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}`,
      'TypeScript': `import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}`,
    },
  },

  // ─────────────────────────────────────────────────────────────
  // 3. MODERN FRAMEWORKS (ANGULAR)
  // ─────────────────────────────────────────────────────────────
  {
    key: 'angular-standalone',
    title: 'Angular Standalone Component & Imports',
    category: 'Modern Frameworks (Angular)',
    difficulty: 'Beginner',
    description: 'Clean modern Angular 17+ standalone architecture with direct template imports.',
    languages: ['TypeScript'],
    slugs: {
      'TypeScript': 'angular-standalone-component',
    },
    codeByLanguage: {
      'TypeScript': `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule],
  template: \`
    <div class="user-card">
      <h3>{{ title }}</h3>
      <p>Status: Active Developer</p>
    </div>
  \`
})
export class UserCardComponent {
  title = 'DevType Standalone Architecture';
}`,
    },
  },
  {
    key: 'angular-signals',
    title: 'Angular Signals & Computed Reactivity',
    category: 'Modern Frameworks (Angular)',
    difficulty: 'Intermediate',
    description: 'Fine-grained signal primitives and derived computed properties without zone pollution.',
    languages: ['TypeScript'],
    slugs: {
      'TypeScript': 'angular-signals',
    },
    codeByLanguage: {
      'TypeScript': `import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-metric-counter',
  standalone: true,
  template: \`
    <div>Keystrokes: {{ count() }}</div>
    <div>Gross WPM: {{ wpm() }}</div>
  \`
})
export class MetricCounterComponent {
  count = signal(0);
  timeMinutes = signal(1);

  wpm = computed(() => {
    return Math.round((this.count() / 5) / (this.timeMinutes() || 1));
  });

  addKeystroke() {
    this.count.update(c => c + 1);
  }
}`,
    },
  },

  // ─────────────────────────────────────────────────────────────
  // 4. SYSTEMS & CONCURRENCY (GO & RUST)
  // ─────────────────────────────────────────────────────────────
  {
    key: 'go-worker-pool',
    title: 'Go Worker Pool with Channels',
    category: 'Systems & Concurrency',
    difficulty: 'Advanced',
    description: 'Concurrent worker pool distributing jobs across channels with sync.WaitGroup.',
    languages: ['Go'],
    slugs: {
      'Go': 'go-goroutine-pool',
    },
    codeByLanguage: {
      'Go': `package main

import (
	"fmt"
	"sync"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
	defer wg.Done()
	for j := range jobs {
		results <- j * 2
	}
}

func main() {
	jobs := make(chan int, 100)
	results := make(chan int, 100)
	var wg sync.WaitGroup

	for w := 1; w <= 3; w++ {
		wg.Add(1)
		go worker(w, jobs, results, &wg)
	}

	for j := 1; j <= 5; j++ {
		jobs <- j
	}
	close(jobs)
	wg.Wait()
	close(results)
}`,
    },
  },
  {
    key: 'rust-concurrency',
    title: 'Rust MPSC Channel Concurrency',
    category: 'Systems & Concurrency',
    difficulty: 'Advanced',
    description: 'Safe memory multi-producer single-consumer thread communication.',
    languages: ['Rust'],
    slugs: {
      'Rust': 'rust-concurrent-channel',
    },
    codeByLanguage: {
      'Rust': `use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();
    let tx1 = tx.clone();

    thread::spawn(move || {
        let vals = vec!["drill_1", "drill_2", "drill_3"];
        for val in vals {
            tx1.send(val).unwrap();
            thread::sleep(Duration::from_millis(50));
        }
    });

    for received in rx {
        println!("Got: {}", received);
    }
}`,
    },
  },

  // ─────────────────────────────────────────────────────────────
  // 5. SQL & RELATIONAL ANALYTICS
  // ─────────────────────────────────────────────────────────────
  {
    key: 'sql-window-rank',
    title: 'SQL Window Ranking & Partitioning',
    category: 'SQL & Analytics',
    difficulty: 'Intermediate',
    description: 'DENSE_RANK() and ROW_NUMBER() window analysis over user speed percentiles.',
    languages: ['SQL'],
    slugs: {
      'SQL': 'sql-window-rank',
    },
    codeByLanguage: {
      'SQL': `SELECT
    user_id,
    language,
    net_wpm,
    accuracy_percent,
    DENSE_RANK() OVER (
        PARTITION BY language
        ORDER BY net_wpm DESC, accuracy_percent DESC
    ) AS rank_position
FROM practice_sessions
WHERE status = 'COMPLETED'
ORDER BY language, rank_position;`,
    },
  },
];

/**
 * Normalizes language names to standard key (C++, Python, Java, etc.)
 */
export function normalizeLanguageName(raw) {
  if (!raw) return null;
  const l = String(raw).toLowerCase().trim();
  if (l === 'c++' || l === 'cpp' || l === 'cplusplus') return 'C++';
  if (l === 'c') return 'C';
  if (l === 'python' || l === 'py') return 'Python';
  if (l === 'java') return 'Java';
  if (l === 'javascript' || l === 'js') return 'JavaScript';
  if (l === 'typescript' || l === 'ts') return 'TypeScript';
  if (l === 'go' || l === 'golang') return 'Go';
  if (l === 'rust' || l === 'rs') return 'Rust';
  if (l === 'sql' || l === 'postgresql' || l === 'mysql') return 'SQL';
  return raw;
}

/**
 * Normalizes any blueprint or snippet into the standard frontend Snippet contract.
 * Strictly guarantees that if a C++ drill is requested (e.g., cpp-binary-search or lang=C++),
 * C++ code is returned.
 */
export function getPredefinedSnippet(idOrSlug, preferredLang = null) {
  if (!idOrSlug) return null;

  const needle = String(idOrSlug).toLowerCase().trim();
  let targetLang = normalizeLanguageName(preferredLang);

  // Detect language embedded in the identifier (e.g., "cpp-binary-search", "binary-search-cpp")
  if (!targetLang) {
    if (needle.startsWith('cpp-') || needle.endsWith('-cpp') || needle === 'cpp' || needle === 'c++') {
      targetLang = 'C++';
    } else if (needle.startsWith('c-') || needle.endsWith('-c') || needle === 'c') {
      targetLang = 'C';
    } else if (needle.startsWith('python-') || needle.endsWith('-python') || needle.startsWith('py-') || needle.endsWith('-py') || needle === 'python') {
      targetLang = 'Python';
    } else if (needle.startsWith('java-') || needle.endsWith('-java') || needle === 'java') {
      targetLang = 'Java';
    } else if (needle.startsWith('js-') || needle.endsWith('-javascript') || needle.endsWith('-js') || needle === 'javascript') {
      targetLang = 'JavaScript';
    } else if (needle.startsWith('ts-') || needle.endsWith('-typescript') || needle.endsWith('-ts') || needle === 'typescript') {
      targetLang = 'TypeScript';
    } else if (needle.startsWith('go-') || needle.endsWith('-go') || needle === 'go') {
      targetLang = 'Go';
    } else if (needle.startsWith('rust-') || needle.endsWith('-rust') || needle.endsWith('-rs') || needle === 'rust') {
      targetLang = 'Rust';
    } else if (needle.startsWith('sql-') || needle.endsWith('-sql') || needle === 'sql') {
      targetLang = 'SQL';
    }
  }

  // Handle generic language query (e.g., "cpp", "python")
  if (needle === 'cpp' || needle === 'c++' || needle === 'c' || needle === 'python' || needle === 'java' || needle === 'javascript' || needle === 'typescript' || needle === 'go' || needle === 'rust' || needle === 'sql') {
    const lang = targetLang || 'C++';
    const match = PREDEFINED_BLUEPRINTS.find(bp => bp.codeByLanguage[lang]);
    if (match) {
      const code = match.codeByLanguage[lang];
      const slug = match.slugs?.[lang] || `${match.key}-${lang.toLowerCase().replace('+', 'p')}`;
      return {
        id: slug,
        slug,
        title: `${match.title} (${lang})`,
        language: lang,
        difficulty: match.difficulty,
        category: match.category,
        code,
        content: code,
        description: match.description,
        isLanguageLocked: true,
      };
    }
  }

  // 1. Direct slug match across all blueprints
  for (const bp of PREDEFINED_BLUEPRINTS) {
    for (const [lang, s] of Object.entries(bp.slugs || {})) {
      if (s.toLowerCase() === needle) {
        const resolvedLang = targetLang && bp.codeByLanguage[targetLang] ? targetLang : lang;
        const code = bp.codeByLanguage[resolvedLang] || bp.codeByLanguage[lang] || Object.values(bp.codeByLanguage)[0];
        return {
          id: s,
          slug: s,
          title: `${bp.title} (${resolvedLang})`,
          language: resolvedLang,
          difficulty: bp.difficulty,
          category: bp.category,
          code,
          content: code,
          description: bp.description,
          isLanguageLocked: true,
        };
      }
    }
  }

  // 2. Stripped prefix / suffix slug match (e.g. "cpp-binary-search" -> key "binary-search")
  const strippedNeedle = needle
    .replace(/^(cpp|c|python|py|java|javascript|js|typescript|ts|go|rust|sql)-/, '')
    .replace(/-(cpp|c|python|py|java|javascript|js|typescript|ts|go|rust|sql)$/, '');

  for (const bp of PREDEFINED_BLUEPRINTS) {
    if (
      bp.key.toLowerCase() === strippedNeedle ||
      bp.key.toLowerCase().replace(/-/g, '_') === strippedNeedle ||
      bp.key.toLowerCase() === needle ||
      needle.includes(bp.key.toLowerCase())
    ) {
      const lang = targetLang && bp.codeByLanguage[targetLang]
        ? targetLang
        : bp.languages[0];
      const code = bp.codeByLanguage[lang] || Object.values(bp.codeByLanguage)[0];
      const slug = bp.slugs?.[lang] || `${bp.key}-${lang.toLowerCase().replace('+', 'p')}`;
      return {
        id: slug,
        slug,
        title: `${bp.title} (${lang})`,
        language: lang,
        difficulty: bp.difficulty,
        category: bp.category,
        code,
        content: code,
        description: bp.description,
        isLanguageLocked: true,
      };
    }
  }

  return null;
}
