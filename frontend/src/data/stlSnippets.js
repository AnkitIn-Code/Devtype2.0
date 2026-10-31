// src/data/stlSnippets.js
// Standard Template Library (STL) Container Mastery Suite
// Comprehensive reference suite covering all 12 C++ Standard Container Headers:
// <array>, <vector>, <deque>, <forward_list>, <list>, <stack>,
// <queue>, <set>, <map>, <unordered_set>, <unordered_map>, <bitset>
// Complete with concrete call examples in function columns, real-world code snippet use cases,
// time complexities, memory architecture diagrams, and concise idiomatic code labs.

export const STL_SNIPPETS = [
  // ── 1. <array> ──
  {
    id: "stl-array",
    title: "std::array<T, N>: Fixed-Size Sequential Stack Container",
    slug: "stl-array",
    track: "stl",
    category: "STL Mastery",
    subCategory: "Sequential Containers",
    language: "C++",
    difficulty: "Beginner",
    tags: ["cpp", "stl", "array", "containers", "memory", "stack"],
    xpBounty: 45,
    paradigm: "Contiguous Zero-Overhead Static Buffer",
    coreConcept: "Fixed-size contiguous sequential memory allocated directly on the stack with complete standard container interface",
    timeComplexity: "O(1) Random Access [i] & at(), O(1) size(), O(N) fill() / swap()",
    spaceComplexity: "O(N) on stack (0 heap allocations, sizeof(T) * N)",
    description: "Standard C++ fixed-size contiguous sequence container encapsulating static stack arrays without pointer decay or heap allocation overhead.",
    theory: `#### Container Specification & Header Definition (<array>)
The \`std::array<T, N>\` container class template represents a sequence of $N$ elements of type $T$ stored in strict contiguous memory. Unlike built-in C-style arrays (\`T arr[N]\`), \`std::array\` is a first-class sequence container:
* It does not implicitly decay to a raw pointer (\`T*\`) when passed to functions.
* It supports standard copy construction, copy assignment (\`arr1 = arr2;\` in $O(N)$), and move semantics.
* It provides random-access iterators compatible with all standard algorithms in \`<algorithm>\`.
* The size $N$ is fixed at compile-time and forms an integral part of the type signature (\`array<int, 5>\` and \`array<int, 10>\` are entirely distinct types).

#### Internal Memory Model & ASCII Architecture
\`std::array<T, N>\` is implemented as an aggregate struct containing a single member array \`T _M_elements[N]\`.
* **Zero Overhead**: There is no heap pointer, no stored size integer, and no virtual table.
* **Exact Size**: Total memory footprint is strictly $N \\times \\text{sizeof}(T)$ bytes on the execution stack frame.

\`\`\`text
Stack Frame: std::array<int, 4> arr = {10, 20, 30, 40};
+---------------+---------------+---------------+---------------+
| Index 0: 10   | Index 1: 20   | Index 2: 30   | Index 3: 40   |
+---------------+---------------+---------------+---------------+
0x7ffd00        0x7ffd04        0x7ffd08        0x7ffd0C
^
arr.data() -> Direct pointer to first contiguous element (int*)
\`\`\`

#### Exhaustive Member Function Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Iterators** | \`arr.begin()\`, \`arr.end()\` | \`sort(arr.begin(), arr.end());\` | $O(1)$ | Random-access iterator to first element / past-the-end. |
| | \`arr.cbegin()\`, \`arr.cend()\` | \`for (auto it = arr.cbegin(); it != arr.cend(); ++it)\` | $O(1)$ | Read-only const iterator preventing element mutation. |
| | \`arr.rbegin()\`, \`arr.rend()\` | \`for (auto it = arr.rbegin(); it != arr.rend(); ++it)\` | $O(1)$ | Reverse iterator traversal from terminal element. |
| **Capacity** | \`arr.size()\` | \`for (size_t i = 0; i < arr.size(); ++i)\` | $O(1)$ | Returns compile-time constant $N$. |
| | \`arr.empty()\` | \`if (arr.empty()) return 0;\` | $O(1)$ | Returns \`true\` if compile-time template parameter $N == 0$. |
| | \`arr.max_size()\` | \`static_assert(arr.max_size() == 5);\` | $O(1)$ | Maximum potential elements supported (always $N$). |
| **Element Access** | \`arr[0]\` / \`arr[i]\` | \`sum += arr[i]; // fast unchecked inner loop\` | $O(1)$ | Direct pointer offset calculation without bounds checking. |
| | \`arr.at(2)\` | \`int val = arr.at(user_idx); // bounds safety\` | $O(1)$ | Checked access; throws \`std::out_of_range\` if $i \\ge N$. |
| | \`arr.front()\` | \`int first = arr.front();\` | $O(1)$ | Returns reference to the element at index 0. |
| | \`arr.back()\` | \`int last = arr.back();\` | $O(1)$ | Returns reference to the element at index $N - 1$. |
| | \`arr.data()\` | \`memcpy(buf, arr.data(), arr.size() * sizeof(int));\` | $O(1)$ | Returns direct pointer \`T*\` to contiguous stack buffer. |
| **Modifiers** | \`arr.fill(0)\` | \`arr.fill(0); // zero-initialize entire buffer\` | $O(N)$ | Assigns specified value to all elements in the array. |
| | \`arr.swap(other)\` | \`arr.swap(backup_arr);\` | $O(N)$ | Swaps elements pairwise with another array of same size $N$. |
| **Non-Member** | \`std::get<0>(arr)\` | \`auto [x, y, z] = arr; // structured bindings\` | $O(1)$ | Extracts reference to $I$-th element at compile-time. |

#### Iterator Invalidation Guarantees
* Iterators and references to elements are **never invalidated** during the entire lifetime of the array object.
* The buffer is destroyed strictly when the containing stack frame unwinds.

#### Common Pitfalls & Best Practices
1. **Large Stack Arrays**: Declaring a large array (e.g. \`array<int, 1000000>\`) inside a local function scope will cause an immediate **stack overflow** (Linux stack limits are typically 8MB). Use \`std::vector\` or declare the array globally/static for large buffers.
2. **Bounds Safety**: Use \`.at(i)\` when indexing is driven by untrusted external inputs or during debugging, and \`[i]\` inside hot computational loops after bounds are verified.`,
    code: `#include <bits/stdc++.h>
using namespace std;

class ArrayLab {
public:
    void demonstrate() {
        // 1. Initialization and compile-time size
        array<int, 5> a = {10, 20, 30, 40, 50};
        static_assert(a.size() == 5, "Size is fixed at 5");

        // 2. Element access: [] vs .at() vs .front() / .back()
        int fast = a[0];            // O(1) unchecked
        int safe = a.at(2);         // O(1) bounds-checked (throws on error)
        int first = a.front();      // 10
        int last = a.back();        // 50
        int* raw = a.data();        // Pointer to raw buffer: C API interop

        // 3. Modifiers: fill and swap
        array<int, 5> b;
        b.fill(99);                 // Sets all elements to 99 in O(N)
        a.swap(b);                  // Pairwise swap

        // 4. Structured bindings (C++17) & std::get
        array<int, 3> point = {1920, 1080, 60};
        auto [width, height, fps] = point;
        assert(get<0>(point) == 1920);

        // 5. STL algorithm interoperability
        sort(a.begin(), a.end());
    }
};`,
  },

  // ── 2. <vector> ──
  {
    id: "stl-vector",
    title: "std::vector<T>: Dynamic Contiguous Array & Capacity Growth",
    slug: "stl-vector",
    track: "stl",
    category: "STL Mastery",
    subCategory: "Sequential Containers",
    language: "C++",
    difficulty: "Beginner",
    tags: ["cpp", "stl", "vector", "containers", "memory", "capacity", "reserve"],
    xpBounty: 50,
    paradigm: "Amortized Constant-Time Contiguous Growth",
    coreConcept: "Contiguous heap buffer with geometric capacity doubling, reserve vs resize semantics, and in-place emplace_back",
    timeComplexity: "O(1) amortized push_back / emplace_back, O(1) random access [i], O(N) insert / erase",
    spaceComplexity: "Contiguous heap buffer with geometric doubling factor (2x / 1.5x)",
    description: "The primary C++ dynamic contiguous sequence container with amortized O(1) growth, memory reserve controls, and iterator invalidation safety.",
    theory: `#### Container Specification & Header Definition (<vector>)
\`std::vector<T>\` is a sequential container representing a dynamically sized contiguous array. It is the default sequence container recommended by the C++ Core Guidelines due to its unmatched cache locality, zero pointer indirection per element, and amortized constant-time append operations.

#### Internal 3-Pointer Memory Model & Reallocation Mechanics
Standard implementations of \`std::vector\` hold exactly three 64-bit pointers on the stack frame (occupying 24 bytes total):
* \`_M_start\`: Pointer to the first element of the allocated heap block.
* \`_M_finish\`: Pointer to one past the last initialized element (\`size() = _M_finish - _M_start\`).
* \`_M_end_of_storage\`: Pointer to the end of the reserved memory buffer (\`capacity() = _M_end_of_storage - _M_start\`).

\`\`\`text
Stack Object (24 Bytes):
+--------------------+--------------------+--------------------+
| _M_start           | _M_finish          | _M_end_of_storage  |
+---------+----------+---------+----------+---------+----------+
          |                    |                    |
          v                    v                    v
Heap:   [ 10 | 20 | 30 | 40 ] [ uninitialized slots ]
        |<--- size() = 4 --->|
        |<--------------- capacity() = 8 --------------------->|
\`\`\`

#### Exhaustive Member Function Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Iterators** | \`vec.begin()\`, \`vec.end()\` | \`sort(vec.begin(), vec.end());\` | $O(1)$ | Random-access iterators to contiguous buffer. |
| | \`vec.rbegin()\`, \`vec.rend()\` | \`int last = *vec.rbegin();\` | $O(1)$ | Scanning backwards from most recently pushed element. |
| **Capacity** | \`vec.size()\` | \`for (int i = 0; i < (int)vec.size(); ++i)\` | $O(1)$ | Checking current number of active initialized elements. |
| | \`vec.capacity()\` | \`if (vec.size() == vec.capacity()) ...\` | $O(1)$ | Monitoring allocated headroom before the next geometric reallocation. |
| | \`vec.empty()\` | \`if (vec.empty()) return;\` | $O(1)$ | Safety guard checking whether vector contains zero elements. |
| | \`vec.reserve(100000)\` | \`vec.reserve(n); // avoids repeated reallocations\` | $O(N)$ (if $n > C$) | Pre-allocates heap memory without changing \`size()\`. |
| | \`vec.resize(50, 0)\` | \`vec.resize(n, 0); // resets size and default values\` | $O(\\Delta N)$ | Changes \`size()\` to $n$, default-constructing or trimming elements. |
| | \`vec.shrink_to_fit()\`| \`vec.shrink_to_fit(); // frees unused headroom\` | $O(N)$ | Requests deallocation of excess capacity (\`capacity() -> size()\`). |
| **Element Access** | \`vec[0]\` / \`vec[i]\` | \`sum += vec[i];\` | $O(1)$ | Unchecked fast array indexing in performance-critical code. |
| | \`vec.at(3)\` | \`int x = vec.at(query_idx); // bounds-checked\` | $O(1)$ | Defensive indexing throwing \`std::out_of_range\` on breach. |
| | \`vec.front()\`, \`vec.back()\` | \`int head = vec.front(), tail = vec.back();\` | $O(1)$ | References to first and last elements. |
| | \`vec.data()\` | \`memcpy(dest, vec.data(), vec.size() * sizeof(int));\` | $O(1)$ | Direct pointer to contiguous heap array for C APIs. |
| **Modifiers** | \`vec.push_back(10)\` | \`vec.push_back(val);\` | $O(1)$ amortized | Appends element to end; copies or moves. |
| | \`vec.emplace_back(x, y)\` | \`vec.emplace_back(row, col); // in-place construction\` | $O(1)$ amortized | Constructs element in-place via placement new. |
| | \`vec.pop_back()\` | \`vec.pop_back(); // drop last element\` | $O(1)$ | Destroys last element and decrements \`_M_finish\`. |
| | \`vec.insert(pos, val)\` | \`vec.insert(vec.begin() + i, 42);\` | $O(N)$ | Inserts element at position, shifting rightward elements. |
| | \`vec.erase(pos)\` | \`vec.erase(vec.begin() + idx);\` | $O(N)$ | Erases element at position, shifting following elements left. |
| | \`vec.clear()\` | \`vec.clear(); // resets size to 0\` | $O(N)$ | Destroys all elements; \`size()\` becomes 0, capacity unchanged. |
| | \`vec.swap(other)\` | \`vec.swap(temp); // O(1) buffer swap\` | $O(1)$ | Swaps 3 internal pointers in constant time. |

#### Iterator Invalidation Rules
1. **Reallocation**: If insertion causes \`size() > capacity()\`, **every iterator, pointer, and reference** to vector elements is invalidated!
2. **No Reallocation**: If no reallocation occurs:
   * Insertions invalidate iterators and references at and after the insertion position.
   * Deletions invalidate iterators and references at and after the erasure position.
   * \`pop_back()\` invalidates only \`end()\` and the erased element.`,
    code: `#include <bits/stdc++.h>
using namespace std;

class VectorLab {
public:
    void demonstrate() {
        // 1. Capacity reservation to prevent reallocations
        vector<int> v;
        v.reserve(100);             // Capacity is 100, size is 0

        // 2. Modifiers: push_back vs emplace_back vs pop_back
        v.push_back(10);
        v.emplace_back(20);         // Constructs in-place
        v.pop_back();               // Removes 20

        // 3. Element access: [] vs .at() vs .data()
        int val = v[0];             // O(1) unchecked
        int safeVal = v.at(0);      // O(1) bounds-checked
        int* ptr = v.data();        // Direct pointer to underlying array

        // 4. Insertion and erasure
        v.insert(v.begin(), 5);     // v is now [5, 10]
        v.erase(v.begin());         // v is now [10]

        // 5. Shrink to fit and clear
        v.shrink_to_fit();          // Requests capacity == size
        v.clear();                  // size becomes 0, memory remains allocated

        // 6. C++20 Uniform Erasure
        vector<int> nums = {1, 2, 3, 2, 4, 2, 5};
        erase(nums, 2);             // Removes all 2s in O(N)
        erase_if(nums, [](int x) { return x % 2 != 0; }); // Predicate removal
    }
};`,
  },

  // ── 3. <deque> ──
  {
    id: "stl-deque",
    title: "std::deque<T>: Double-Ended Queue with Chunked Paged Buffers",
    slug: "stl-deque",
    track: "stl",
    category: "STL Mastery",
    subCategory: "Sequential Containers",
    language: "C++",
    difficulty: "Intermediate",
    tags: ["cpp", "stl", "deque", "containers", "queue", "sliding-window"],
    xpBounty: 55,
    paradigm: "Paged Multi-Chunk Array Architecture",
    coreConcept: "Non-contiguous paged array buffers providing O(1) insertion and removal at both front and back without full reallocation",
    timeComplexity: "O(1) push_front / push_back, O(1) pop_front / pop_back, O(1) random access [i]",
    spaceComplexity: "O(N) across multiple fixed-size pages + map pointer directory",
    description: "Double-ended sequence container supporting constant time push and pop operations at both boundaries without reallocating existing elements.",
    theory: `#### Container Specification & Header Definition (<deque>)
\`std::deque<T>\` (double-ended queue) is an indexed sequence container that allows fast $O(1)$ insertions and deletions at **both its beginning and its end**. Unlike \`std::vector\`, elements of a deque are **not** stored in a single contiguous memory block.

#### Internal Architecture: The Central Map & Paged Buffers
\`std::deque\` is structured around a two-level indexing hierarchy:
1. **Central Map Table**: A dynamically sized array of pointers to fixed-size memory chunks (pages, typically 512 bytes each).
2. **Fixed-Size Data Pages**: Contiguous blocks of memory that hold the actual elements.

\`\`\`text
Central Map Directory (Array of Pointers):
+---------+---------+---------+---------+
| Chunk 0 | Chunk 1 | Chunk 2 | Chunk 3 |
+----+----+----+----+----+----+----+----+
     |         |         |         |
     v         v         v         v
   [Page]    [Page]    [Page]    [Page]
   [a | b]   [c | d]   [e | f]   [g | h]
    ^                             ^
    Front Element                 Back Element
\`\`\`

#### Exhaustive Member Function Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Iterators** | \`dq.begin()\`, \`dq.end()\` | \`for (int x : dq) sum += x;\` | $O(1)$ | Random-access iterators across paged chunks. |
| **Capacity** | \`dq.size()\` | \`int count = dq.size();\` | $O(1)$ | Total number of elements across all pages. |
| | \`dq.empty()\` | \`if (dq.empty()) return -1;\` | $O(1)$ | Checks if deque contains 0 elements. |
| | \`dq.resize(20, 0)\` | \`dq.resize(k, 0);\` | $O(\\Delta N)$ | Truncates or extends deque with default value. |
| | \`dq.shrink_to_fit()\`| \`dq.shrink_to_fit(); // drops unused boundary chunks\` | $O(N)$ | Requests deallocation of unused boundary chunks. |
| **Element Access** | \`dq[2]\` | \`int mid = dq[dq.size() / 2];\` | $O(1)$ | Random indexing via 2-level pointer arithmetic. |
| | \`dq.at(4)\` | \`int x = dq.at(pos); // bounds-checked\` | $O(1)$ | Bounds-checked random indexing; throws \`std::out_of_range\`. |
| | \`dq.front()\`, \`dq.back()\` | \`int left = dq.front(), right = dq.back();\` | $O(1)$ | References to first and last elements. |
| **Modifiers** | \`dq.push_front(5)\` | \`dq.push_front(val); // O(1) prepend without shifting\` | $O(1)$ | Prepends element to front in constant time. |
| | \`dq.emplace_front(x)\` | \`dq.emplace_front(node_id);\` | $O(1)$ | Constructs element in-place at front in constant time. |
| | \`dq.push_back(10)\` | \`dq.push_back(val); // O(1) append\` | $O(1)$ | Appends element to end. |
| | \`dq.emplace_back(y)\` | \`dq.emplace_back(node_id);\` | $O(1)$ | Constructs element in-place at end. |
| | \`dq.pop_front()\` | \`if (dq.front() <= i - k) dq.pop_front();\` | $O(1)$ | Removes first element in constant time. |
| | \`dq.pop_back()\` | \`while (!dq.empty() && nums[dq.back()] <= x) dq.pop_back();\` | $O(1)$ | Removes last element in constant time. |
| | \`dq.insert(dq.begin(), 1)\` | \`dq.insert(dq.begin() + 1, val);\` | $O(N)$ | Inserts element at arbitrary position. |
| | \`dq.erase(dq.begin() + 1)\` | \`dq.erase(dq.begin() + 1);\` | $O(N)$ | Erases element at arbitrary position. |
| | \`dq.clear()\` | \`dq.clear(); // frees all paged chunks\` | $O(N)$ | Destroys all elements and frees pages. |

#### Invalidation Guarantees
* **Boundary Insertions (\`push_front\`, \`push_back\`)**: Invalidates iterators, but **preserves all pointers and references to existing elements**!
* **Boundary Deletions (\`pop_front\`, \`pop_back\`)**: Only invalidates iterators and references to the erased element.
* **Internal Insertions/Erasures**: Invalidate all iterators, pointers, and references.`,
    code: `#include <bits/stdc++.h>
using namespace std;

class DequeLab {
public:
    void demonstrate() {
        // 1. Dual-boundary O(1) operations
        deque<int> dq;
        dq.push_back(10);           // [10]
        dq.push_front(5);           // [5, 10]
        dq.emplace_back(20);        // [5, 10, 20]
        dq.emplace_front(1);        // [1, 5, 10, 20]

        // 2. Element access & bounds checking
        int frontElem = dq.front(); // 1
        int backElem  = dq.back();  // 20
        int second    = dq[1];      // 5 (O(1) random access)
        int safeVal   = dq.at(2);   // 10 (bounds checked)

        // 3. Boundary removals in O(1)
        dq.pop_front();             // Removes 1; dq is [5, 10, 20]
        dq.pop_back();              // Removes 20; dq is [5, 10]

        // 4. Sliding Window Maximum using monotonic deque
        vector<int> nums = {1, 3, -1, -3, 5, 3, 6, 7};
        int k = 3;
        deque<int> window;          // Stores indices
        vector<int> maxValues;

        for (int i = 0; i < (int)nums.size(); ++i) {
            if (!window.empty() && window.front() <= i - k)
                window.pop_front();
            while (!window.empty() && nums[window.back()] <= nums[i])
                window.pop_back();
            window.push_back(i);
            if (i >= k - 1)
                maxValues.push_back(nums[window.front()]);
        }
        assert(maxValues.front() == 3);
    }
};`,
  },

  // ── 4. <forward_list> ──
  {
    id: "stl-forward-list",
    title: "std::forward_list<T>: Minimalist Singly-Linked List",
    slug: "stl-forward-list",
    track: "stl",
    category: "STL Mastery",
    subCategory: "Sequential Containers",
    language: "C++",
    difficulty: "Intermediate",
    tags: ["cpp", "stl", "forward_list", "linked-list", "memory", "zero-overhead"],
    xpBounty: 50,
    paradigm: "Zero-Overhead Forward-Chained Nodes",
    coreConcept: "Singly-linked nodes maintaining only a forward next-pointer with zero size tracking overhead and after-node insertion semantics",
    timeComplexity: "O(1) push_front, O(1) insert_after, O(1) erase_after, O(N) search / linear traversal",
    spaceComplexity: "O(N) with exactly 1 pointer per node (sizeof(T) + sizeof(void*))",
    description: "Ultra-lean singly-linked list container offering zero memory overhead compared to raw C pointers, with insert_after and splice_after primitives.",
    theory: `#### Container Specification & Header Definition (<forward_list>)
\`std::forward_list<T>\` is a sequential container implemented as a **singly-linked list**. It is designed with the C++ zero-overhead principle in mind: when compared to a raw hand-written C singly-linked list, \`std::forward_list\` has **zero space or time penalty**.

#### The Zero-Overhead Design & Omission of \`size()\`
Unlike all other standard containers, \`std::forward_list\` deliberately provides **no \`.size()\` member function**:
* Maintaining a size counter would add 8 bytes of storage per list instance and would require $O(N)$ updates during operations like \`splice_after\`.
* Each node stores exclusively the element value and one pointer:
$$\\text{Node Size} = \\text{sizeof}(T) + \\text{sizeof}(\\text{pointer})$$

\`\`\`text
before_begin()      head
      [ * ] ------> [ 10 | * ] ------> [ 20 | * ] ------> [ 30 | nullptr ]
                        ^
                        insert_after(it, 15) splices node right here!
\`\`\`

#### Exhaustive Member Function Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Iterators** | \`fl.before_begin()\` | \`fl.insert_after(fl.before_begin(), head_val);\` | $O(1)$ | Returns iterator before the first element (for inserting at head). |
| | \`fl.begin()\`, \`fl.end()\` | \`for (int x : fl) { ... }\` | $O(1)$ | Forward iterators to list elements. |
| **Capacity** | \`fl.empty()\` | \`if (fl.empty()) return;\` | $O(1)$ | Checks if head pointer is \`nullptr\`. |
| **Element Access** | \`fl.front()\` | \`int head = fl.front();\` | $O(1)$ | Reference to the first element (no \`back()\`, no \`[]\`). |
| **Modifiers** | \`fl.push_front(10)\` | \`fl.push_front(node_val);\` | $O(1)$ | Prepends node as new head. |
| | \`fl.emplace_front(args)\` | \`fl.emplace_front(x, y);\` | $O(1)$ | Constructs element in-place as new head. |
| | \`fl.pop_front()\` | \`fl.pop_front(); // advance head\` | $O(1)$ | Removes head node; points head to \`head->next\`. |
| | \`fl.insert_after(it, 42)\` | \`fl.insert_after(it, new_val);\` | $O(1)$ | Inserts node immediately following \`pos\`. |
| | \`fl.emplace_after(it, x)\` | \`fl.emplace_after(it, x, y);\` | $O(1)$ | Constructs node in-place immediately following \`pos\`. |
| | \`fl.erase_after(it)\` | \`fl.erase_after(prev_it); // deletes node\` | $O(1)$ | Removes node immediately following \`pos\`. |
| | \`fl.clear()\` | \`fl.clear();\` | $O(N)$ | Destroys all nodes. |
| **Operations** | \`fl.splice_after(it, other)\` | \`fl.splice_after(fl.before_begin(), other);\` | $O(1)$ | Transfers nodes from \`other\` without allocating or copying! |
| | \`fl.remove(0)\` | \`fl.remove(0); // drops all 0 nodes\` | $O(N)$ | Erases all elements equal to \`val\`. |
| | \`fl.remove_if(pred)\` | \`fl.remove_if([](int x) { return x < 0; });\` | $O(N)$ | Erases elements matching predicate condition. |
| | \`fl.unique()\` | \`fl.unique(); // deduplicates consecutive\` | $O(N)$ | Eliminates consecutive duplicate elements. |
| | \`fl.sort()\` | \`fl.sort(); // O(N log N) node merge sort\` | $O(N \\log N)$ | Stable node merge-sort. |
| | \`fl.reverse()\` | \`fl.reverse(); // reverses pointers in-place\` | $O(N)$ | Inverts pointer direction in-place. |`,
    code: `#include <bits/stdc++.h>
using namespace std;

class ForwardListLab {
public:
    void demonstrate() {
        // 1. Initialization and push_front
        forward_list<int> fl = {20, 30, 40};
        fl.push_front(10);          // List: 10 -> 20 -> 30 -> 40

        // 2. insert_after using before_begin() for head insertion
        auto beforeHead = fl.before_begin();
        fl.insert_after(beforeHead, 5); // List: 5 -> 10 -> 20 -> 30 -> 40

        // 3. insert_after and erase_after on arbitrary iterators
        auto it = fl.begin();       // Points to 5
        fl.insert_after(it, 7);     // List: 5 -> 7 -> 10 -> 20 -> 30 -> 40
        fl.erase_after(it);          // Erases 7; List: 5 -> 10 -> 20 -> 30 -> 40

        // 4. O(1) splice_after (zero memory allocations)
        forward_list<int> other = {100, 200};
        fl.splice_after(fl.before_begin(), other); // other is spliced to front of fl
        assert(other.empty());

        // 5. In-place operations: sort, unique, reverse
        fl.sort();                  // O(N log N) node-based merge sort
        fl.unique();                // Removes consecutive duplicates
        fl.reverse();               // Reverses in-place in O(N)
    }
};`,
  },

  // ── 5. <list> ──
  {
    id: "stl-list",
    title: "std::list<T>: Doubly-Linked List & Constant-Time Splicing",
    slug: "stl-list",
    track: "stl",
    category: "STL Mastery",
    subCategory: "Sequential Containers",
    language: "C++",
    difficulty: "Intermediate",
    tags: ["cpp", "stl", "list", "doubly-linked", "lru-cache", "splicing"],
    xpBounty: 55,
    paradigm: "Bidirectional Pointers & Complete Iterator Invariance",
    coreConcept: "Doubly-linked nodes with constant-time node insertion and deletion anywhere, complete iterator invariance, and O(1) node splicing",
    timeComplexity: "O(1) insert / erase at known iterator, O(1) splice, O(N) search",
    spaceComplexity: "O(N) node overhead (each node stores T + prev pointer + next pointer: ~16 bytes overhead on 64-bit)",
    description: "Doubly-linked list container guaranteeing complete iterator invariance across insertions/deletions and constant-time node splicing.",
    theory: `#### Container Specification & Header Definition (<list>)
\`std::list<T>\` is a sequential container implemented as a **circular doubly-linked list** with a dummy sentinel node. It provides bidirectional iterators (\`it++\`, \`it--\`) and constant-time insertion and erasure at any point in the container once an iterator is known.

#### Complete Iterator Invariance: The Ultimate Guarantee
\`std::list\` offers the most robust iterator stability guarantees in the C++ Standard Library:
* **Insertion**: Inserting elements anywhere in the list **never invalidates any iterators, pointers, or references** to other elements.
* **Deletion**: Erasing an element invalidates **only** iterators pointing to the specific deleted element; all other iterators remain perfectly valid.

\`\`\`text
Sentinel Dummy Node <-----------------+
   | (prev)             (next)        |
   v                      v           |
[ Node: 10 ] <=======> [ Node: 20 ] <=+
  prev | next            prev | next
\`\`\`

#### Exhaustive Member Function Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Iterators** | \`lst.begin()\`, \`lst.end()\` | \`for (auto it = lst.begin(); it != lst.end(); ++it)\` | $O(1)$ | Bidirectional iterators to head / sentinel. |
| | \`lst.rbegin()\`, \`lst.rend()\` | \`for (auto it = lst.rbegin(); it != lst.rend(); ++it)\` | $O(1)$ | Reverse bidirectional traversal. |
| **Capacity** | \`lst.size()\` | \`if (lst.size() >= MAX_CAP) { ... }\` | $O(1)$ | Number of active nodes in list (guaranteed $O(1)$ since C++11). |
| | \`lst.empty()\` | \`if (!lst.empty()) { ... }\` | $O(1)$ | Checks if list has 0 nodes. |
| **Element Access** | \`lst.front()\`, \`lst.back()\` | \`int head = lst.front(), tail = lst.back();\` | $O(1)$ | References to first and last elements (no \`[]\`, no \`at()\`). |
| **Modifiers** | \`lst.push_front(10)\` | \`lst.push_front(val);\` | $O(1)$ | Inserts at head boundary without moving existing nodes. |
| | \`lst.push_back(20)\` | \`lst.push_back(val);\` | $O(1)$ | Inserts at tail boundary. |
| | \`lst.pop_front()\`, \`lst.pop_back()\` | \`lst.pop_front(); lst.pop_back();\` | $O(1)$ | Removes head / tail nodes. |
| | \`lst.insert(it, 15)\` | \`lst.insert(it, val); // pointer invariant\` | $O(1)$ | Inserts before \`pos\` in constant time. |
| | \`lst.erase(it)\` | \`it = lst.erase(it); // safe iterator advance\` | $O(1)$ | Removes node at \`pos\` in constant time. |
| | \`lst.clear()\` | \`lst.clear();\` | $O(N)$ | Destroys all nodes in list. |
| **Operations** | \`lst.splice(pos, cache, it)\` | \`active.splice(active.begin(), cache, it); // LRU promote\` | $O(1)$ | Transits node from \`other\` to \`pos\` in $O(1)$ time! |
| | \`lst.remove(0)\` | \`lst.remove(val);\` | $O(N)$ | Erases matching nodes without shifting. |
| | \`lst.remove_if(pred)\` | \`lst.remove_if([](int x) { return x % 2 == 0; });\` | $O(N)$ | Conditional node deletion matching predicate. |
| | \`lst.unique()\` | \`lst.unique();\` | $O(N)$ | Eliminates consecutive duplicate nodes. |
| | \`lst.merge(other)\` | \`lst.merge(other); // merges sorted lists\` | $O(N)$ | Merges two sorted lists in-place. |
| | \`lst.sort()\` | \`lst.sort(); // O(N log N) merge sort\` | $O(N \\log N)$ | Stable node-based bottom-up merge sort. |
| | \`lst.reverse()\` | \`lst.reverse();\` | $O(N)$ | Swaps \`prev\` and \`next\` on all nodes. |`,
    code: `#include <bits/stdc++.h>
using namespace std;

class ListLab {
public:
    void demonstrate() {
        // 1. Boundary operations
        list<int> l = {10, 20, 30};
        l.push_front(5);            // [5, 10, 20, 30]
        l.push_back(40);            // [5, 10, 20, 30, 40]

        // 2. O(1) Insertion & Deletion at known iterator
        auto it = find(l.begin(), l.end(), 20);
        if (it != l.end()) {
            l.insert(it, 15);       // Inserts before 20: [5, 10, 15, 20, 30, 40]
            l.erase(it);            // Erases 20: [5, 10, 15, 30, 40]
        }

        // 3. O(1) Sublist Splicing (LRU Cache Primitive)
        list<int> active = {1, 2, 3};
        list<int> cache = {100, 200};
        // Splice node 100 to front of active list without copying
        active.splice(active.begin(), cache, cache.begin());
        assert(active.front() == 100);

        // 4. In-place algorithms
        active.sort();              // O(N log N) list merge sort
        active.reverse();           // O(N) in-place reversal
    }
};`,
  },

  // ── 6. <stack> ──
  {
    id: "stl-stack",
    title: "std::stack<T>: LIFO Container Adaptor Architecture",
    slug: "stl-stack",
    track: "stl",
    category: "STL Mastery",
    subCategory: "Container Adaptors",
    language: "C++",
    difficulty: "Beginner",
    tags: ["cpp", "stl", "stack", "adaptor", "lifo", "monotonic-stack"],
    xpBounty: 45,
    paradigm: "Restricted Access Last-In-First-Out Discipline",
    coreConcept: "Wrapping underlying sequential containers into a strict LIFO interface with exception-safe push, pop, and top operations",
    timeComplexity: "O(1) push / emplace, O(1) pop, O(1) top, O(1) empty, O(1) size",
    spaceComplexity: "O(N) determined by the underlying sequential container",
    description: "Standard LIFO container adaptor restricting access to the top element, templated over sequential backings with deque as default.",
    theory: `#### Container Specification & Header Definition (<stack>)
\`std::stack<T, Container>\` is not a first-class memory container; it is a **container adaptor**. It encapsulates an underlying sequential container and exposes exclusively a strict Last-In, First-Out (LIFO) interface:
\`\`\`cpp
template <class T, class Container = std::deque<T>>
class stack;
\`\`\`

#### Why \`std::deque\` is the Default Container
* \`std::vector\` must reallocate memory when full, causing latency spikes and copying elements.
* \`std::list\` allocates individual nodes on the heap, incurring 16 bytes of pointer overhead per element.
* \`std::deque\` allocates memory in chunks without relocating existing elements, balancing $O(1)$ push/pop performance with superior cache locality.

\`\`\`text
push(10) -> push(20) -> push(30)
+-----------------------+
| Top Element: 30       |  <--- stk.top()
+-----------------------+
| Element: 20           |
+-----------------------+
| Bottom Element: 10    |
+-----------------------+
stk.pop() discards 30 in O(1) -> 20 becomes the new top!
\`\`\`

#### Exhaustive Member Function Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Capacity** | \`stk.empty()\` | \`while (!stk.empty()) { ... }\` | $O(1)$ | Returns \`c.empty()\`; true if stack has 0 elements. |
| | \`stk.size()\` | \`int depth = stk.size();\` | $O(1)$ | Returns \`c.size()\`; total elements on stack. |
| **Element Access** | \`stk.top()\` | \`int curr = stk.top();\` | $O(1)$ | Returns \`c.back()\`; reference to topmost element. |
| **Modifiers** | \`stk.push(0)\` | \`stk.push(node_id); // push state onto LIFO frame\` | $O(1)$ | Calls \`c.push_back(val)\`; appends element onto stack. |
| | \`stk.emplace(x, y)\` | \`stk.emplace(row, col); // in-place construction\` | $O(1)$ | Calls \`c.emplace_back(args...)\`. |
| | \`stk.pop()\` | \`if (!stk.empty()) stk.pop();\` | $O(1)$ | Calls \`c.pop_back()\`; removes top element. Returns \`void\`! |
| | \`stk.swap(other)\` | \`stk.swap(backup_stk);\` | $O(1)$ | Exchanges underlying container contents. |

#### Exception Safety: Why \`pop()\` Returns \`void\`
If \`pop()\` returned the element by value, it would invoke a copy/move constructor while returning. If that constructor threw an exception, the element would already have been removed from the stack and permanently lost! By separating \`top()\` (inspection) from \`pop()\` (removal), the strong exception guarantee is preserved.`,
    code: `#include <bits/stdc++.h>
using namespace std;

class StackLab {
public:
    void demonstrate() {
        // 1. Default stack backed by std::deque
        stack<int> s;
        s.push(10);
        s.push(20);
        s.emplace(30);              // Constructs in-place

        // 2. Top inspection and removal
        int topVal = s.top();       // 30
        s.pop();                    // Removes 30; top is now 20
        assert(s.top() == 20);

        // 3. Custom container backing: std::vector
        stack<int, vector<int>> vecStack;
        vecStack.push(100);
        vecStack.push(200);

        // 4. Classic Balanced Parentheses Validation
        string brackets = "{[()]}";
        stack<char> st;
        bool valid = true;
        for (char ch : brackets) {
            if (ch == '{' || ch == '[' || ch == '(') st.push(ch);
            else {
                if (st.empty()) { valid = false; break; }
                char t = st.top(); st.pop();
                if ((ch == '}' && t != '{') || (ch == ']' && t != '[') || (ch == ')' && t != '(')) {
                    valid = false; break;
                }
            }
        }
        assert(valid && st.empty());
    }
};`,
  },

  // ── 7. <queue> ──
  {
    id: "stl-queue",
    title: "std::queue<T> & std::priority_queue<T>: FIFO & Binary Heap Adaptors",
    slug: "stl-queue",
    track: "stl",
    category: "STL Mastery",
    subCategory: "Container Adaptors",
    language: "C++",
    difficulty: "Intermediate",
    tags: ["cpp", "stl", "queue", "priority_queue", "heap", "fifo", "dijkstra"],
    xpBounty: 60,
    paradigm: "FIFO Streaming & Maximally Ordered Binary Heaps",
    coreConcept: "Standard FIFO queues for breadth-first scheduling alongside logarithmic binary max/min-heap priority queues",
    timeComplexity: "Queue: O(1) push/pop/front. Priority Queue: O(log N) push/pop, O(1) top, O(N) linear build",
    spaceComplexity: "O(N) contiguous or chunked sequential memory",
    description: "Container adaptors for standard FIFO queues and logarithmic binary heap priority queues supporting min-heap and custom comparators.",
    theory: `#### Container Specification & Header Definition (<queue>)
The \`<queue>\` header defines two distinct container adaptors:
1. **\`std::queue<T, Container = std::deque<T>>\`**: Strict First-In, First-Out (FIFO) queue.
2. **\`std::priority_queue<T, Container = std::vector<T>, Compare = std::less<T>>\`**: Complete binary heap.

#### FIFO Queue vs Priority Queue Architecture
\`\`\`text
std::queue (FIFO):
Front (pop)                                   Back (push)
  [ 10 ] <------- [ 20 ] <------- [ 30 ] <------- [ 40 ]

std::priority_queue (Binary Heap):
                 [ 90 ] (Root index 0)
                /      \\
            [ 70 ]    [ 80 ]
             /   \\
          [ 30 ] [ 50 ]
Array Storage: [ 90 | 70 | 80 | 30 | 50 ]
Parent(i) = (i-1)/2, LeftChild(i) = 2*i + 1, RightChild(i) = 2*i + 2
\`\`\`

#### Exhaustive Member Function Reference Table
**Part A: \`std::queue\` (FIFO Queue)**
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Capacity** | \`q.empty()\` | \`while (!q.empty()) { ... } // BFS loop\` | $O(1)$ | Checks if queue contains 0 elements. |
| | \`q.size()\` | \`int level_size = q.size();\` | $O(1)$ | Counting active items or level-size in level-order BFS. |
| **Element Access** | \`q.front()\` | \`int u = q.front(); q.pop();\` | $O(1)$ | Accesses next element to be popped. |
| | \`q.back()\` | \`int last_enqueued = q.back();\` | $O(1)$ | Accesses most recently pushed element. |
| **Modifiers** | \`q.push(0)\` | \`q.push(start_node); // enqueue vertex\` | $O(1)$ | Enqueues element at back (\`c.push_back\`). |
| | \`q.emplace(u, d)\` | \`q.emplace(neighbor, dist + 1);\` | $O(1)$ | Constructs element in-place at back. |
| | \`q.pop()\` | \`q.pop(); // dequeues front item\` | $O(1)$ | Dequeues element from front (\`c.pop_front\`). |
| | \`q.swap(other)\` | \`q.swap(q2);\` | $O(1)$ | Swaps underlying containers. |

**Part B: \`std::priority_queue\` (Binary Heap)**
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Capacity** | \`pq.empty()\` | \`while (!pq.empty()) { ... } // Dijkstra loop\` | $O(1)$ | Termination condition check in greedy algorithms. |
| | \`pq.size()\` | \`int active_candidates = pq.size();\` | $O(1)$ | Number of active elements in heap. |
| **Element Access** | \`pq.top()\` | \`auto [d, u] = pq.top();\` | $O(1)$ | Accesses highest priority element (heap root). |
| **Modifiers** | \`pq.push(30)\` | \`pq.push({dist[v], v}); // log(N) sift-up\` | $O(\\log N)$ | Inserts element and performs sift-up. |
| | \`pq.emplace(w, u)\` | \`pq.emplace(weight, target);\` | $O(\\log N)$ | Constructs candidate in-place and sifts up. |
| | \`pq.pop()\` | \`pq.pop(); // discard root and sift-down\` | $O(\\log N)$ | Swaps root with last element, sifts down, and removes. |
| | \`pq.swap(other)\` | \`pq.swap(pq_backup);\` | $O(1)$ | Swaps underlying heap vector and comparator in $O(1)$. |`,
    code: `#include <bits/stdc++.h>
using namespace std;

class QueueLab {
public:
    void demonstrate() {
        // 1. Standard FIFO Queue (BFS traversal)
        queue<int> q;
        q.push(10);
        q.push(20);
        int frontVal = q.front();   // 10
        int backVal  = q.back();    // 20
        q.pop();                    // Removes 10; front is now 20

        // 2. Default Max-Heap
        priority_queue<int> maxHeap;
        maxHeap.push(10);
        maxHeap.push(30);
        maxHeap.push(20);
        assert(maxHeap.top() == 30);

        // 3. Min-Heap using std::greater
        priority_queue<int, vector<int>, greater<int>> minHeap;
        minHeap.push(10);
        minHeap.push(30);
        minHeap.push(20);
        assert(minHeap.top() == 10);

        // 4. O(N) Linear Time Bulk Heap Construction
        vector<int> raw = {5, 2, 8, 1, 9, 3};
        priority_queue<int> bulkHeap(raw.begin(), raw.end()); // O(N) make_heap!
    }
};`,
  },

  // ── 8. <set> ──
  {
    id: "stl-set",
    title: "std::set<T> & std::multiset<T>: Ordered Red-Black Trees",
    slug: "stl-set",
    track: "stl",
    category: "STL Mastery",
    subCategory: "Associative Containers",
    language: "C++",
    difficulty: "Intermediate",
    tags: ["cpp", "stl", "set", "multiset", "red-black-tree", "bst", "ordering"],
    xpBounty: 60,
    paradigm: "Self-Balancing Binary Search Tree Invariant",
    coreConcept: "Strict weak ordering with logarithmic search, insertion, and deletion, range queries via lower_bound and upper_bound, and multiset single-element erasure",
    timeComplexity: "O(log N) insert, O(log N) erase, O(log N) find, O(log N) lower_bound / upper_bound",
    spaceComplexity: "O(N) node allocations (each node has parent, left, right pointers + color bit: ~32-40 bytes per node)",
    description: "Sorted associative containers implemented as self-balancing Red-Black trees supporting logarithmic lookups and range queries.",
    theory: `#### Container Specification & Header Definition (<set>)
The \`<set>\` header provides ordered associative containers:
1. **\`std::set<Key, Compare = std::less<Key>>\`**: Unique keys sorted by strict weak ordering.
2. **\`std::multiset<Key, Compare = std::less<Key>>\`**: Allows duplicate keys.

#### Red-Black Tree Invariant & Memory Structure
Elements are stored inside a self-balancing Red-Black binary search tree:
* Every node stores the element $T$, pointers to \`parent\`, \`left\`, and \`right\`, and a color flag (Red or Black).
* The tree height is strictly bounded by $h \\le 2 \\log_2(N + 1)$, guaranteeing **$O(\\log N)$ worst-case** lookups, insertions, and deletions.

\`\`\`text
                 [ 20 (Black) ]
                /              \\
         [ 10 (Red) ]       [ 30 (Red) ]
         /          \\
    [ 5 (Black) ] [ 15 (Black) ]
\`\`\`

#### Exhaustive Member Function Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Iterators** | \`s.begin()\`, \`s.end()\` | \`for (int x : s) cout << x << " ";\` | $O(1)$ | In-order traversal yielding keys in sorted order. |
| **Capacity** | \`s.size()\` | \`int unique_count = s.size();\` | $O(1)$ | Number of active elements. |
| | \`s.empty()\` | \`if (s.empty()) return 0;\` | $O(1)$ | Checks if set contains 0 elements. |
| **Modifiers** | \`s.insert(42)\` | \`auto [it, inserted] = s.insert(val);\` | $O(\\log N)$ | Inserts element; in \`set\`, returns false if duplicate. |
| | \`s.emplace(42)\` | \`s.emplace(coord);\` | $O(\\log N)$ | Constructs element directly in tree node. |
| | \`s.erase(it)\` | \`auto it = s.find(val); if (it != s.end()) s.erase(it);\` | Amortized $O(1)$ | Erases node at \`pos\`; returns following iterator. |
| | \`s.erase(42)\` | \`s.erase(val); // deletes ALL copies in multiset\` | $O(\\log N + K)$ | Erases matching keys. In \`multiset\`, wipes ALL copies! |
| | \`s.extract(42)\` | \`auto node = s.extract(val); node.value() = 99; s.insert(move(node));\` | $O(1)$ amortized | Extracts node handle without destroying memory! |
| | \`s.clear()\` | \`s.clear(); // destroys all tree nodes\` | $O(N)$ | Destroys all nodes. |
| **Lookup** | \`s.find(42)\` | \`if (s.find(val) != s.end()) { ... }\` | $O(\\log N)$ | Returns iterator to key, or \`end()\` if absent. |
| | \`s.count(42)\` | \`int copies = ms.count(val);\` | $O(\\log N + K)$ | In \`set\`: returns 0 or 1. In \`multiset\`: returns frequency. |
| | \`s.contains(42)\` | \`if (s.contains(val)) { ... } // C++20\` | $O(\\log N)$ | Returns \`true\` if key exists. |
| | \`s.lower_bound(10)\` | \`auto it = s.lower_bound(k); // first element >= k\` | $O(\\log N)$ | First element that is **greater than or equal to** $k$. |
| | \`s.upper_bound(10)\` | \`auto it = s.upper_bound(k); // first element > k\` | $O(\\log N)$ | First element that is **strictly greater than** $k$. |
| | \`s.equal_range(10)\` | \`auto [low, high] = ms.equal_range(k);\` | $O(\\log N)$ | Returns \`{lower_bound(k), upper_bound(k)}\`. |

#### Multiset Erase Pitfall & Safe Idiom
* Calling \`ms.erase(val)\` erases **ALL** occurrences of \`val\` in $O(\\log N + K)$.
* To erase only **one single instance**, pass the iterator:
\`\`\`cpp
auto it = ms.find(val);
if (it != ms.end()) ms.erase(it); // Erases strictly ONE instance!
\`\`\``,
    code: `#include <bits/stdc++.h>
using namespace std;

class SetLab {
public:
    void demonstrate() {
        // 1. Unique set insertion and C++20 contains
        set<int> s = {10, 25, 40, 55, 70};
        auto [it, inserted] = s.insert(30);
        assert(inserted == true);
        assert(s.contains(25));      // C++20 O(log N) check

        // 2. Range queries: lower_bound vs upper_bound
        auto lb = s.lower_bound(25); // Points to 25 (first elem >= 25)
        auto ub = s.upper_bound(25); // Points to 30 (first elem > 25)

        // 3. Multiset duplicate handling and single-instance erasure
        multiset<int> ms = {5, 10, 10, 10, 20};
        assert(ms.count(10) == 3);

        // Correct idiom to erase strictly ONE copy:
        auto foundIt = ms.find(10);
        if (foundIt != ms.end()) ms.erase(foundIt);
        assert(ms.count(10) == 2);

        // 4. Node extraction (C++17)
        auto node = s.extract(40);   // Extracts node without reallocating
        node.value() = 45;           // Modify extracted key
        s.insert(move(node));        // Re-inserts in O(log N)
    }
};`,
  },

  // ── 9. <map> ──
  {
    id: "stl-map",
    title: "std::map<Key, Value>: Ordered Key-Value Red-Black Tree Dictionary",
    slug: "stl-map",
    track: "stl",
    category: "STL Mastery",
    subCategory: "Associative Containers",
    language: "C++",
    difficulty: "Intermediate",
    tags: ["cpp", "stl", "map", "multimap", "dictionary", "red-black-tree", "try_emplace"],
    xpBounty: 60,
    paradigm: "Sorted Key-Value Pairs & Strict Ordering",
    coreConcept: "Logarithmic dictionary mapping keys to values using Red-Black trees, operator[] default-insertion hazard, and modern try_emplace semantics",
    timeComplexity: "O(log N) search, O(log N) insert, O(log N) erase, O(log N) lower_bound / upper_bound",
    spaceComplexity: "O(N) node allocations storing std::pair<const Key, Value>",
    description: "Ordered key-value associative dictionary maintaining keys in sorted order with logarithmic lookups and try_emplace optimization.",
    theory: `#### Container Specification & Header Definition (<map>)
The \`<map>\` header provides ordered key-value associative containers:
1. **\`std::map<Key, Value, Compare = std::less<Key>>\`**: Unique keys mapped to values.
2. **\`std::multimap<Key, Value, Compare = std::less<Key>>\`**: Allows duplicate keys.

#### Key-Value Pair Storage & Const Keys
Every node in \`std::map\` contains:
\`\`\`cpp
std::pair<const Key, Value>
\`\`\`
Because the Red-Black Tree structure depends on the sorted invariant of keys, \`Key\` is strictly \`const\`. You can modify values in-place, but keys cannot be changed without node extraction or re-insertion.

\`\`\`text
                      [ {"Bob", 88} ]
                     /               \\
          [ {"Alice", 95} ]      [ {"Charlie", 92} ]
\`\`\`

#### Exhaustive Member Function Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Iterators** | \`mp.begin()\`, \`mp.end()\` | \`for (const auto& [k, v] : mp) { ... }\` | $O(1)$ | Yields \`pair<const Key, Value>\` sorted by key. |
| **Capacity** | \`mp.size()\` | \`int distinct_keys = mp.size();\` | $O(1)$ | Total mapped entries. |
| | \`mp.empty()\` | \`if (mp.empty()) return;\` | $O(1)$ | Checks if map contains 0 entries. |
| **Element Access** | \`mp["hits"]++\` | \`freq[word]++; // creates with 0 if absent\` | $O(\\log N)$ | Inserts default value if key is not found! |
| | \`mp.at("hits")\` | \`int val = mp.at(user_id); // safe lookup\` | $O(\\log N)$ | Checked access; throws \`std::out_of_range\` if missing. |
| **Modifiers** | \`mp.try_emplace("id", 100)\` | \`mp.try_emplace(key, HeavyObject(arg));\` | $O(\\log N)$ | C++17: Avoids constructing value if key exists! |
| | \`mp.insert_or_assign("k", v)\`| \`mp.insert_or_assign(key, new_val);\` | $O(\\log N)$ | Upsert semantics; updates existing or inserts. |
| | \`mp.insert({"a", 1})\` | \`mp.insert({"Alice", 95});\` | $O(\\log N)$ | Inserts key-value pair only if key does not exist. |
| | \`mp.erase("hits")\` | \`mp.erase(key); // removes pair by key\` | $O(\\log N)$ | Removes key-value pair by key. |
| | \`mp.extract("id")\` | \`auto node = mp.extract(k); node.key() = new_k; mp.insert(move(node));\` | $O(\\log N)$ | Extracts node handle without deallocation. |
| | \`mp.clear()\` | \`mp.clear(); // destroys all pairs\` | $O(N)$ | Destroys all tree nodes. |
| **Lookup** | \`mp.find("hits")\` | \`auto it = mp.find(key); if (it != mp.end()) { ... }\` | $O(\\log N)$ | Returns iterator to pair, or \`end()\` if not found. |
| | \`mp.contains("hits")\` | \`if (mp.contains("session_id")) { ... } // C++20\` | $O(\\log N)$ | Returns \`true\` if key exists. |
| | \`mp.lower_bound("user_100")\`| \`auto it = timeline.lower_bound(start_ts); // first >= start\` | $O(\\log N)$ | Points to first pair with key $\\ge k$. |
| | \`mp.upper_bound("user_100")\`| \`auto it = timeline.upper_bound(end_ts); // first > end\` | $O(\\log N)$ | Points to first pair with key $> k$. |`,
    code: `#include <bits/stdc++.h>
using namespace std;

class MapLab {
public:
    void demonstrate() {
        map<string, int> scores;

        // 1. Insertion and C++17 try_emplace
        scores["Alice"] = 95;       // operator[] inserts or updates
        scores.try_emplace("Bob", 88); // Safe: avoids constructing arg if key exists

        // 2. Safe read-only inspection (C++20 contains & .at())
        if (scores.contains("Alice")) {
            int val = scores.at("Alice"); // Safe access without default insertion
        }

        // 3. Prefix & Range Queries via lower_bound
        map<int, string> events;
        events[100] = "Init";
        events[250] = "Auth";
        events[500] = "Sync";
        auto it = events.lower_bound(200); // Points to {250, "Auth"} (first key >= 200)
        assert(it->first == 250);

        // 4. Custom descending order
        map<int, string, greater<int>> descMap;
        descMap[1] = "Lowest";
        descMap[10] = "Highest";
        assert(descMap.begin()->first == 10);
    }
};`,
  },

  // ── 10. <unordered_set> ──
  {
    id: "stl-unordered-set",
    title: "std::unordered_set<T>: Chained Hash Table with Custom Hasher",
    slug: "stl-unordered-set",
    track: "stl",
    category: "STL Mastery",
    subCategory: "Unordered Associative Containers",
    language: "C++",
    difficulty: "Intermediate",
    tags: ["cpp", "stl", "unordered_set", "hash-table", "load-factor", "anti-hash"],
    xpBounty: 60,
    paradigm: "Direct Hashing & Separate Chaining Collision Resolution",
    coreConcept: "Average O(1) membership queries using bucket arrays and separate chaining, reserve optimization, and custom splitmix64 anti-hash protection",
    timeComplexity: "O(1) average lookup / insert / erase, O(N) worst case under adversarial hash collisions",
    spaceComplexity: "O(N + BucketCount) bucket pointer array + forward-linked node lists",
    description: "Hash-table-based unique key container providing amortized constant time lookups with customizable hash functions and bucket management.",
    theory: `#### Container Specification & Header Definition (<unordered_set>)
\`std::unordered_set<Key, Hash, KeyEqual>\` is an unordered associative container implemented as a **chained hash table**:
* Elements are organized into buckets according to their hash codes: \`bucket_index = hash(key) % bucket_count\`.
* Collisions are handled via separate chaining (a singly-linked list of nodes per bucket).
* Average time complexity for search, insert, and erase is strictly **$O(1)$**.

\`\`\`text
Buckets Array (Pointers):
[ 0 ] ----> [ Node: 16 | * ] ----> [ Node: 32 | nullptr ]  (Collision Chain)
[ 1 ] ----> nullptr
[ 2 ] ----> [ Node: 42 | nullptr ]
[ 3 ] ----> nullptr
\`\`\`

#### Exhaustive Member Function Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Iterators** | \`uset.begin()\`, \`uset.end()\` | \`for (int val : uset) { ... }\` | $O(1)$ | Forward iterators traversing all elements across buckets. |
| **Capacity** | \`uset.size()\` | \`int unique_items = uset.size();\` | $O(1)$ | Total count of distinct stored elements. |
| | \`uset.empty()\` | \`if (uset.empty()) return;\` | $O(1)$ | Checks if set contains 0 elements. |
| **Modifiers** | \`uset.insert(42)\` | \`if (visited.insert(u).second) { dfs(u); }\` | $O(1)$ avg, $O(N)$ worst | Hashes key and adds to appropriate bucket in $O(1)$ avg. |
| | \`uset.emplace(42)\` | \`uset.emplace(key); // in-place construction\` | $O(1)$ avg, $O(N)$ worst | Constructs element in-place in bucket node. |
| | \`uset.erase(42)\` | \`uset.erase(val); // unlinks from bucket chain\` | $O(1)$ avg, $O(N)$ worst | Erases element from its bucket chain. |
| | \`uset.clear()\` | \`uset.clear(); // preserves bucket capacity\` | $O(N)$ | Destroys all nodes across all buckets. |
| **Lookup** | \`uset.find(42)\` | \`if (uset.find(val) != uset.end()) { ... }\` | $O(1)$ avg, $O(N)$ worst | Returns iterator to element, or \`end()\`. |
| | \`uset.contains(42)\` | \`if (blocked_ips.contains(ip)) drop_packet(); // C++20\` | $O(1)$ avg | Checks membership in $O(1)$ average time. |
| **Bucket Interface** | \`uset.bucket_count()\` | \`cout << "Buckets: " << uset.bucket_count();\` | $O(1)$ | Total number of buckets in the hash table. |
| | \`uset.bucket(42)\` | \`size_t b_idx = uset.bucket(val);\` | $O(1)$ | Computes which bucket index key $k$ maps into. |
| | \`uset.bucket_size(0)\` | \`size_t chain_len = uset.bucket_size(0); // inspect collisions\` | $O(\\text{chain})$ | Number of elements residing in bucket $n$. |
| **Hash Policy** | \`uset.load_factor()\` | \`float load = uset.load_factor();\` | $O(1)$ | Returns current $\\lambda = \\frac{\\text{size}}{\\text{bucket\\_count}}$. |
| | \`uset.max_load_factor(0.7f)\` | \`uset.max_load_factor(0.7f); // tune load threshold\` | $O(1)$ | Threshold triggering automatic rehashing (default 1.0). |
| | \`uset.reserve(100000)\` | \`seen.reserve(N); // eliminates mid-run rehashes\` | $O(N)$ | Pre-allocates buckets for $n$ elements without rehashing. |
| | \`uset.rehash(2048)\` | \`uset.rehash(next_prime);\` | $O(N)$ | Forces reallocation to at least $n$ buckets and redistributes elements. |

#### Anti-Hash Protection (Codeforces Security)
Default \`std::hash<long long>\` in GCC is an identity function (\`hash(x) = x\`). Adversaries can craft inputs yielding identical \`x % prime\`, degrading operations to $O(N^2)$ (TLE). Always use a randomized 64-bit mixer (\`splitmix64\`) in competitive environments!`,
    code: `#include <bits/stdc++.h>
using namespace std;

// High-entropy 64-bit mixer resisting adversarial hash collisions
struct CustomHash {
    static uint64_t splitmix64(uint64_t x) {
        x += 0x9e3779b97f4a7c15;
        x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9;
        x = (x ^ (x >> 27)) * 0x94d049bb133111eb;
        return x ^ (x >> 31);
    }
    size_t operator()(uint64_t x) const {
        static const uint64_t SEED = chrono::steady_clock::now().time_since_epoch().count();
        return splitmix64(x + SEED);
    }
};

class UnorderedSetLab {
public:
    void demonstrate() {
        // 1. Capacity reservation to prevent rehashes
        unordered_set<long long, CustomHash> safeSet;
        safeSet.reserve(100000);    // Allocates buckets upfront
        safeSet.max_load_factor(0.7f);

        // 2. Modifiers and C++20 contains
        safeSet.insert(42);
        safeSet.emplace(99);
        assert(safeSet.contains(42)); // O(1) average
        safeSet.erase(42);

        // 3. Bucket inspection
        size_t buckets = safeSet.bucket_count();
        float load = safeSet.load_factor();
    }
};`,
  },

  // ── 11. <unordered_map> ──
  {
    id: "stl-unordered-map",
    title: "std::unordered_map<Key, Value>: High-Throughput Hash Dictionary",
    slug: "stl-unordered-map",
    track: "stl",
    category: "STL Mastery",
    subCategory: "Unordered Associative Containers",
    language: "C++",
    difficulty: "Intermediate",
    tags: ["cpp", "stl", "unordered_map", "hash-map", "dictionary", "custom-hash"],
    xpBounty: 65,
    paradigm: "Key-Value Hashing & Amortized Constant-Time Lookups",
    coreConcept: "Fast hash-indexed key-value mapping with bucket arrays, custom pair hashing, and reserve optimization",
    timeComplexity: "O(1) average lookup / insert / erase, O(N) worst case under hash collisions",
    spaceComplexity: "O(N + BucketCount) bucket pointer array and chained key-value nodes",
    description: "Amortized O(1) key-value hash table container optimized for high-throughput lookups, with custom struct and pair hashing.",
    theory: `#### Container Specification & Header Definition (<unordered_map>)
\`std::unordered_map<Key, Value, Hash, KeyEqual>\` is an associative hash table container storing key-value pairs with unique keys:
* Key-value nodes are stored in buckets: \`std::pair<const Key, Value>\`.
* Search, insertion, and removal execute in **$O(1)$ amortized average time**.
* Iteration order is arbitrary and unstable across rehashes.

\`\`\`text
hash(Key) % Buckets:
[ Bucket 0 ] ----> [ {"ID_42", 980} | * ] ----> nullptr
[ Bucket 1 ] ----> [ {"ID_19", 420} | * ] ----> [ {"ID_85", 730} | nullptr ]
[ Bucket 2 ] ----> nullptr
\`\`\`

#### Exhaustive Member Function Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Iterators** | \`umap.begin()\`, \`umap.end()\` | \`for (const auto& [k, v] : umap) { ... }\` | $O(1)$ | Traverses \`pair<const Key, Value>\` forward iterators. |
| **Capacity** | \`umap.size()\` | \`int count = umap.size();\` | $O(1)$ | Total mapped entries. |
| | \`umap.empty()\` | \`if (umap.empty()) return;\` | $O(1)$ | Checks if map contains 0 entries. |
| **Element Access** | \`umap["user"] = 1\` | \`cache[session_token] = user_profile;\` | $O(1)$ avg | Inserts default value if key is not found! |
| | \`umap.at("user")\` | \`auto& user = umap.at(user_id); // throws if absent\` | $O(1)$ avg | Checked lookup; throws \`std::out_of_range\` if absent. |
| **Modifiers** | \`umap.try_emplace("k", 10)\` | \`umap.try_emplace(key, expensive_calc());\` | $O(1)$ avg | Avoids constructing value if key exists! |
| | \`umap.insert_or_assign("k", v)\`| \`umap.insert_or_assign(id, updated_state);\` | $O(1)$ avg | Upsert semantics; updates existing or inserts. |
| | \`umap.insert({"a", 1})\` | \`umap.insert({"port", 8080});\` | $O(1)$ avg | Inserts entry only if key is not yet present. |
| | \`umap.erase("user")\` | \`umap.erase(session_id); // unlinks from bucket\` | $O(1)$ avg | Removes pair from bucket chain. |
| | \`umap.clear()\` | \`umap.clear(); // destroys all pairs\` | $O(N)$ | Destroys all nodes across buckets. |
| **Lookup** | \`umap.find("user")\` | \`auto it = umap.find(id); if (it != umap.end()) ...\` | $O(1)$ avg | Returns iterator to pair, or \`end()\`. |
| | \`umap.contains("user")\` | \`if (umap.contains(id)) return umap[id]; // C++20\` | $O(1)$ avg | Checks if key exists in $O(1)$ average time. |
| **Bucket Interface** | \`umap.bucket_count()\` | \`size_t slots = umap.bucket_count();\` | $O(1)$ | Total bucket array size. |
| | \`umap.bucket("user")\` | \`size_t bucket_id = umap.bucket("user");\` | $O(1)$ | Identifies which bucket index key $k$ hashes to. |
| **Hash Policy** | \`umap.load_factor()\` | \`if (umap.load_factor() > 0.8f) ...\` | $O(1)$ | Current $\\lambda = \\frac{\\text{size}}{\\text{bucket\\_count}}$. |
| | \`umap.reserve(50000)\` | \`umap.reserve(expected_keys); // prevents rehashes\` | $O(N)$ | Sets bucket count to accommodate $n$ elements. |`,
    code: `#include <bits/stdc++.h>
using namespace std;

struct PairHash {
    size_t operator()(const pair<int, int>& p) const {
        return hash<int>{}(p.first) ^ (hash<int>{}(p.second) + 0x9e3779b9 + (p.first << 6) + (p.first >> 2));
    }
};

class UnorderedMapLab {
public:
    void demonstrate() {
        // 1. Frequency mapping with reserve
        unordered_map<string, int> freq;
        freq.reserve(1000);         // Pre-allocates buckets
        freq["apple"]++;            // O(1) average lookup/insert
        freq.try_emplace("banana", 5); // C++17 in-place insertion

        // 2. Safe inspection without default-insertion
        if (freq.contains("apple")) {
            int count = freq.at("apple");
        }

        // 3. Custom pair hashing for 2D Grid
        unordered_map<pair<int, int>, int, PairHash> grid;
        grid[{0, 0}] = 1;
        grid[{1, 2}] = 10;
        assert(grid.contains({1, 2}));
    }
};`,
  },

  // ── 12. <bitset> ──
  {
    id: "stl-bitset",
    title: "std::bitset<N>: Fixed-Size Bit Array & Bit-Parallelism",
    slug: "stl-bitset",
    track: "stl",
    category: "STL Mastery",
    subCategory: "Specialized Containers",
    language: "C++",
    difficulty: "Advanced",
    tags: ["cpp", "stl", "bitset", "bit-manipulation", "knapsack", "bit-parallelism"],
    xpBounty: 65,
    paradigm: "Word-Level Parallelism & Sub-Word Bit Packing",
    coreConcept: "Packing 64 boolean flags into each 64-bit machine word, enabling 64x bit-parallel logical operations and O(N/64) subset sum transitions",
    timeComplexity: "O(N/64) for bitwise logical ops (&, |, ^, <<, >>), O(1) for test / set / flip / count",
    spaceComplexity: "O(N/8) bytes contiguous storage (8x less memory than bool array, 64x less than vector<int>)",
    description: "Compact fixed-size bit array packing booleans into machine words, accelerating subset-sum DP and graph reachability by 64x.",
    theory: `#### Container Specification & Header Definition (<bitset>)
\`std::bitset<N>\` is a specialized sequence container holding a fixed sequence of $N$ bits:
* In standard C++, a \`bool\` occupies 1 full byte (8 bits) because memory is byte-addressable.
* \`std::bitset<N>\` packs bits into native 64-bit machine words (\`uint64_t\`), consuming strictly:
$$\\text{Total Memory} = \\left\\lceil \\frac{N}{64} \\right\\rceil \\times 8 \\text{ bytes}$$

#### The 64x Bit-Parallel Speedup
Modern 64-bit CPUs execute bitwise instructions (\`&\`, \`|\`, \`^\`, \`~\`, \`<<\`, \`>>\`) across an entire 64-bit register in a **single clock cycle**.
* By packing booleans into bits, algorithms operating on bitsets process 64 states simultaneously per instruction, reducing time complexity by an enormous factor of 64:
$$\\text{Complexity} = O\\left(\\frac{N}{64}\\right)$$

\`\`\`text
64-Bit CPU Word:
Bit:   63 62 61 60 ... ... ... 4  3  2  1  0
Val: [ 0  0  1  0  ... ... ... 1  1  0  1  0 ]
       ^                                    ^
       bitset[63]                           bitset[0]
A single CPU instruction computes AND/OR across all 64 bits simultaneously!
\`\`\`

#### Exhaustive Member Function Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Bit Access** | \`bs[0]\` / \`bs[pos]\` | \`bool is_prime = sieve[x]; sieve[x] = false;\` | $O(1)$ | Unchecked bit access via internal proxy class. |
| | \`bs.test(3)\` | \`if (visited.test(vertex_id)) continue;\` | $O(1)$ | Bounds-checked bit read throwing \`std::out_of_range\`. |
| | \`bs.count()\` | \`int active_nodes = bs.count(); // hardware POPCNT\` | $O(N/64)$ | Population count (number of 1s); uses hardware \`POPCNT\`. |
| | \`bs.size()\` | \`for (size_t i = 0; i < bs.size(); ++i)\` | $O(1)$ | Returns compile-time constant $N$. |
| | \`bs.all()\` | \`if (completed_tasks.all()) return true;\` | $O(N/64)$ | Returns \`true\` if all $N$ bits are set to 1. |
| | \`bs.any()\` | \`if (dirty_flags.any()) sync_database();\` | $O(N/64)$ | Returns \`true\` if at least one bit is set to 1. |
| | \`bs.none()\` | \`if (error_mask.none()) proceed();\` | $O(N/64)$ | Returns \`true\` if all bits are 0. |
| **Modifiers** | \`bs.set()\` | \`sieve.set(); // mark all numbers as potential primes\` | $O(N/64)$ | Sets all $N$ bits to 1. |
| | \`bs.set(0, true)\` | \`bs.set(node_id); // mark node as visited\` | $O(1)$ | Sets bit at \`pos\` to \`val\`. |
| | \`bs.reset()\` | \`bs.reset(); // clear all bits to 0\` | $O(N/64)$ | Resets all bits to 0. |
| | \`bs.reset(1)\` | \`bs.reset(flag_index); // turn off specific flag\` | $O(1)$ | Resets bit at \`pos\` to 0. |
| | \`bs.flip()\` | \`bs.flip(); // invert all bits (1s complement)\` | $O(N/64)$ | Inverts (toggles) all $N$ bits. |
| | \`bs.flip(2)\` | \`bs.flip(toggle_idx); // toggle light state\` | $O(1)$ | Inverts bit at \`pos\`. |
| **Bitwise Ops** | \`bs &= mask\`, \`bs \|= (bs << w)\` | \`dp \|= (dp << weight); // knapsack reachability\` | $O(N/64)$ | In-place bitwise AND / OR / XOR. |
| | \`bs <<= 5\`, \`bs >>= 2\` | \`mask <<= shift_amount;\` | $O(N/64)$ | Bitwise left / right shift. |
| **Conversions** | \`bs.to_string()\` | \`cout << "Binary: " << bs.to_string() << "\\n";\` | $O(N)$ | Formats bits as binary character string. |
| | \`bs.to_ullong()\` | \`uint64_t reg = bs.to_ullong();\` | $O(1)$ | Converts to \`unsigned long long\`. |`,
    code: `#include <bits/stdc++.h>
using namespace std;

class BitsetLab {
public:
    void demonstrate() {
        // 1. Initialization and state queries
        bitset<16> bs(0b10110010);
        bool bitOne  = bs.test(1);  // true (bounds checked)
        size_t ones  = bs.count();  // Hardware POPCNT
        bool hasAny  = bs.any();    // true

        // 2. Modifiers
        bs.set(0);                  // Set bit 0
        bs.reset(1);                // Reset bit 1
        bs.flip();                  // Invert all bits

        // 3. Conversions
        string strVal = bs.to_string();
        unsigned long num = bs.to_ulong();

        // 4. 0/1 Knapsack Subset-Sum DP in O(Target / 64)
        vector<int> weights = {2, 3, 7};
        bitset<100> dp;
        dp[0] = 1;                  // Base case: sum 0 reachable
        for (int w : weights) {
            dp |= (dp << w);        // Entire transition in 1 bitwise shift and OR!
        }
        assert(dp.test(5));         // 2 + 3 = 5 reachable
    }
};`,
  },
];
