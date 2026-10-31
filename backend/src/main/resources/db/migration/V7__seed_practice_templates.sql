-- ==============================================================================
-- Flyway Migration V7: Seed Predefined Multi-Language Practice Templates Catalog
-- Authentic, production-grade drills in C++, C, Java, Python, JavaScript, TypeScript, Go, Rust, and SQL
-- ==============================================================================

INSERT INTO practice_templates (
    title,
    slug,
    description,
    language,
    difficulty,
    category,
    content,
    estimated_duration_seconds,
    is_published,
    created_at,
    updated_at,
    author_id,
    is_ai_generated
) VALUES
-- 1. Binary Search (C++)
(
    'Binary Search Algorithm (C++)',
    'binary-search-cpp',
    'Logarithmic O(log N) search on a sorted integer sequence with overflow-safe midpoint calculation in modern C++.',
    'C++',
    'BEGINNER',
    'Algorithms & DSA',
    'int binarySearch(const vector<int>& nums, int target) {
    int left = 0, right = (int)nums.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}',
    60,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 2. Binary Search (C)
(
    'Binary Search Algorithm (C)',
    'binary-search-c',
    'Classic low-level binary search with pointer array access and bounds verification in ANSI C.',
    'C',
    'BEGINNER',
    'Algorithms & DSA',
    'int binary_search(const int* nums, int size, int target) {
    int left = 0, right = size - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}',
    60,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 3. Binary Search (Java)
(
    'Binary Search Algorithm (Java)',
    'binary-search-java',
    'Standard logarithmic search implementation with primitive array bounds in Java.',
    'Java',
    'BEGINNER',
    'Algorithms & DSA',
    'public int binarySearch(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}',
    60,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 4. Binary Search (Python)
(
    'Binary Search Algorithm (Python)',
    'binary-search-python',
    'Idiomatic Python binary search with type hints and floor division.',
    'Python',
    'BEGINNER',
    'Algorithms & DSA',
    'def binary_search(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1',
    60,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 5. Binary Search (JavaScript)
(
    'Binary Search Algorithm (JavaScript)',
    'binary-search-javascript',
    'ES6+ Binary Search routine using Math.floor midpoint computation.',
    'JavaScript',
    'BEGINNER',
    'Algorithms & DSA',
    'function binarySearch(nums, target) {
    let left = 0, right = nums.length - 1;
    while (left <= right) {
        const mid = Math.floor(left + (right - left) / 2);
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}',
    60,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 6. Two Sum Map (C++)
(
    'Two Sum Hash Map (C++)',
    'two-sum-cpp',
    'Linear O(N) hash table complement lookup with std::unordered_map.',
    'C++',
    'BEGINNER',
    'Algorithms & DSA',
    'vector<int> twoSum(const vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); ++i) {
        int complement = target - nums[i];
        if (seen.find(complement) != seen.end()) {
            return {seen[complement], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}',
    75,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 7. Two Sum Map (Python)
(
    'Two Sum Hash Map (Python)',
    'two-sum-python',
    'Linear hash map dictionary resolution for two indices summing to target.',
    'Python',
    'BEGINNER',
    'Algorithms & DSA',
    'def two_sum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []',
    75,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 8. Quick Sort Partition (C++)
(
    'Quick Sort Partition (C++)',
    'quick-sort-cpp',
    'Divide-and-conquer in-place recursive sorting with Lomuto partitioning.',
    'C++',
    'INTERMEDIATE',
    'Algorithms & DSA',
    'int partition(vector<int>& arr, int low, int high) {
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
}',
    90,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 9. LRU Cache Implementation (C++)
(
    'LRU Cache Implementation (C++)',
    'lru-cache-cpp',
    'Doubly linked list and hash map for O(1) get and put operations in C++.',
    'C++',
    'INTERMEDIATE',
    'Data Structures',
    'class LRUCache {
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
        if ((int)cache.size() >= cap) {
            map.erase(cache.back().first);
            cache.pop_back();
        }
        cache.emplace_front(key, value);
        map[key] = cache.begin();
    }
};',
    120,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 10. LRU Cache Implementation (Python)
(
    'LRU Cache Implementation (Python)',
    'lru-cache-python',
    'High-efficiency LRU Cache using collections.OrderedDict in Python.',
    'Python',
    'INTERMEDIATE',
    'Data Structures',
    'from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache: OrderedDict[int, int] = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)',
    120,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 11. Go Worker Pool (Go)
(
    'Concurrent Worker Pool (Go)',
    'go-worker-pool',
    'Buffered channel producer-consumer worker pool with sync.WaitGroup in Go.',
    'Go',
    'INTERMEDIATE',
    'Concurrency',
    'func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for j := range jobs {
        results <- j * 2
    }
}

func RunPool(numWorkers, numJobs int) []int {
    jobs := make(chan int, numJobs)
    results := make(chan int, numJobs)
    var wg sync.WaitGroup

    for w := 1; w <= numWorkers; w++ {
        wg.Add(1)
        go worker(w, jobs, results, &wg)
    }

    for j := 1; j <= numJobs; j++ {
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
}',
    120,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 12. Rust MPSC Channel (Rust)
(
    'MPSC Channel Pipeline (Rust)',
    'rust-mpsc-channel',
    'Multi-producer single-consumer thread communication pipeline in safe Rust.',
    'Rust',
    'INTERMEDIATE',
    'Concurrency',
    'use std::sync::mpsc;
use std::thread;

fn pipeline_tasks(tasks: Vec<i32>) -> Vec<i32> {
    let (tx, rx) = mpsc::channel();
    let handle = thread::spawn(move || {
        for val in tasks {
            let transformed = val * 2;
            tx.send(transformed).unwrap();
        }
    });

    handle.join().unwrap();
    rx.into_iter().collect()
}',
    100,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 13. SQL Dense Rank (SQL)
(
    'Leaderboard Dense Rank Windowing (SQL)',
    'sql-dense-rank',
    'Window analytics query calculating dense rank per language category in PostgreSQL.',
    'SQL',
    'INTERMEDIATE',
    'SQL & Analytics',
    'SELECT
    user_id,
    language,
    net_wpm,
    accuracy_percent,
    DENSE_RANK() OVER (
        PARTITION BY language
        ORDER BY net_wpm DESC, accuracy_percent DESC
    ) AS rank_position
FROM practice_sessions
WHERE status = ''COMPLETED''
ORDER BY language, rank_position;',
    90,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 14. Kadane''s Algorithm (C++)
(
    'Kadanes Maximum Subarray (C++)',
    'kadane-cpp',
    'Linear dynamic programming scan identifying the maximum contiguous sum subarray.',
    'C++',
    'INTERMEDIATE',
    'Algorithms & DSA',
    'int maxSubArray(const vector<int>& nums) {
    int maxSoFar = nums[0];
    int currentMax = nums[0];
    for (size_t i = 1; i < nums.size(); ++i) {
        currentMax = max(nums[i], currentMax + nums[i]);
        maxSoFar = max(maxSoFar, currentMax);
    }
    return maxSoFar;
}',
    75,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 15. Valid Parentheses (C++)
(
    'Valid Parentheses Stack (C++)',
    'valid-parentheses-cpp',
    'LIFO stack validation of balanced syntactic delimiters in C++.',
    'C++',
    'BEGINNER',
    'Data Structures',
    'bool isValid(const string& s) {
    stack<char> st;
    for (char c : s) {
        if (c == ''('' || c == ''{'' || c == ''['') {
            st.push(c);
        } else {
            if (st.empty()) return false;
            char top = st.top();
            if ((c == '')'' && top != ''('') ||
                (c == ''}'' && top != ''{'') ||
                (c == '']'' && top != ''['')) return false;
            st.pop();
        }
    }
    return st.empty();
}',
    70,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
);

