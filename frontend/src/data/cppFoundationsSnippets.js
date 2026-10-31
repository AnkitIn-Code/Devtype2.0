// src/data/cppFoundationsSnippets.js
// C++ Foundations & Language Mechanics Blueprints
// Covers I/O Streams, Loops, Functions, Structs, Classes, Operator Overloading, Pointers, and Lambdas.

export const CPP_FOUNDATIONS_SNIPPETS = [
  {
    id: "cpp-fast-io",
    title: "Fast Competitive I/O & Stream Synchronization",
    slug: "cpp-fast-io",
    track: "foundations",
    category: "C++ Foundations",
    subCategory: "Input & Output Streams",
    language: "C++",
    difficulty: "Beginner",
    tags: ["cpp", "foundations", "fast-io", "cin", "cout", "streams"],
    xpBounty: 45,
    paradigm: "Buffer Decoupling & Stream Untying",
    coreConcept: "Disabling C stdio sync buffers and untying cin from cout",
    timeComplexity: "O(1) amortized per token (~4x faster than standard cin)",
    spaceComplexity: "O(1) stream buffer allocation",
    description: "Disabling C stdio synchronization and untying stream buffers for sub-millisecond competitive I/O throughput.",
    theory: `#### Problem Definition & Motivation
By default in C++, standard input (\`std::cin\`) and standard output (\`std::cout\`) synchronize their internal stream buffers with the underlying C library standard I/O functions (\`scanf\`, \`printf\`). This synchronization ensures that interleaving C and C++ I/O statements produces deterministic, in-order output.

However, this compatibility layer comes at a severe performance cost:
* Every \`std::cin\` read flushes and syncs with C's \`stdio\` buffers.
* \`std::cin\` is tied to \`std::cout\` by default, meaning every read automatically triggers an explicit flush of the output buffer:
$$\\text{Buffer Flush Overhead} = O(K) \\text{ system call interrupts per interactive line}$$
In competitive programming or high-throughput batch processing with $N = 10^5$ to $10^6$ integer tokens, default \`std::cin\` frequently causes **Time Limit Exceeded (TLE)** purely due to buffer synchronization latency.

#### Invariants & The Fast I/O Blueprint
To achieve equivalent throughput to raw C \`fread\` and \`scanf\`, two essential stream transformations are applied at program initialization:

1. **\`std::ios_base::sync_with_stdio(false);\`**:
   * Disables synchronization between C++ iostreams and C standard streams.
   * Allows \`std::cin\` and \`std::cout\` to manage their own contiguous block memory buffers without making costly POSIX system calls per token.

2. **\`std::cin.tie(nullptr);\`**:
   * Unties \`std::cin\` from \`std::cout\`.
   * Eliminates the automatic flushing of \`std::cout\` before every \`std::cin\` extraction operation.

3. **\`'\\n'\` over \`std::endl\`**:
   * \`std::endl\` writes a newline character and forces a physical buffer flush:
   $$\\text{std::endl} \\equiv \\text{'\\n'} + \\text{std::flush}$$
   * Using \`'\\n'\` allows output to accumulate in userspace buffers, flushing only when the buffer is full ($4\\text{KB}$ to $64\\text{KB}$ chunks).

#### ASCII Stream Architecture
\`\`\`text
DEFAULT MODE (High Latency):
std::cin --------> [Sync Guard] -------> C stdio (stdin) ------> POSIX read()
                      | (Tied)
std::cout -------> [Sync Guard] -------> C stdio (stdout) -----> POSIX write() [Flushed on every read]

FAST I/O MODE (Zero Overhead):
std::cin --------> [Independent 4KB C++ Stream Buffer] --------> Direct OS Read
std::cout -------> [Independent 4KB C++ Stream Buffer] --------> Direct OS Write [Batch Flushed]
\`\`\`

#### Complexity Analysis
* **Time Complexity**: $O(1)$ amortized per token processed. Throughput increases from ~300,000 ints/sec to over 2,000,000 ints/sec.
* **Space Complexity**: $O(1)$ auxiliary memory (uses built-in stream buffers).`,
    code: `#include <bits/stdc++.h>
using namespace std;

class FastIOHarness {
public:
    // Initialize fast I/O optimizations
    static void init() {
        ios_base::sync_with_stdio(false);
        cin.tie(nullptr);
    }

    // Process space-separated integer stream efficiently
    void processTokens() {
        int n;
        if (!(cin >> n)) return;

        long long total_sum = 0;
        for (int i = 0; i < n; ++i) {
            long long val;
            cin >> val;
            total_sum += val;
        }

        // Use newline '\\n' instead of std::endl to prevent buffer flushing
        cout << "Sum: " << total_sum << '\\n';
    }
};`,
  },
  {
    id: "cpp-string-getline",
    title: "Multi-Word String Streaming & Getline Mechanics",
    slug: "cpp-string-getline",
    track: "foundations",
    category: "C++ Foundations",
    subCategory: "String Processing & Streams",
    language: "C++",
    difficulty: "Beginner",
    tags: ["cpp", "foundations", "strings", "getline", "stringstream"],
    xpBounty: 45,
    paradigm: "Delimiter-Aware Line Extraction",
    coreConcept: "Buffer cleansing with cin.ignore and in-memory tokenization via stringstream",
    timeComplexity: "O(L) linear in characters read per line",
    spaceComplexity: "O(L) contiguous string memory",
    description: "Mastering std::getline, clearing lingering newline delimiters with cin.ignore, and tokenizing with stringstream.",
    theory: `#### Problem Definition & The Newline Trap
In C++, reading mixed data types (integers followed by multi-word text sentences) introduces a classic input trap:
* \`cin >> num\` reads up to the whitespace preceding the newline character \`'\\n'\`, leaving the \`'\\n'\` unconsumed in the input buffer.
* A subsequent call to \`std::getline(cin, text)\` immediately terminates upon encountering that lingering \`'\\n'\`, returning an empty string:
$$\\text{Buffer State: } [\\text{42}] \\xrightarrow{\\text{cin >> n}} \\text{Buffer: } [\\text{'\\n'}, \\text{\"Hello World\"}] \\xrightarrow{\\text{getline}} \\text{Result: } \"\"$$

#### The Invariant & The Proper Cleanse
To read line-based multi-word text following token extraction:
1. **\`std::cin.ignore(numeric_limits<streamsize>::max(), '\\n');\`**:
   Discards all remaining characters in the input stream buffer up to and including the next newline delimiter.
2. **\`std::stringstream\` Tokenization**:
   Loads the extracted line into an in-memory stream buffer, allowing space-delimited or comma-delimited parsing of heterogeneous data.

#### ASCII Execution Trace
\`\`\`text
Step 1: cin >> count
[ Buffer: "3\\nAlice Wonderland\\nBob Builder\\n" ]
  --> count = 3
  --> Remaining buffer: "\\nAlice Wonderland\\nBob Builder\\n"

Step 2: cin.ignore()
  --> Discards '\\n'
  --> Buffer: "Alice Wonderland\\nBob Builder\\n"

Step 3: getline(cin, line)
  --> line = "Alice Wonderland"
  --> Processed via stringstream into ["Alice", "Wonderland"]
\`\`\`

#### Complexity Analysis
* **Time Complexity**: $O(L)$ where $L$ is the number of characters in the line.
* **Space Complexity**: $O(L)$ memory for buffer and token vector.`,
    code: `#include <bits/stdc++.h>
using namespace std;

class LineStreamParser {
public:
    // Safely reads mixed integer header followed by full text lines
    vector<vector<string>> parseLines() {
        int line_count;
        if (!(cin >> line_count)) return {};

        // Invariant: Discard residual newline before getline
        cin.ignore(numeric_limits<streamsize>::max(), '\\n');

        vector<vector<string>> tokenized_records;
        string raw_line;

        for (int i = 0; i < line_count; ++i) {
            if (!getline(cin, raw_line)) break;

            // In-memory stream decomposition
            stringstream ss(raw_line);
            string token;
            vector<string> current_tokens;

            while (ss >> token) {
                current_tokens.push_back(token);
            }
            tokenized_records.push_back(current_tokens);
        }

        return tokenized_records;
    }
};`,
  },
  {
    id: "cpp-loops-ranges",
    title: "Modern Iteration Loops & Range-Based Traversals",
    slug: "cpp-loops-ranges",
    track: "foundations",
    category: "C++ Foundations",
    subCategory: "Control Flow & Loops",
    language: "C++",
    difficulty: "Beginner",
    tags: ["cpp", "foundations", "loops", "range-for", "auto", "traversal"],
    xpBounty: 45,
    paradigm: "Forward & Reverse Iterator Traversal",
    coreConcept: "Reference-based range traversal avoiding deep copies and stride bounds",
    timeComplexity: "O(N) single-pass linear traversal",
    spaceComplexity: "O(1) auxiliary loop pointer state",
    description: "Modern C++20 iteration paradigms: index-based, reference range-for, structured bindings, and reverse iteration.",
    theory: `#### Problem Definition & Motivation
Iteration is the fundamental building block of algorithmic manipulation. In older C++ paradigms, loops were written exclusively with index arithmetic:
\`for (size_t i = 0; i < vec.size(); ++i)\`
While useful when indices are strictly required, index loops have notable pitfalls:
* Risk of off-by-one errors and signed/unsigned comparison warnings (\`int\` vs \`size_t\`).
* Redundant index-to-address calculation: \`vec[i]\` computes \`*(vec.data() + i)\` on every access.

#### Modern C++ Range-Based Iteration
C++11 and C++20 introduced range-based \`for\` loops that operate directly on iterators \`begin()\` and \`end()\`:
1. **By Value (\`for (auto x : vec)\`)**: Copies each element. Fast for primitive types (\`int\`, \`char\`), but catastrophic $O(N \\times M)$ performance penalty if elements are large strings or nested containers.
2. **By Mutable Reference (\`for (auto& x : vec)\`)**: Directly mutates elements in-place with zero copying.
3. **By Const Reference (\`for (const auto& x : vec)\`)**: The golden standard for read-only inspection. Zero copying, compiler-enforced const safety.
4. **Structured Bindings Iteration (\`for (const auto& [k, v] : map)\`)**: Directly destructures pairs and tuples during loop header initialization.

#### Complexity Analysis
* **Time Complexity**: $O(N)$ single linear pass through $N$ contiguous elements.
* **Space Complexity**: $O(1)$ auxiliary overhead when using reference iteration.`,
    code: `#include <bits/stdc++.h>
using namespace std;

class LoopPatterns {
public:
    // In-place transformation via mutable range-for
    void squareElements(vector<int>& nums) {
        for (auto& val : nums) {
            val = val * val;
        }
    }

    // Read-only inspection via const reference range-for
    long long computeSum(const vector<int>& nums) {
        long long total = 0;
        for (const auto& val : nums) {
            total += val;
        }
        return total;
    }

    // Reverse iteration using reverse iterators
    vector<int> reverseTraverse(const vector<int>& nums) {
        vector<int> result;
        result.reserve(nums.size());
        for (auto it = nums.rbegin(); it != nums.rend(); ++it) {
            result.push_back(*it);
        }
        return result;
    }

    // Structured binding traversal across key-value pairs
    void printPairs(const vector<pair<string, int>>& records) {
        for (const auto& [name, score] : records) {
            cout << name << ": " << score << '\\n';
        }
    }
};`,
  },
  {
    id: "cpp-functions-references",
    title: "Function Semantics: Pass-by-Reference & Return Invariants",
    slug: "cpp-functions-references",
    track: "foundations",
    category: "C++ Foundations",
    subCategory: "Functions & Memory",
    language: "C++",
    difficulty: "Beginner",
    tags: ["cpp", "foundations", "functions", "references", "const", "rvo"],
    xpBounty: 50,
    paradigm: "Aliased In-Place Modification vs Copy Prevention",
    coreConcept: "Preventing O(N) copy overhead with const references and in-place reference mutation",
    timeComplexity: "O(1) parameter passing overhead",
    spaceComplexity: "O(1) pointer-sized frame reference",
    description: "Mastering pass-by-value, pass-by-reference (&), const-references (const &), and multi-return tuples.",
    theory: `#### Value Semantics vs. Reference Semantics
In C++, function arguments default to **Pass-by-Value**:
* When passing an argument \`void solve(vector<int> arr)\`, C++ allocates a brand-new memory buffer and copies all $N$ elements into the function frame.
* If \`solve\` is called inside a loop $K$ times, the time complexity balloons from $O(K)$ to $O(K \\cdot N)$ purely due to hidden deep copies!

#### The Reference Paradigm
A reference (\`T&\`) is not a new object; it is an **alias** (direct pointer under the hood) to the existing variable in the caller's frame:
* **\`T&\` (Mutable Reference)**: Allows the function to mutate the caller's argument directly without pointer indirection syntax.
* **\`const T&\` (Const Reference)**: Prevents copying while guaranteeing that the function cannot accidentally modify the source data.
$$\\text{Cost of Pass-by-Value: } O(N) \\text{ allocation} \\quad \\Longleftrightarrow \\quad \\text{Cost of Pass-by-Ref: } O(1) \\text{ alias}$$

#### Return Value Optimization (RVO)
Modern C++ (C++17/20) mandates Return Value Optimization (Guaranteed Copy Elision). When a function constructs and returns a vector by value, the compiler constructs the object directly in the destination memory address of the caller, incurring zero copy overhead.

#### Complexity Analysis
* **Time Complexity**: $O(1)$ overhead to pass arguments by reference.
* **Space Complexity**: $O(1)$ stack allocation (8-byte address reference on 64-bit systems).`,
    code: `#include <bits/stdc++.h>
using namespace std;

class FunctionSemantics {
public:
    // 1. Pass-by-Reference (Mutable): In-place element swap
    void swapValues(int& a, int& b) {
        int temp = a;
        a = b;
        b = temp;
    }

    // 2. Pass-by-Const-Reference: O(1) argument pass, read-only
    int findMax(const vector<int>& data) {
        if (data.empty()) return -1;
        int max_val = data[0];
        for (const auto& elem : data) {
            if (elem > max_val) {
                max_val = elem;
            }
        }
        return max_val;
    }

    // 3. Structured Multi-Return with RVO (Return Value Optimization)
    tuple<int, int, double> computeStats(const vector<int>& data) {
        if (data.empty()) return {0, 0, 0.0};
        int min_elem = data[0], max_elem = data[0];
        long long sum = 0;

        for (int x : data) {
            min_elem = min(min_elem, x);
            max_elem = max(max_elem, x);
            sum += x;
        }

        double avg = static_cast<double>(sum) / data.size();
        return {min_elem, max_elem, avg};
    }
};`,
  },
  {
    id: "cpp-structs-constructors",
    title: "Object Encapsulation: Structs & Member Initializer Lists",
    slug: "cpp-structs-constructors",
    track: "foundations",
    category: "C++ Foundations",
    subCategory: "Classes & Structs",
    language: "C++",
    difficulty: "Beginner",
    tags: ["cpp", "foundations", "structs", "classes", "constructors", "oop"],
    xpBounty: 50,
    paradigm: "Data Invariant Protection & Direct Construction",
    coreConcept: "Member initialization lists preventing double initialization overhead",
    timeComplexity: "O(1) object instantiation",
    spaceComplexity: "Contiguous member byte alignment with struct padding",
    description: "Designing C++ structs and classes with member initializer lists, const methods, and encapsulated invariants.",
    theory: `#### Structs vs. Classes in C++
In C++, the difference between \`struct\` and \`class\` is strictly default visibility:
* In a \`struct\`, members are \`public\` by default.
* In a \`class\`, members are \`private\` by default.
In competitive programming and performance engineering, \`struct\` is widely preferred for aggregate data models, while \`class\` is used when maintaining complex internal state invariants.

#### Member Initializer Lists
When an object constructor executes:
* Body assignment (\`this->x = x;\`) first default-constructs the member, then calls the assignment operator.
* A **Member Initializer List** (\`: x(x), y(y)\`) initializes the member variables directly in-place during memory allocation:
$$\\text{Direct Construction: } \\text{Field}(val) \\quad \\text{vs} \\quad \\text{Field}() \\to \\text{Field} = val$$
Initializer lists are mandatory for \`const\` members and reference members, which cannot be default-initialized and assigned later.

#### Const Member Methods
A member method marked \`const\` at the end of its signature (e.g. \`double norm() const\`) guarantees that it will not modify any member variables of the calling instance, allowing it to be safely invoked on \`const\` references.

#### Complexity Analysis
* **Time Complexity**: $O(1)$ initialization and method execution.
* **Space Complexity**: Total size of members aligned to word boundaries (typically 8 bytes alignment on 64-bit platforms).`,
    code: `#include <bits/stdc++.h>
using namespace std;

// Coordinate point representation with immutable invariants
struct Point2D {
    long long x;
    long long y;

    // Default constructor
    Point2D() : x(0), y(0) {}

    // Member initializer list constructor
    Point2D(long long x_val, long long y_val) : x(x_val), y(y_val) {}

    // Const member method: Euclidean squared distance
    long long distSquared(const Point2D& other) const {
        long long dx = x - other.x;
        long long dy = y - other.y;
        return dx * dx + dy * dy;
    }

    // Manhattan distance
    long long manhattanDist(const Point2D& other) const {
        return abs(x - other.x) + abs(y - other.y);
    }
};

class BoundingBox {
private:
    Point2D bottom_left;
    Point2D top_right;

public:
    BoundingBox(Point2D bl, Point2D tr) : bottom_left(bl), top_right(tr) {}

    bool contains(const Point2D& pt) const {
        return pt.x >= bottom_left.x && pt.x <= top_right.x &&
               pt.y >= bottom_left.y && pt.y <= top_right.y;
    }

    long long area() const {
        return (top_right.x - bottom_left.x) * (top_right.y - bottom_left.y);
    }
};`,
  },
  {
    id: "cpp-operator-overloading",
    title: "Operator Overloading & Custom Strict Weak Ordering",
    slug: "cpp-operator-overloading",
    track: "foundations",
    category: "C++ Foundations",
    subCategory: "Classes & Structs",
    language: "C++",
    difficulty: "Intermediate",
    tags: ["cpp", "foundations", "operators", "overloading", "comparators", "sorting"],
    xpBounty: 55,
    paradigm: "Relational Symmetry & Strict Weak Ordering",
    coreConcept: "Implementing operator< with irreflexivity and transitivity for STL algorithms",
    timeComplexity: "O(1) comparison operator",
    spaceComplexity: "O(1) auxiliary",
    description: "Implementing operator< adhering to Strict Weak Ordering for automatic compatibility with std::sort and std::set.",
    theory: `#### The Need for Custom Comparators
When storing custom objects in sorted containers like \`std::set\`, \`std::map\`, or sorting arrays via \`std::sort\`, C++ requires a relational operator to determine relative ordering.
By convention, the STL relies exclusively on **\`operator<\`** (less-than).

#### Strict Weak Ordering Axioms
To prevent undefined behavior, infinite loops, or segmentation faults inside \`std::sort\` (which uses introsort/quicksort), \`operator<\` must satisfy **Strict Weak Ordering**:
1. **Irreflexivity**: \`a < a\` is always \`false\`.
2. **Asymmetry**: If \`a < b\` is \`true\`, then \`b < a\` must be \`false\`.
3. **Transitivity**: If \`a < b\` and \`b < c\`, then \`a < c\`.
4. **Transitivity of Incomparability**: If \`a\` and \`b\` are incomparable, and \`b\` and \`c\` are incomparable, then \`a\` and \`c\` must be incomparable.

$$\\text{CRITICAL BUG: Using } \\le \\text{ instead of } < \\text{ violates Irreflexivity: } (a \\le a = \\text{true}) \\implies \\text{Heap Corruption!}$$

#### Tie-Breaking Patterns
When sorting records with multiple fields (e.g. interval start ascending, then interval end descending):
\`\`\`cpp
if (start != other.start) return start < other.start;
return end > other.end; // Tie-breaker
\`\`\`
Or via modern \`std::tie\`:
\`return std::tie(start, other.end) < std::tie(other.start, end);\`

#### Complexity Analysis
* **Time Complexity**: $O(1)$ per comparison check.
* **Space Complexity**: $O(1)$ auxiliary overhead.`,
    code: `#include <bits/stdc++.h>
using namespace std;

struct JobInterval {
    int start_time;
    int end_time;
    int weight;

    JobInterval(int s, int e, int w) : start_time(s), end_time(e), weight(w) {}

    // Strict Weak Ordering: Sort by end_time ascending, tie-break by start_time
    bool operator<(const JobInterval& other) const {
        if (end_time != other.end_time) {
            return end_time < other.end_time;
        }
        return start_time < other.start_time;
    }
};

class IntervalScheduler {
public:
    // Sorts intervals using the custom operator<
    void sortIntervals(vector<JobInterval>& intervals) {
        sort(intervals.begin(), intervals.end());
    }

    // Demonstrating custom lambda comparator override
    void sortByWeightDescending(vector<JobInterval>& intervals) {
        sort(intervals.begin(), intervals.end(), [](const JobInterval& a, const JobInterval& b) {
            if (a.weight != b.weight) {
                return a.weight > b.weight; // Descending
            }
            return a.start_time < b.start_time;
        });
    }
};`,
  },
  {
    id: "cpp-pointers-memory",
    title: "Pointers, References & Dynamic Memory Architecture",
    slug: "cpp-pointers-memory",
    track: "foundations",
    category: "C++ Foundations",
    subCategory: "Memory & Pointers",
    language: "C++",
    difficulty: "Intermediate",
    tags: ["cpp", "foundations", "pointers", "memory", "nullptr", "indirection"],
    xpBounty: 55,
    paradigm: "Direct Address Dereferencing & Indirection",
    coreConcept: "Understanding stack vs heap allocations, pointer arithmetic, and null safety",
    timeComplexity: "O(1) memory address resolution",
    spaceComplexity: "8 bytes per pointer on 64-bit systems",
    description: "Navigating raw memory: address-of (&), dereferencing (*), nullptr guards, and pointer arithmetic.",
    theory: `#### Memory Hierarchy: Stack vs. Heap
Every C++ program executes across two distinct memory regions:
* **The Stack**:
  * Ultra-fast LIFO memory managed automatically by the CPU call frames.
  * Local variables (\`int x = 10;\`) live on the stack and are freed automatically when the function scope exits.
* **The Heap (Free Store)**:
  * Dynamic memory requested via \`new\` or containers like \`std::vector\`.
  * Persists until explicitly deallocated via \`delete\` or container destruction.

#### Pointer Fundamentals
A pointer (\`T*\`) is an integer variable whose value is the **memory address** of another variable:
* **Address-Of Operator (\`&\`)**: Returns the hexadecimal memory address of a variable.
* **Dereference Operator (\`*\`)**: Reads or writes the value stored at the address pointed to.
* **\`nullptr\`**: A type-safe null pointer literal (introduced in C++11) replacing unsafe \`0\` or \`NULL\` macros.

#### Pointer Arithmetic & Array Decay
In C++, an array name decays to a pointer to its first element:
$$\\text{arr}[i] \\equiv *(\\text{arr} + i)$$
Incrementing a pointer (\`ptr++\`) advances the address by \`sizeof(T)\` bytes, not by 1 byte.

#### Complexity Analysis
* **Time Complexity**: $O(1)$ constant time for direct dereference and address offset operations.
* **Space Complexity**: Strictly 8 bytes per pointer variable on 64-bit operating systems.`,
    code: `#include <bits/stdc++.h>
using namespace std;

class PointerInspector {
public:
    // Demonstrates address-of and dereference operations
    void modifyThroughPointer(int* ptr, int new_value) {
        if (ptr != nullptr) {
            *ptr = new_value; // In-place modification through dereference
        }
    }

    // Pointer arithmetic traversal across contiguous block
    int sumArray(const int* arr, size_t length) {
        if (!arr || length == 0) return 0;

        int total = 0;
        const int* end_ptr = arr + length;

        for (const int* ptr = arr; ptr < end_ptr; ++ptr) {
            total += *ptr; // Advance by sizeof(int) on each increment
        }

        return total;
    }

    // Dynamic linked node traversal pattern
    struct Node {
        int val;
        Node* next;
        Node(int v) : val(v), next(nullptr) {}
    };

    int countNodes(const Node* head) {
        int count = 0;
        const Node* curr = head;
        while (curr != nullptr) {
            count++;
            curr = curr->next;
        }
        return count;
    }
};`,
  },
  {
    id: "cpp-lambdas-closures",
    title: "Modern Lambda Closures & Inline Predicates",
    slug: "cpp-lambdas-closures",
    track: "foundations",
    category: "C++ Foundations",
    subCategory: "Modern C++ Idioms",
    language: "C++",
    difficulty: "Intermediate",
    tags: ["cpp", "foundations", "lambdas", "closures", "predicates", "modern-cpp"],
    xpBounty: 50,
    paradigm: "Anonymous Lexical Closure Capturing",
    coreConcept: "Capturing lexical scopes by reference or value for localized algorithm customization",
    timeComplexity: "O(1) closure instantiation overhead",
    spaceComplexity: "O(1) captured frame state",
    description: "Creating inline closures with capture lists ([&], [=]), parameter lists, and trailing return types.",
    theory: `#### Motivation: The Power of Inline Closures
Prior to C++11, passing custom logic to algorithms like \`std::sort\` or \`std::count_if\` required writing a separate standalone function or a verbose functor \`struct\`.
**Lambdas** provide anonymous, localized function objects that can capture variables from their enclosing lexical scope.

#### Anatomy of a Modern C++ Lambda
\`\`\`cpp
[captures] (parameters) mutable -> return_type { body }
\`\`\`

1. **Capture Clauses \`[...]\`**:
   * \`[]\`: Captures nothing. Can decay to a raw C function pointer.
   * \`[&]\`: Captures all variables in outer scope by **reference** (zero copy, highly efficient in competitive programming).
   * \`[=]\`: Captures all variables by **value** (creates copies of outer variables).
   * \`[x, &y]\`: Explicit captures: \`x\` by value, \`y\` by reference.
2. **Parameters \`(...)\`**:
   * Same as standard function parameters. C++14+ allows \`auto\` for generic lambdas.
3. **Recursive Lambdas**:
   * To implement recursion (like DFS) inside a lambda, pass \`auto&& self\` or use \`std::function\`:
   \`auto dfs = [&](auto&& self, int u) -> void { self(self, v); };\`

#### Complexity Analysis
* **Time Complexity**: $O(1)$ closure creation. The compiler inlines lambdas directly at call sites, making them often faster than function pointers!
* **Space Complexity**: Memory proportional to captured variables.`,
    code: `#include <bits/stdc++.h>
using namespace std;

class LambdaMastery {
public:
    // Capturing outer threshold to filter elements
    vector<int> filterAboveThreshold(const vector<int>& nums, int threshold) {
        vector<int> filtered;

        // Capture filtered by reference, threshold by value
        auto predicate = [&filtered, threshold](int val) {
            if (val > threshold) {
                filtered.push_back(val);
            }
        };

        for (int x : nums) {
            predicate(x);
        }

        return filtered;
    }

    // Inline custom comparator for multi-attribute sorting
    void sortPointsByDistance(vector<pair<int, int>>& points, int origin_x, int origin_y) {
        sort(points.begin(), points.end(), [origin_x, origin_y](const pair<int, int>& a, const pair<int, int>& b) {
            long long dist_a = 1LL * (a.first - origin_x) * (a.first - origin_x) +
                               1LL * (a.second - origin_y) * (a.second - origin_y);
            long long dist_b = 1LL * (b.first - origin_x) * (b.first - origin_x) +
                               1LL * (b.second - origin_y) * (b.second - origin_y);
            return dist_a < dist_b;
        });
    }
};`,
  },
];
