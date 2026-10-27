package com.devtype.demo;

import com.devtype.template.DifficultyLevel;
import com.devtype.template.PracticeTemplate;

import java.util.ArrayList;
import java.util.List;

/**
 * Predefined catalog containing 50+ authoritative, multi-language algorithms
 * (C++, C, Java, Python, JavaScript) and modern framework blueprints (React, Angular).
 */
public final class PredefinedTemplateCatalog {

    private PredefinedTemplateCatalog() {}

    private static PracticeTemplate create(
            String title, String slug, String description,
            String language, DifficultyLevel difficulty, String category,
            String content, int durationSeconds
    ) {
        PracticeTemplate t = new PracticeTemplate(title, slug, description, language, difficulty, category, content, durationSeconds);
        t.setPublished(true);
        return t;
    }

    public static List<PracticeTemplate> getAllTemplates() {
        List<PracticeTemplate> list = new ArrayList<>(60);

        // ══════════════════════════════════════════════════════════════════════
        // 1. BINARY SEARCH (C++, C, Java, Python, JavaScript)
        // ══════════════════════════════════════════════════════════════════════
        list.add(create(
                "Binary Search", "binary-search-cpp",
                "Logarithmic O(log N) search on a sorted integer vector with overflow-safe midpoint calculation.",
                "cpp", DifficultyLevel.BEGINNER, "Algorithms",
                """
                #include <vector>

                int binarySearch(const std::vector<int>& nums, int target) {
                    int left = 0;
                    int right = static_cast<int>(nums.size()) - 1;

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
                }""", 75
        ));

        list.add(create(
                "Binary Search", "binary-search-c",
                "Classic binary search in pure C using pointer indexing and bounds checking.",
                "c", DifficultyLevel.BEGINNER, "Algorithms",
                """
                int binarySearch(const int arr[], int size, int target) {
                    int left = 0;
                    int right = size - 1;

                    while (left <= right) {
                        int mid = left + (right - left) / 2;
                        if (arr[mid] == target) {
                            return mid;
                        } else if (arr[mid] < target) {
                            left = mid + 1;
                        } else {
                            right = mid - 1;
                        }
                    }
                    return -1;
                }""", 75
        ));

        list.add(create(
                "Binary Search", "binary-search-java",
                "Idiomatic Java binary search with zero-allocation while loop.",
                "java", DifficultyLevel.BEGINNER, "Algorithms",
                """
                public class BinarySearch {
                    public static int search(int[] nums, int target) {
                        int left = 0;
                        int right = nums.length - 1;

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
                    }
                }""", 75
        ));

        list.add(create(
                "Binary Search", "binary-search-python",
                "Pythonic binary search with type hints and floor division.",
                "python", DifficultyLevel.BEGINNER, "Algorithms",
                """
                from typing import List

                def binary_search(nums: List[int], target: int) -> int:
                    left, right = 0, len(nums) - 1

                    while left <= right:
                        mid = (left + right) // 2
                        if nums[mid] == target:
                            return mid
                        elif nums[mid] < target:
                            left = mid + 1
                        else:
                            right = mid - 1

                    return -1""", 60
        ));

        list.add(create(
                "Binary Search", "binary-search-javascript",
                "Modern JavaScript (ES6+) iterative binary search implementation.",
                "javascript", DifficultyLevel.BEGINNER, "Algorithms",
                """
                export function binarySearch(nums, target) {
                  let left = 0;
                  let right = nums.length - 1;

                  while (left <= right) {
                    const mid = Math.floor((left + right) / 2);
                    if (nums[mid] === target) {
                      return mid;
                    } else if (nums[mid] < target) {
                      left = mid + 1;
                    } else {
                      right = mid - 1;
                    }
                  }
                  return -1;
                }""", 65
        ));

        // ══════════════════════════════════════════════════════════════════════
        // 2. QUICK SORT (C++, C, Java, Python, JavaScript)
        // ══════════════════════════════════════════════════════════════════════
        list.add(create(
                "Quick Sort", "quick-sort-cpp",
                "In-place Lomuto partition scheme for cache-friendly quicksort in C++.",
                "cpp", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                #include <vector>
                #include <utility>

                int partition(std::vector<int>& arr, int low, int high) {
                    int pivot = arr[high];
                    int i = low - 1;

                    for (int j = low; j < high; ++j) {
                        if (arr[j] <= pivot) {
                            ++i;
                            std::swap(arr[i], arr[j]);
                        }
                    }
                    std::swap(arr[i + 1], arr[high]);
                    return i + 1;
                }

                void quickSort(std::vector<int>& arr, int low, int high) {
                    if (low < high) {
                        int pi = partition(arr, low, high);
                        quickSort(arr, low, pi - 1);
                        quickSort(arr, pi + 1, high);
                    }
                }""", 120
        ));

        list.add(create(
                "Quick Sort", "quick-sort-c",
                "Standard in-place quicksort partition implementation in C.",
                "c", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                static void swap(int* a, int* b) {
                    int t = *a;
                    *a = *b;
                    *b = t;
                }

                int partition(int arr[], int low, int high) {
                    int pivot = arr[high];
                    int i = low - 1;

                    for (int j = low; j < high; j++) {
                        if (arr[j] <= pivot) {
                            i++;
                            swap(&arr[i], &arr[j]);
                        }
                    }
                    swap(&arr[i + 1], &arr[high]);
                    return i + 1;
                }

                void quickSort(int arr[], int low, int high) {
                    if (low < high) {
                        int pi = partition(arr, low, high);
                        quickSort(arr, low, pi - 1);
                        quickSort(arr, pi + 1, high);
                    }
                }""", 120
        ));

        list.add(create(
                "Quick Sort", "quick-sort-java",
                "Java in-place quicksort algorithm with primitive array partitioning.",
                "java", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                public class QuickSort {
                    public static void sort(int[] arr, int low, int high) {
                        if (low < high) {
                            int pi = partition(arr, low, high);
                            sort(arr, low, pi - 1);
                            sort(arr, pi + 1, high);
                        }
                    }

                    private static int partition(int[] arr, int low, int high) {
                        int pivot = arr[high];
                        int i = low - 1;
                        for (int j = low; j < high; j++) {
                            if (arr[j] <= pivot) {
                                i++;
                                int temp = arr[i];
                                arr[i] = arr[j];
                                arr[j] = temp;
                            }
                        }
                        int temp = arr[i + 1];
                        arr[i + 1] = arr[high];
                        arr[high] = temp;
                        return i + 1;
                    }
                }""", 120
        ));

        list.add(create(
                "Quick Sort", "quick-sort-python",
                "Python quicksort using concise in-place partition.",
                "python", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                from typing import List

                def quick_sort(arr: List[int], low: int, high: int) -> None:
                    if low < high:
                        pivot = arr[high]
                        i = low - 1
                        for j in range(low, high):
                            if arr[j] <= pivot:
                                i += 1
                                arr[i], arr[j] = arr[j], arr[i]
                        arr[i + 1], arr[high] = arr[high], arr[i + 1]
                        pi = i + 1

                        quick_sort(arr, low, pi - 1)
                        quick_sort(arr, pi + 1, high)""", 100
        ));

        list.add(create(
                "Quick Sort", "quick-sort-javascript",
                "JavaScript array partition and recursive quicksort routine.",
                "javascript", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                export function quickSort(arr, low = 0, high = arr.length - 1) {
                  if (low < high) {
                    const pivot = arr[high];
                    let i = low - 1;

                    for (let j = low; j < high; j++) {
                      if (arr[j] <= pivot) {
                        i++;
                        [arr[i], arr[j]] = [arr[j], arr[i]];
                      }
                    }
                    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
                    const pi = i + 1;

                    quickSort(arr, low, pi - 1);
                    quickSort(arr, pi + 1, high);
                  }
                  return arr;
                }""", 110
        ));

        // ══════════════════════════════════════════════════════════════════════
        // 3. MERGE SORT (C++, C, Java, Python, JavaScript)
        // ══════════════════════════════════════════════════════════════════════
        list.add(create(
                "Merge Sort", "merge-sort-cpp",
                "Stable divide-and-conquer merge sort algorithm in C++.",
                "cpp", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                #include <vector>

                void merge(std::vector<int>& arr, int left, int mid, int right) {
                    std::vector<int> temp(right - left + 1);
                    int i = left, j = mid + 1, k = 0;

                    while (i <= mid && j <= right) {
                        temp[k++] = (arr[i] <= arr[j]) ? arr[i++] : arr[j++];
                    }
                    while (i <= mid) temp[k++] = arr[i++];
                    while (j <= right) temp[k++] = arr[j++];

                    for (int p = 0; p < k; ++p) {
                        arr[left + p] = temp[p];
                    }
                }

                void mergeSort(std::vector<int>& arr, int left, int right) {
                    if (left < right) {
                        int mid = left + (right - left) / 2;
                        mergeSort(arr, left, mid);
                        mergeSort(arr, mid + 1, right);
                        merge(arr, left, mid, right);
                    }
                }""", 140
        ));

        list.add(create(
                "Merge Sort", "merge-sort-c",
                "Divide and conquer merge sort with auxiliary array merging in C.",
                "c", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                #include <stdlib.h>

                void merge(int arr[], int left, int mid, int right) {
                    int n1 = mid - left + 1;
                    int n2 = right - mid;
                    int* L = (int*)malloc(n1 * sizeof(int));
                    int* R = (int*)malloc(n2 * sizeof(int));

                    for (int i = 0; i < n1; i++) L[i] = arr[left + i];
                    for (int j = 0; j < n2; j++) R[j] = arr[mid + 1 + j];

                    int i = 0, j = 0, k = left;
                    while (i < n1 && j < n2) {
                        arr[k++] = (L[i] <= R[j]) ? L[i++] : R[j++];
                    }
                    while (i < n1) arr[k++] = L[i++];
                    while (j < n2) arr[k++] = R[j++];

                    free(L);
                    free(R);
                }

                void mergeSort(int arr[], int left, int right) {
                    if (left < right) {
                        int mid = left + (right - left) / 2;
                        mergeSort(arr, left, mid);
                        mergeSort(arr, mid + 1, right);
                        merge(arr, left, mid, right);
                    }
                }""", 150
        ));

        list.add(create(
                "Merge Sort", "merge-sort-java",
                "Java recursive merge sort with temporary array copy.",
                "java", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                public class MergeSort {
                    public static void sort(int[] arr, int left, int right) {
                        if (left < right) {
                            int mid = left + (right - left) / 2;
                            sort(arr, left, mid);
                            sort(arr, mid + 1, right);
                            merge(arr, left, mid, right);
                        }
                    }

                    private static void merge(int[] arr, int left, int mid, int right) {
                        int[] temp = new int[right - left + 1];
                        int i = left, j = mid + 1, k = 0;

                        while (i <= mid && j <= right) {
                            temp[k++] = (arr[i] <= arr[j]) ? arr[i++] : arr[j++];
                        }
                        while (i <= mid) temp[k++] = arr[i++];
                        while (j <= right) temp[k++] = arr[j++];

                        System.arraycopy(temp, 0, arr, left, temp.length);
                    }
                }""", 135
        ));

        list.add(create(
                "Merge Sort", "merge-sort-python",
                "Python merge sort implementation with linear merge helper.",
                "python", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                from typing import List

                def merge_sort(arr: List[int]) -> List[int]:
                    if len(arr) <= 1:
                        return arr

                    mid = len(arr) // 2
                    left = merge_sort(arr[:mid])
                    right = merge_sort(arr[mid:])

                    merged = []
                    i = j = 0
                    while i < len(left) and j < len(right):
                        if left[i] <= right[j]:
                            merged.append(left[i])
                            i += 1
                        else:
                            merged.append(right[j])
                            j += 1

                    merged.extend(left[i:])
                    merged.extend(right[j:])
                    return merged""", 110
        ));

        list.add(create(
                "Merge Sort", "merge-sort-javascript",
                "JavaScript merge sort utilizing recursive slice and two pointers.",
                "javascript", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                export function mergeSort(arr) {
                  if (arr.length <= 1) return arr;

                  const mid = Math.floor(arr.length / 2);
                  const left = mergeSort(arr.slice(0, mid));
                  const right = mergeSort(arr.slice(mid));

                  const result = [];
                  let i = 0, j = 0;

                  while (i < left.length && j < right.length) {
                    if (left[i] <= right[j]) {
                      result.push(left[i++]);
                    } else {
                      result.push(right[j++]);
                    }
                  }
                  return result.concat(left.slice(i)).concat(right.slice(j));
                }""", 110
        ));

        // ══════════════════════════════════════════════════════════════════════
        // 4. TWO SUM (C++, C, Java, Python, JavaScript)
        // ══════════════════════════════════════════════════════════════════════
        list.add(create(
                "Two Sum", "two-sum-cpp",
                "Linear O(N) hash map solution finding two numbers that sum to target.",
                "cpp", DifficultyLevel.BEGINNER, "Algorithms",
                """
                #include <vector>
                #include <unordered_map>

                std::vector<int> twoSum(const std::vector<int>& nums, int target) {
                    std::unordered_map<int, int> seen;
                    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
                        int complement = target - nums[i];
                        if (seen.find(complement) != seen.end()) {
                            return {seen[complement], i};
                        }
                        seen[nums[i]] = i;
                    }
                    return {};
                }""", 70
        ));

        list.add(create(
                "Two Sum", "two-sum-c",
                "Two Sum two-pointer approach on sorted array in C.",
                "c", DifficultyLevel.BEGINNER, "Algorithms",
                """
                int twoSumSorted(const int numbers[], int size, int target, int* out1, int* out2) {
                    int left = 0;
                    int right = size - 1;

                    while (left < right) {
                        int sum = numbers[left] + numbers[right];
                        if (sum == target) {
                            *out1 = left + 1;
                            *out2 = right + 1;
                            return 1;
                        } else if (sum < target) {
                            left++;
                        } else {
                            right--;
                        }
                    }
                    return 0;
                }""", 75
        ));

        list.add(create(
                "Two Sum", "two-sum-java",
                "Optimal HashMap complement lookup in Java.",
                "java", DifficultyLevel.BEGINNER, "Algorithms",
                """
                import java.util.HashMap;
                import java.util.Map;

                public class TwoSum {
                    public static int[] findIndices(int[] nums, int target) {
                        Map<Integer, Integer> map = new HashMap<>();
                        for (int i = 0; i < nums.length; i++) {
                            int complement = target - nums[i];
                            if (map.containsKey(complement)) {
                                return new int[]{map.get(complement), i};
                            }
                            map.put(nums[i], i);
                        }
                        return new int[]{-1, -1};
                    }
                }""", 75
        ));

        list.add(create(
                "Two Sum", "two-sum-python",
                "Dict complement matching for Two Sum in Python.",
                "python", DifficultyLevel.BEGINNER, "Algorithms",
                """
                from typing import List, Tuple

                def two_sum(nums: List[int], target: int) -> Tuple[int, int]:
                    seen = {}
                    for i, num in enumerate(nums):
                        complement = target - num
                        if complement in seen:
                            return (seen[complement], i)
                        seen[num] = i
                    return (-1, -1)""", 60
        ));

        list.add(create(
                "Two Sum", "two-sum-javascript",
                "Map based Two Sum solution in JavaScript.",
                "javascript", DifficultyLevel.BEGINNER, "Algorithms",
                """
                export function twoSum(nums, target) {
                  const map = new Map();
                  for (let i = 0; i < nums.length; i++) {
                    const complement = target - nums[i];
                    if (map.has(complement)) {
                      return [map.get(complement), i];
                    }
                    map.set(nums[i], i);
                  }
                  return [];
                }""", 65
        ));

        // ══════════════════════════════════════════════════════════════════════
        // 5. LRU CACHE (C++, C, Java, Python, JavaScript)
        // ══════════════════════════════════════════════════════════════════════
        list.add(create(
                "LRU Cache", "lru-cache-cpp",
                "Doubly-linked list + hash map O(1) eviction cache in C++.",
                "cpp", DifficultyLevel.ADVANCED, "Algorithms",
                """
                #include <unordered_map>
                #include <list>

                class LRUCache {
                    int cap;
                    std::list<std::pair<int, int>> order;
                    std::unordered_map<int, std::list<std::pair<int, int>>::iterator> map;

                public:
                    explicit LRUCache(int capacity) : cap(capacity) {}

                    int get(int key) {
                        auto it = map.find(key);
                        if (it == map.end()) return -1;
                        order.splice(order.begin(), order, it->second);
                        return it->second->second;
                    }

                    void put(int key, int value) {
                        auto it = map.find(key);
                        if (it != map.end()) {
                            it->second->second = value;
                            order.splice(order.begin(), order, it->second);
                            return;
                        }
                        if (static_cast<int>(map.size()) >= cap) {
                            map.erase(order.back().first);
                            order.pop_back();
                        }
                        order.emplace_front(key, value);
                        map[key] = order.begin();
                    }
                };""", 180
        ));

        list.add(create(
                "LRU Cache", "lru-cache-c",
                "C implementation of Doubly Linked Node for LRU cache management.",
                "c", DifficultyLevel.ADVANCED, "Algorithms",
                """
                #include <stdlib.h>

                typedef struct Node {
                    int key;
                    int value;
                    struct Node* prev;
                    struct Node* next;
                } Node;

                typedef struct {
                    int capacity;
                    int count;
                    Node* head;
                    Node* tail;
                } LRUCache;

                Node* createNode(int key, int val) {
                    Node* node = (Node*)malloc(sizeof(Node));
                    node->key = key;
                    node->value = val;
                    node->prev = NULL;
                    node->next = NULL;
                    return node;
                }

                void moveToHead(LRUCache* cache, Node* node) {
                    if (cache->head == node) return;
                    if (node->prev) node->prev->next = node->next;
                    if (node->next) node->next->prev = node->prev;
                    if (cache->tail == node) cache->tail = node->prev;

                    node->next = cache->head;
                    node->prev = NULL;
                    if (cache->head) cache->head->prev = node;
                    cache->head = node;
                    if (!cache->tail) cache->tail = node;
                }""", 170
        ));

        list.add(create(
                "LRU Cache", "lru-cache-java",
                "Java LinkedHashMap backed LRU Cache with automatic removal of eldest entry.",
                "java", DifficultyLevel.ADVANCED, "Algorithms",
                """
                import java.util.LinkedHashMap;
                import java.util.Map;

                public class LRUCache<K, V> extends LinkedHashMap<K, V> {
                    private final int capacity;

                    public LRUCache(int capacity) {
                        super(capacity, 0.75f, true);
                        this.capacity = capacity;
                    }

                    @Override
                    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                        return size() > capacity;
                    }
                }""", 90
        ));

        list.add(create(
                "LRU Cache", "lru-cache-python",
                "Python OrderedDict implementation of O(1) LRU Cache.",
                "python", DifficultyLevel.ADVANCED, "Algorithms",
                """
                from collections import OrderedDict

                class LRUCache:
                    def __init__(self, capacity: int):
                        self.capacity = capacity
                        self.cache = OrderedDict()

                    def get(self, key: int) -> int:
                        if key not in self.cache:
                            return -1
                        self.cache.move_to_end(key)
                        return self.cache[key]

                    def put(self, key: int, value: int) -> None:
                        if key in self.cache:
                            self.cache.move_to_end(key)
                        elif len(self.cache) >= self.capacity:
                            self.cache.popitem(last=False)
                        self.cache[key] = value""", 100
        ));

        list.add(create(
                "LRU Cache", "lru-cache-javascript",
                "Modern ES6 Map-based LRU Cache preserving insertion order.",
                "javascript", DifficultyLevel.ADVANCED, "Algorithms",
                """
                export class LRUCache {
                  constructor(capacity) {
                    this.capacity = capacity;
                    this.cache = new Map();
                  }

                  get(key) {
                    if (!this.cache.has(key)) return -1;
                    const value = this.cache.get(key);
                    this.cache.delete(key);
                    this.cache.set(key, value);
                    return value;
                  }

                  put(key, value) {
                    if (this.cache.has(key)) {
                      this.cache.delete(key);
                    } else if (this.cache.size >= this.capacity) {
                      const oldestKey = this.cache.keys().next().value;
                      this.cache.delete(oldestKey);
                    }
                    this.cache.set(key, value);
                  }
                }""", 110
        ));

        // ══════════════════════════════════════════════════════════════════════
        // 6. INVERT BINARY TREE (C++, C, Java, Python, JavaScript)
        // ══════════════════════════════════════════════════════════════════════
        list.add(create(
                "Invert Binary Tree", "invert-binary-tree-cpp",
                "Recursive tree mirror transformation in C++.",
                "cpp", DifficultyLevel.BEGINNER, "Algorithms",
                """
                struct TreeNode {
                    int val;
                    TreeNode* left;
                    TreeNode* right;
                    explicit TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
                };

                TreeNode* invertTree(TreeNode* root) {
                    if (!root) return nullptr;
                    TreeNode* temp = root->left;
                    root->left = invertTree(root->right);
                    root->right = invertTree(temp);
                    return root;
                }""", 70
        ));

        list.add(create(
                "Invert Binary Tree", "invert-binary-tree-c",
                "Mirroring a binary tree using pointer swapping in C.",
                "c", DifficultyLevel.BEGINNER, "Algorithms",
                """
                #include <stddef.h>

                struct TreeNode {
                    int val;
                    struct TreeNode* left;
                    struct TreeNode* right;
                };

                struct TreeNode* invertTree(struct TreeNode* root) {
                    if (root == NULL) return NULL;
                    struct TreeNode* temp = root->left;
                    root->left = invertTree(root->right);
                    root->right = invertTree(temp);
                    return root;
                }""", 70
        ));

        list.add(create(
                "Invert Binary Tree", "invert-binary-tree-java",
                "Standard binary tree inversion in Java.",
                "java", DifficultyLevel.BEGINNER, "Algorithms",
                """
                public class InvertBinaryTree {
                    public static class TreeNode {
                        int val;
                        TreeNode left;
                        TreeNode right;
                        TreeNode(int val) { this.val = val; }
                    }

                    public static TreeNode invertTree(TreeNode root) {
                        if (root == null) return null;
                        TreeNode temp = root.left;
                        root.left = invertTree(root.right);
                        root.right = invertTree(temp);
                        return root;
                    }
                }""", 80
        ));

        list.add(create(
                "Invert Binary Tree", "invert-binary-tree-python",
                "Pythonic recursion to invert left and right subtrees.",
                "python", DifficultyLevel.BEGINNER, "Algorithms",
                """
                from typing import Optional

                class TreeNode:
                    def __init__(self, val=0, left=None, right=None):
                        self.val = val
                        self.left = left
                        self.right = right

                def invert_tree(root: Optional[TreeNode]) -> Optional[TreeNode]:
                    if not root:
                        return None
                    root.left, root.right = invert_tree(root.right), invert_tree(root.left)
                    return root""", 65
        ));

        list.add(create(
                "Invert Binary Tree", "invert-binary-tree-javascript",
                "JavaScript node swap to invert a binary tree.",
                "javascript", DifficultyLevel.BEGINNER, "Algorithms",
                """
                export function invertTree(root) {
                  if (!root) return null;
                  const temp = root.left;
                  root.left = invertTree(root.right);
                  root.right = invertTree(temp);
                  return root;
                }""", 55
        ));

        // ══════════════════════════════════════════════════════════════════════
        // 7. VALID PARENTHESES (C++, C, Java, Python, JavaScript)
        // ══════════════════════════════════════════════════════════════════════
        list.add(create(
                "Valid Parentheses", "valid-parentheses-cpp",
                "Stack based bracket balancing evaluation in C++.",
                "cpp", DifficultyLevel.BEGINNER, "Algorithms",
                """
                #include <string>
                #include <stack>

                bool isValid(const std::string& s) {
                    std::stack<char> st;
                    for (char c : s) {
                        if (c == '(') st.push(')');
                        else if (c == '{') st.push('}');
                        else if (c == '[') st.push(']');
                        else {
                            if (st.empty() || st.top() != c) return false;
                            st.pop();
                        }
                    }
                    return st.empty();
                }""", 75
        ));

        list.add(create(
                "Valid Parentheses", "valid-parentheses-c",
                "C array-based stack for bracket matching verification.",
                "c", DifficultyLevel.BEGINNER, "Algorithms",
                """
                int isValid(const char* s) {
                    char stack[10000];
                    int top = -1;

                    for (int i = 0; s[i] != '\\0'; i++) {
                        char c = s[i];
                        if (c == '(') stack[++top] = ')';
                        else if (c == '{') stack[++top] = '}';
                        else if (c == '[') stack[++top] = ']';
                        else {
                            if (top < 0 || stack[top] != c) return 0;
                            top--;
                        }
                    }
                    return top == -1;
                }""", 85
        ));

        list.add(create(
                "Valid Parentheses", "valid-parentheses-java",
                "ArrayDeque stack bracket matcher in Java.",
                "java", DifficultyLevel.BEGINNER, "Algorithms",
                """
                import java.util.ArrayDeque;
                import java.util.Deque;

                public class ValidParentheses {
                    public static boolean isValid(String s) {
                        Deque<Character> stack = new ArrayDeque<>();
                        for (char c : s.toCharArray()) {
                            if (c == '(') stack.push(')');
                            else if (c == '{') stack.push('}');
                            else if (c == '[') stack.push(']');
                            else if (stack.isEmpty() || stack.pop() != c) return false;
                        }
                        return stack.isEmpty();
                    }
                }""", 80
        ));

        list.add(create(
                "Valid Parentheses", "valid-parentheses-python",
                "Python stack and matching mapping for parenthesis balance.",
                "python", DifficultyLevel.BEGINNER, "Algorithms",
                """
                def is_valid(s: str) -> bool:
                    pairs = {')': '(', '}': '{', ']': '['}
                    stack = []

                    for char in s:
                        if char in pairs:
                            if not stack or stack[-1] != pairs[char]:
                                return False
                            stack.pop()
                        else:
                            stack.append(char)

                    return len(stack) == 0""", 70
        ));

        list.add(create(
                "Valid Parentheses", "valid-parentheses-javascript",
                "JavaScript array stack for bracket balance verification.",
                "javascript", DifficultyLevel.BEGINNER, "Algorithms",
                """
                export function isValid(s) {
                  const stack = [];
                  const pairs = { '(': ')', '{': '}', '[': ']' };

                  for (const char of s) {
                    if (pairs[char]) {
                      stack.push(pairs[char]);
                    } else if (stack.pop() !== char) {
                      return false;
                    }
                  }
                  return stack.length === 0;
                }""", 65
        ));

        // ══════════════════════════════════════════════════════════════════════
        // 8. BREADTH-FIRST SEARCH (C++, C, Java, Python, JavaScript)
        // ══════════════════════════════════════════════════════════════════════
        list.add(create(
                "Breadth-First Search", "bfs-traversal-cpp",
                "Queue-driven BFS level-order graph traversal in C++.",
                "cpp", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                #include <vector>
                #include <queue>

                std::vector<int> bfs(int start, const std::vector<std::vector<int>>& adj) {
                    std::vector<int> order;
                    std::vector<bool> visited(adj.size(), false);
                    std::queue<int> q;

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
                }""", 110
        ));

        list.add(create(
                "Breadth-First Search", "bfs-traversal-c",
                "BFS traversal implementation using circular array queue in C.",
                "c", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                #define MAX_NODES 100

                void bfsTraversal(int start, int numNodes, int adj[MAX_NODES][MAX_NODES], int outOrder[]) {
                    int visited[MAX_NODES] = {0};
                    int queue[MAX_NODES];
                    int front = 0, rear = 0;
                    int orderIdx = 0;

                    visited[start] = 1;
                    queue[rear++] = start;

                    while (front < rear) {
                        int curr = queue[front++];
                        outOrder[orderIdx++] = curr;

                        for (int i = 0; i < numNodes; i++) {
                            if (adj[curr][i] && !visited[i]) {
                                visited[i] = 1;
                                queue[rear++] = i;
                            }
                        }
                    }
                }""", 120
        ));

        list.add(create(
                "Breadth-First Search", "bfs-traversal-java",
                "Queue-based BFS traversal on adjacency list in Java.",
                "java", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                import java.util.*;

                public class GraphBFS {
                    public static List<Integer> traverse(int start, List<List<Integer>> adj) {
                        List<Integer> order = new ArrayList<>();
                        boolean[] visited = new boolean[adj.size()];
                        Queue<Integer> queue = new ArrayDeque<>();

                        visited[start] = true;
                        queue.add(start);

                        while (!queue.isEmpty()) {
                            int curr = queue.poll();
                            order.add(curr);

                            for (int neighbor : adj.get(curr)) {
                                if (!visited[neighbor]) {
                                    visited[neighbor] = true;
                                    queue.add(neighbor);
                                }
                            }
                        }
                        return order;
                    }
                }""", 110
        ));

        list.add(create(
                "Breadth-First Search", "bfs-traversal-python",
                "collections.deque driven BFS graph traversal in Python.",
                "python", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                from collections import deque
                from typing import List, Dict

                def bfs(start: int, graph: Dict[int, List[int]]) -> List[int]:
                    visited = {start}
                    queue = deque([start])
                    order = []

                    while queue:
                        node = queue.popleft()
                        order.append(node)

                        for neighbor in graph.get(node, []):
                            if neighbor not in visited:
                                visited.add(neighbor)
                                queue.append(neighbor)

                    return order""", 90
        ));

        list.add(create(
                "Breadth-First Search", "bfs-traversal-javascript",
                "JavaScript BFS graph traversal with Set tracking.",
                "javascript", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                export function bfs(startNode, graph) {
                  const visited = new Set([startNode]);
                  const queue = [startNode];
                  const order = [];

                  while (queue.length > 0) {
                    const node = queue.shift();
                    order.push(node);

                    for (const neighbor of graph[node] || []) {
                      if (!visited.has(neighbor)) {
                        visited.add(neighbor);
                        queue.push(neighbor);
                      }
                    }
                  }
                  return order;
                }""", 90
        ));

        // ══════════════════════════════════════════════════════════════════════
        // 9. DEPTH-FIRST SEARCH (C++, C, Java, Python, JavaScript)
        // ══════════════════════════════════════════════════════════════════════
        list.add(create(
                "Depth-First Search", "dfs-traversal-cpp",
                "Recursive DFS graph exploration with visited bitset in C++.",
                "cpp", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                #include <vector>

                void dfsHelper(int node, const std::vector<std::vector<int>>& adj,
                               std::vector<bool>& visited, std::vector<int>& order) {
                    visited[node] = true;
                    order.push_back(node);

                    for (int neighbor : adj[node]) {
                        if (!visited[neighbor]) {
                            dfsHelper(neighbor, adj, visited, order);
                        }
                    }
                }

                std::vector<int> dfs(int start, const std::vector<std::vector<int>>& adj) {
                    std::vector<int> order;
                    std::vector<bool> visited(adj.size(), false);
                    dfsHelper(start, adj, visited, order);
                    return order;
                }""", 95
        ));

        list.add(create(
                "Depth-First Search", "dfs-traversal-c",
                "Recursive DFS on adjacency matrix in C.",
                "c", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                #define MAX_NODES 100

                void dfsRecursive(int curr, int numNodes, int adj[MAX_NODES][MAX_NODES], int visited[], int outOrder[], int* idx) {
                    visited[curr] = 1;
                    outOrder[(*idx)++] = curr;

                    for (int i = 0; i < numNodes; i++) {
                        if (adj[curr][i] && !visited[i]) {
                            dfsRecursive(i, numNodes, adj, visited, outOrder, idx);
                        }
                    }
                }""", 90
        ));

        list.add(create(
                "Depth-First Search", "dfs-traversal-java",
                "Recursive DFS traversal on adjacency list in Java.",
                "java", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                import java.util.*;

                public class GraphDFS {
                    public static void explore(int node, List<List<Integer>> adj, boolean[] visited, List<Integer> order) {
                        visited[node] = true;
                        order.add(node);

                        for (int neighbor : adj.get(node)) {
                            if (!visited[neighbor]) {
                                explore(neighbor, adj, visited, order);
                            }
                        }
                    }
                }""", 85
        ));

        list.add(create(
                "Depth-First Search", "dfs-traversal-python",
                "Recursive DFS graph exploration in Python.",
                "python", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                from typing import List, Dict, Set

                def dfs(node: int, graph: Dict[int, List[int]], visited: Set[int], order: List[int]) -> None:
                    visited.add(node)
                    order.append(node)

                    for neighbor in graph.get(node, []):
                        if neighbor not in visited:
                            dfs(neighbor, graph, visited, order)""", 75
        ));

        list.add(create(
                "Depth-First Search", "dfs-traversal-javascript",
                "Recursive JavaScript DFS graph traversal.",
                "javascript", DifficultyLevel.INTERMEDIATE, "Algorithms",
                """
                export function dfs(node, graph, visited = new Set(), order = []) {
                  visited.add(node);
                  order.push(node);

                  for (const neighbor of graph[node] || []) {
                    if (!visited.has(neighbor)) {
                      dfs(neighbor, graph, visited, order);
                    }
                  }
                  return order;
                }""", 75
        ));

        // ══════════════════════════════════════════════════════════════════════
        // 10. KADANE'S ALGORITHM (C++, C, Java, Python, JavaScript)
        // ══════════════════════════════════════════════════════════════════════
        list.add(create(
                "Kadane's Algorithm", "kadane-algorithm-cpp",
                "O(N) dynamic programming maximum subarray sum in C++.",
                "cpp", DifficultyLevel.BEGINNER, "Algorithms",
                """
                #include <vector>
                #include <algorithm>

                int maxSubArray(const std::vector<int>& nums) {
                    int maxSoFar = nums[0];
                    int currentMax = nums[0];

                    for (size_t i = 1; i < nums.size(); ++i) {
                        currentMax = std::max(nums[i], currentMax + nums[i]);
                        maxSoFar = std::max(maxSoFar, currentMax);
                    }
                    return maxSoFar;
                }""", 65
        ));

        list.add(create(
                "Kadane's Algorithm", "kadane-algorithm-c",
                "Maximum contiguous subarray sum using Kadane's algorithm in C.",
                "c", DifficultyLevel.BEGINNER, "Algorithms",
                """
                int maxSubArray(const int arr[], int n) {
                    int maxSoFar = arr[0];
                    int currentMax = arr[0];

                    for (int i = 1; i < n; i++) {
                        currentMax = (arr[i] > currentMax + arr[i]) ? arr[i] : currentMax + arr[i];
                        if (currentMax > maxSoFar) {
                            maxSoFar = currentMax;
                        }
                    }
                    return maxSoFar;
                }""", 65
        ));

        list.add(create(
                "Kadane's Algorithm", "kadane-algorithm-java",
                "Single-pass maximum subarray sum in Java.",
                "java", DifficultyLevel.BEGINNER, "Algorithms",
                """
                public class KadaneAlgorithm {
                    public static int maxSubArray(int[] nums) {
                        int maxSoFar = nums[0];
                        int currentMax = nums[0];

                        for (int i = 1; i < nums.length; i++) {
                            currentMax = Math.max(nums[i], currentMax + nums[i]);
                            maxSoFar = Math.max(maxSoFar, currentMax);
                        }
                        return maxSoFar;
                    }
                }""", 65
        ));

        list.add(create(
                "Kadane's Algorithm", "kadane-algorithm-python",
                "Pythonic Kadane's algorithm for maximum subarray sum.",
                "python", DifficultyLevel.BEGINNER, "Algorithms",
                """
                from typing import List

                def max_sub_array(nums: List[int]) -> int:
                    max_so_far = current_max = nums[0]

                    for num in nums[1:]:
                        current_max = max(num, current_max + num)
                        max_so_far = max(max_so_far, current_max)

                    return max_so_far""", 55
        ));

        list.add(create(
                "Kadane's Algorithm", "kadane-algorithm-javascript",
                "Kadane's algorithm single-pass maximum subarray in JavaScript.",
                "javascript", DifficultyLevel.BEGINNER, "Algorithms",
                """
                export function maxSubArray(nums) {
                  let maxSoFar = nums[0];
                  let currentMax = nums[0];

                  for (let i = 1; i < nums.length; i++) {
                    currentMax = Math.max(nums[i], currentMax + nums[i]);
                    maxSoFar = Math.max(maxSoFar, currentMax);
                  }
                  return maxSoFar;
                }""", 60
        ));

        // ══════════════════════════════════════════════════════════════════════
        // 11. MODERN FRAMEWORKS — REACT (Hooks & State)
        // ══════════════════════════════════════════════════════════════════════
        list.add(create(
                "React useState Hook", "react-use-state",
                "React functional component state management with counter and input state updates.",
                "javascript", DifficultyLevel.BEGINNER, "Frameworks",
                """
                import React, { useState } from 'react';

                export function CounterWidget() {
                  const [count, setCount] = useState(0);
                  const [step, setStep] = useState(1);

                  const increment = () => setCount((prev) => prev + step);
                  const decrement = () => setCount((prev) => Math.max(0, prev - step));
                  const reset = () => setCount(0);

                  return {
                    count,
                    increment,
                    decrement,
                    reset,
                    setStep,
                  };
                }""", 75
        ));

        list.add(create(
                "React useEffect Hook", "react-use-effect",
                "Lifecycle management, event subscription listener, and teardown cleanup in React.",
                "javascript", DifficultyLevel.INTERMEDIATE, "Frameworks",
                """
                import { useState, useEffect } from 'react';

                export function useWindowResize() {
                  const [windowSize, setWindowSize] = useState({
                    width: window.innerWidth,
                    height: window.innerHeight,
                  });

                  useEffect(() => {
                    const handleResize = () => {
                      setWindowSize({
                        width: window.innerWidth,
                        height: window.innerHeight,
                      });
                    };

                    window.addEventListener('resize', handleResize);
                    return () => window.removeEventListener('resize', handleResize);
                  }, []);

                  return windowSize;
                }""", 90
        ));

        list.add(create(
                "React useMemo Hook", "react-use-memo",
                "Memoizing expensive calculations and filtering operations across renders.",
                "javascript", DifficultyLevel.INTERMEDIATE, "Frameworks",
                """
                import { useMemo } from 'react';

                export function useFilteredMetrics(records, threshold, query) {
                  const filteredRecords = useMemo(() => {
                    if (!records) return [];
                    return records
                      .filter((item) => item.accuracy >= threshold)
                      .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
                      .sort((a, b) => b.netWpm - a.netWpm);
                  }, [records, threshold, query]);

                  return filteredRecords;
                }""", 85
        ));

        list.add(create(
                "React useCallback Hook", "react-use-callback",
                "Stable function reference memoization to prevent child component re-renders.",
                "javascript", DifficultyLevel.INTERMEDIATE, "Frameworks",
                """
                import { useState, useCallback } from 'react';

                export function useSessionActions(onComplete) {
                  const [activeId, setActiveId] = useState(null);

                  const handleSelectSnippet = useCallback((snippet) => {
                    setActiveId(snippet.id);
                  }, []);

                  const handleFinishDrill = useCallback((metrics) => {
                    if (onComplete) {
                      onComplete({ snippetId: activeId, ...metrics });
                    }
                  }, [activeId, onComplete]);

                  return { activeId, handleSelectSnippet, handleFinishDrill };
                }""", 90
        ));

        list.add(create(
                "React Custom Hook (useDebounce)", "react-use-debounce",
                "Custom debounce hook delaying rapid user keystrokes for search input.",
                "javascript", DifficultyLevel.INTERMEDIATE, "Frameworks",
                """
                import { useState, useEffect } from 'react';

                export function useDebounce(value, delayMs = 300) {
                  const [debouncedValue, setDebouncedValue] = useState(value);

                  useEffect(() => {
                    const timer = setTimeout(() => {
                      setDebouncedValue(value);
                    }, delayMs);

                    return () => clearTimeout(timer);
                  }, [value, delayMs]);

                  return debouncedValue;
                }""", 80
        ));

        // ══════════════════════════════════════════════════════════════════════
        // 12. MODERN FRAMEWORKS — ANGULAR (Components, Services, Signals)
        // ══════════════════════════════════════════════════════════════════════
        list.add(create(
                "Angular Component", "angular-component",
                "Standalone Angular component decorator with input bindings and signals.",
                "javascript", DifficultyLevel.INTERMEDIATE, "Frameworks",
                """
                import { Component, Input, Output, EventEmitter } from '@angular/core';

                @Component({
                  selector: 'app-telemetry-badge',
                  standalone: true,
                  template: `
                    <div class="metric-chip">
                      <span class="label">{{ label }}:</span>
                      <strong class="value">{{ value }} WPM</strong>
                    </div>
                  `,
                })
                export class TelemetryBadgeComponent {
                  @Input() label: string = 'Velocity';
                  @Input() value: number = 0;
                  @Output() inspect = new EventEmitter<number>();

                  onInspect(): void {
                    this.inspect.emit(this.value);
                  }
                }""", 95
        ));

        list.add(create(
                "Angular Service & DI", "angular-service",
                "Injectable Angular singleton service managing HTTP state and observables.",
                "javascript", DifficultyLevel.INTERMEDIATE, "Frameworks",
                """
                import { Injectable } from '@angular/core';
                import { HttpClient } from '@angular/common/http';
                import { Observable, BehaviorSubject } from 'rxjs';

                @Injectable({
                  providedIn: 'root',
                })
                export class SrsService {
                  private deckSubject = new BehaviorSubject<any[]>([]);
                  public deck$ = this.deckSubject.asObservable();

                  constructor(private http: HttpClient) {}

                  fetchDueCards(): Observable<any[]> {
                    return this.http.get<any[]>('/api/v1/srs/due');
                  }
                }""", 100
        ));

        list.add(create(
                "Angular Signals Reactive State", "angular-signals",
                "Angular 17+ Signals reactive state, computed values, and effects.",
                "javascript", DifficultyLevel.INTERMEDIATE, "Frameworks",
                """
                import { signal, computed, effect } from '@angular/core';

                export class TypingEngineSignals {
                  keystrokes = signal(0);
                  errors = signal(0);
                  elapsedSeconds = signal(1);

                  grossWpm = computed(() => {
                    const minutes = this.elapsedSeconds() / 60;
                    return Math.round((this.keystrokes() / 5) / minutes);
                  });

                  accuracy = computed(() => {
                    const total = this.keystrokes();
                    if (total === 0) return 100;
                    return Math.round(((total - this.errors()) / total) * 100);
                  });
                }""", 90
        ));

        list.add(create(
                "Angular Custom Pipe", "angular-custom-pipe",
                "Custom Angular transformation pipe formatting duration and keystroke rates.",
                "javascript", DifficultyLevel.BEGINNER, "Frameworks",
                """
                import { Pipe, PipeTransform } from '@angular/core';

                @Pipe({
                  name: 'formatWpm',
                  standalone: true,
                })
                export class FormatWpmPipe implements PipeTransform {
                  transform(wpm: number, unit: string = 'WPM'): string {
                    if (wpm == null || isNaN(wpm)) return '0 ' + unit;
                    return Math.round(wpm) + ' ' + unit;
                  }
                }""", 65
        ));

        return list;
    }
}
