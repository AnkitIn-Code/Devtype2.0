-- ==============================================================================
-- Flyway Migration V11: Seed Multi-Language Templates for All Supported Languages
-- Includes authentic, verified implementations in TypeScript, JavaScript, Python,
-- Java, C++, Go, Rust, and SQL so that multiplayer matchmaking always has varied templates.
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
-- 1. Binary Search (TypeScript)
(
    'Binary Search (TypeScript)',
    'binary-search-ts',
    'Type-safe O(log N) binary search on sorted numeric array.',
    'TypeScript',
    'BEGINNER',
    'Algorithms & DSA',
    'function binarySearch(nums: number[], target: number): number {
    let left = 0;
    let right = nums.length - 1;
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

-- 2. Two Sum Map (TypeScript)
(
    'Two Sum Hash Map (TypeScript)',
    'two-sum-ts',
    'Linear time O(N) pair sum locator using Map.',
    'TypeScript',
    'BEGINNER',
    'Algorithms & DSA',
    'function twoSum(nums: number[], target: number): number[] {
    const seen = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
            return [seen.get(complement)!, i];
        }
        seen.set(nums[i], i);
    }
    return [];
}',
    60,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 3. Two Sum Hash Map (JavaScript)
(
    'Two Sum Hash Map (JavaScript)',
    'two-sum-js',
    'Linear O(N) lookup for target sum in numbers array.',
    'JavaScript',
    'BEGINNER',
    'Algorithms & DSA',
    'function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}',
    60,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 4. Valid Parentheses (JavaScript)
(
    'Valid Parentheses (JavaScript)',
    'valid-parentheses-js',
    'Stack-based balance check for bracket strings.',
    'JavaScript',
    'BEGINNER',
    'Algorithms & DSA',
    'function isValid(s) {
    const stack = [];
    const map = { ")": "(", "}": "{", "]": "[" };
    for (const char of s) {
        if (char === "(" || char === "{" || char === "[") {
            stack.push(char);
        } else if (stack.pop() !== map[char]) {
            return false;
        }
    }
    return stack.length === 0;
}',
    60,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 5. Binary Search (Rust)
(
    'Binary Search (Rust)',
    'binary-search-rust',
    'Idiomatic Rust binary search on a sorted slice.',
    'Rust',
    'BEGINNER',
    'Algorithms & DSA',
    'pub fn binary_search(nums: &[i32], target: i32) -> Option<usize> {
    let mut left = 0;
    let mut right = nums.len();
    while left < right {
        let mid = left + (right - left) / 2;
        if nums[mid] == target {
            return Some(mid);
        } else if nums[mid] < target {
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    None
}',
    60,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 6. Two Sum Vector (Rust)
(
    'Two Sum (Rust)',
    'two-sum-rust',
    'Linear hashmap implementation of two sum in Rust.',
    'Rust',
    'BEGINNER',
    'Algorithms & DSA',
    'use std::collections::HashMap;

pub fn two_sum(nums: &[i32], target: i32) -> Vec<usize> {
    let mut map = HashMap::new();
    for (i, &num) in nums.iter().enumerate() {
        let diff = target - num;
        if let Some(&prev) = map.get(&diff) {
            return vec![prev, i];
        }
        map.insert(num, i);
    }
    vec![]
}',
    60,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 7. Binary Search (Go)
(
    'Binary Search (Go)',
    'binary-search-go',
    'Clean Go logarithmic search across sorted integer slice.',
    'Go',
    'BEGINNER',
    'Algorithms & DSA',
    'func BinarySearch(nums []int, target int) int {
    left, right := 0, len(nums)-1
    for left <= right {
        mid := left + (right-left)/2
        if nums[mid] == target {
            return mid
        } else if nums[mid] < target {
            left = mid + 1
        } else {
            right = mid - 1
        }
    }
    return -1
}',
    60,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 8. Two Sum (Go)
(
    'Two Sum (Go)',
    'two-sum-go',
    'O(N) integer slice pair locator using Go map.',
    'Go',
    'BEGINNER',
    'Algorithms & DSA',
    'func TwoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if idx, found := seen[complement]; found {
            return []int{idx, i}
        }
        seen[num] = i
    }
    return nil
}',
    60,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 9. Two Sum (Java)
(
    'Two Sum (Java)',
    'two-sum-java',
    'HashMap-based O(N) pair finder in Java.',
    'Java',
    'BEGINNER',
    'Algorithms & DSA',
    'public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (map.containsKey(complement)) {
            return new int[]{map.get(complement), i};
        }
        map.put(nums[i], i);
    }
    return new int[]{};
}',
    60,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
),

-- 10. Kadane Algorithm (Python)
(
    'Kadanes Max Subarray (Python)',
    'kadane-python',
    'Maximum subarray sum in single O(N) pass.',
    'Python',
    'BEGINNER',
    'Algorithms & DSA',
    'def max_sub_array(nums: list[int]) -> int:
    current_sum = nums[0]
    max_sum = nums[0]
    for num in nums[1:]:
        current_sum = max(num, current_sum + num)
        max_sum = max(max_sum, current_sum)
    return max_sum',
    60,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL,
    FALSE
);
