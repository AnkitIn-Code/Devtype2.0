// src/data/javaCollectionsSnippets.js
// Java Collections Framework (JCF) Mastery Blueprints
// Complete reference suite covering 12 standard Java containers:
// ArrayList, LinkedList, CopyOnWriteArrayList, ArrayDeque, PriorityQueue,
// HashSet, LinkedHashSet, TreeSet, HashMap, LinkedHashMap, TreeMap, BitSet.
// Modeled after Oracle Java SE 21 java.util specifications.

export const JAVA_COLLECTIONS_SNIPPETS = [
  // ── 1. ArrayList<E> ──
  {
    id: "jcf-arraylist",
    title: "ArrayList<E>: Resizable Contiguous Object Reference Array",
    slug: "jcf-arraylist",
    track: "jcf",
    category: "Java Collections",
    subCategory: "Sequential Lists",
    language: "Java",
    difficulty: "Beginner",
    tags: ["java", "jcf", "arraylist", "list", "collections", "memory"],
    xpBounty: 45,
    paradigm: "Contiguous Object Reference Array Buffer",
    coreConcept: "Dynamically resizing Object[] reference array with 1.5x growth factor and O(1) random index access",
    timeComplexity: "O(1) amortized add(), O(1) get(i) / set(i), O(N) add(i, val) / remove(i)",
    spaceComplexity: "Contiguous heap array of references (Object[]) with 1.5x geometric growth",
    description: "The primary Java dynamic list backed by a contiguous Object[] reference buffer with amortized constant-time additions and O(1) random access.",
    theory: `#### Container Specification & Hierarchy (java.util.ArrayList)
\`ArrayList<E>\` is the standard resizable-array implementation of the \`List<E>\` interface.
* Implements: \`List<E>\`, \`RandomAccess\`, \`Cloneable\`, \`java.io.Serializable\`.
* Allows all elements, including \`null\`.
* Roughly equivalent to \`Vector\`, except that it is unsynchronized and substantially faster.

#### JVM Memory Model & 1.5x Growth Formula
In Java, an \`ArrayList<E>\` does not hold primitive values or objects inline; it stores an array of **32-bit or 64-bit object references** (\`transient Object[] elementData\`):
* **Initial Capacity**: Default is 10 elements when the first item is added.
* **1.5x Growth**: When \`size == elementData.length\`, capacity expands using bit-shifting:
$$\\text{newCapacity} = \\text{oldCapacity} + (\\text{oldCapacity} \\gg 1) = 1.5 \\times \\text{oldCapacity}$$
* It uses \`Arrays.copyOf()\` which delegates to the native \`System.arraycopy()\` for high-throughput memory relocation.

\`\`\`text
JVM Heap Layout (Compressed OOPs, 64-bit JVM):
ArrayList Object Header (12B) + size (4B) + elementData ref (4B) + padding (4B) = 24 Bytes
        |
        +---> Object[] elementData (Heap Buffer):
              +----------+----------+----------+--------------------+
              | ref[0]   | ref[1]   | ref[2]   | null (unallocated) |
              +----+-----+----+-----+----+-----+--------------------+
                   |          |          |
                   v          v          v
              [Item 0]   [Item 1]   [Item 2]
\`\`\`

#### Exhaustive Member Method Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Element Access** | \`list.get(0)\` | \`String item = list.get(i);\` | $O(1)$ | Returns reference at index without bounds scanning. |
| | \`list.set(0, val)\` | \`list.set(idx, updatedVal);\` | $O(1)$ | Replaces element at index; returns previous element. |
| **Modifiers** | \`list.add(val)\` | \`list.add(val); // amortized O(1) append\` | $O(1)$ amortized | Appends element to end of backing array. |
| | \`list.add(0, val)\` | \`list.add(0, prefixVal); // shifts right\` | $O(N)$ | Inserts at index; shifts downstream elements rightward. |
| | \`list.remove(0)\` | \`list.remove(0); // shifts left\` | $O(N)$ | Removes item by index; shifts subsequent items left. |
| | \`list.remove(val)\` | \`list.remove(Integer.valueOf(42));\` | $O(N)$ | Removes first occurrence of object based on \`equals()\`. |
| | \`list.clear()\` | \`list.clear(); // nulls out slots for GC\` | $O(N)$ | Sets all array slots to \`null\` and resets size to 0. |
| **Capacity & Sizing** | \`list.size()\` | \`for (int i = 0; i < list.size(); ++i)\` | $O(1)$ | Returns count of active non-null tracked elements. |
| | \`list.isEmpty()\` | \`if (list.isEmpty()) return Collections.emptyList();\` | $O(1)$ | Checks if \`size == 0\`. |
| | \`list.ensureCapacity(n)\`| \`list.ensureCapacity(100000); // avoids reallocs\` | $O(N)$ | Pre-allocates backing buffer to eliminate $1.5\\times$ reallocation spikes. |
| | \`list.trimToSize()\` | \`list.trimToSize(); // frees unused capacity\` | $O(N)$ | Shrinks \`elementData\` to match current \`size\`. |
| **Search & Views** | \`list.contains(val)\` | \`if (list.contains(target)) { ... }\` | $O(N)$ | Scans array linearly invoking \`equals()\`. |
| | \`list.indexOf(val)\` | \`int firstIdx = list.indexOf(target);\` | $O(N)$ | Returns index of first occurrence, or -1. |
| | \`list.subList(from, to)\`| \`List<Integer> chunk = list.subList(0, 10);\` | $O(1)$ | Returns a view backed directly by original list. |
| **Java 8+ Modern** | \`list.sort(cmp)\` | \`list.sort(Comparator.naturalOrder());\` | $O(N \\log N)$ | In-place adaptive Timsort. |
| | \`list.removeIf(p)\` | \`list.removeIf(x -> x < 0);\` | $O(N)$ | Removes all elements matching predicate in single pass. |

#### Invalidation & Concurrency Guarantees
* **Fail-Fast Iterators**: Backed by internal \`modCount\`. If modified structurally during iteration (except via \`Iterator.remove()\`), throws \`ConcurrentModificationException\`.
* **Not Thread-Safe**: Concurrent writes require \`Collections.synchronizedList()\` or \`CopyOnWriteArrayList\`.`,
    code: `import java.util.*;

public class ArrayListLab {
    public void demonstrate() {
        // 1. Pre-allocation and initialization
        List<String> list = new ArrayList<>(100); // Initial capacity 100
        list.add("Alpha");
        list.add("Beta");
        list.add("Gamma");

        // 2. Fast O(1) random access
        String first = list.get(0);               // "Alpha"
        list.set(1, "Bravo");                     // Replaces "Beta"

        // 3. Predicate removal and sorting (Java 8+)
        list.removeIf(s -> s.startsWith("B"));    // Removes "Bravo"
        list.sort(Comparator.naturalOrder());     // In-place Timsort

        // 4. Conversion to native array
        String[] arr = list.toArray(new String[0]);
    }
}`,
  },

  // ── 2. LinkedList<E> ──
  {
    id: "jcf-linkedlist",
    title: "LinkedList<E>: Doubly-Linked Node Graph & Deque Adaptor",
    slug: "jcf-linkedlist",
    track: "jcf",
    category: "Java Collections",
    subCategory: "Sequential Lists",
    language: "Java",
    difficulty: "Beginner",
    tags: ["java", "jcf", "linkedlist", "list", "deque", "queue"],
    xpBounty: 50,
    paradigm: "Doubly-Linked Heap Node Graph",
    coreConcept: "Heap-allocated Node<E> instances with prev and next references implementing both List<E> and Deque<E>",
    timeComplexity: "O(1) addFirst() / addLast(), O(1) removeFirst() / removeLast(), O(N) get(i) / search",
    spaceComplexity: "O(N) with 24 bytes overhead per node on 64-bit JVM",
    description: "Doubly-linked sequence implementing List and Deque interfaces with constant-time boundary operations and complete iterator invariance.",
    theory: `#### Container Specification & Hierarchy (java.util.LinkedList)
\`LinkedList<E>\` is a doubly-linked list implementation of the \`List<E>\` and \`Deque<E>\` interfaces.
* Implements: \`List<E>\`, \`Deque<E>\`, \`Cloneable\`, \`java.io.Serializable\`.
* Permits all elements (including \`null\`).
* Dual Nature: Can be used as a sequential list, a FIFO queue, or a LIFO stack.

#### Internal Node Memory Overhead
Each element in a \`LinkedList\` resides in an independent heap object:
\`\`\`java
private static class Node<E> {
    E item;
    Node<E> next;
    Node<E> prev;
}
\`\`\`
* On a 64-bit JVM with Compressed OOPs enabled:
  * Node Object Header: 12 Bytes
  * Three 32-bit references (\`item\`, \`next\`, \`prev\`): 12 Bytes
  * Total: **24 Bytes of overhead per element** (excluding the element object itself!).
* Compare to \`ArrayList\` which consumes only 4 bytes of reference storage per slot.

\`\`\`text
LinkedList Object: [first ref | last ref | size]
      |                                |
      v                                v
+-----+-----+-----+     +-----+-----+-----+     +-----+-----+-----+
| null| "A" |  * -+---->|  *  | "B" |  * -+---->|  *  | "C" | null|
+-----+-----+-----+<----+-----+-----+-----+<----+-----+-----+-----+
\`\`\`

#### Exhaustive Member Method Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Boundary Modifiers** | \`list.addFirst(val)\` | \`list.addFirst(headItem); // O(1) prepend\` | $O(1)$ | Prepends element as new head. |
| | \`list.addLast(val)\` | \`list.addLast(tailItem); // O(1) append\` | $O(1)$ | Appends element as new tail. |
| | \`list.removeFirst()\` | \`E val = list.removeFirst(); // throws if empty\`| $O(1)$ | Unlinks and returns head node; throws if empty. |
| | \`list.removeLast()\` | \`E val = list.removeLast(); // throws if empty\` | $O(1)$ | Unlinks and returns tail node; throws if empty. |
| **Queue & Deque** | \`list.offer(val)\` | \`list.offer(task); // queue enqueue\` | $O(1)$ | Appends to tail; returns \`true\` (Queue interface). |
| | \`list.poll()\` | \`E val = list.poll(); // returns null if empty\` | $O(1)$ | Retrieves and removes head; returns \`null\` if empty. |
| | \`list.peek()\` | \`E val = list.peek(); // inspects head\` | $O(1)$ | Reads head element without removal; returns \`null\` if empty. |
| **Indexed Access** | \`list.get(i)\` | \`list.get(idx); // traverses from nearest end\` | $O(N)$ | Traverses from head or tail depending on which is closer (\`i < (size >> 1)\`). |
| | \`list.set(i, val)\` | \`list.set(idx, newVal);\` | $O(N)$ | Walks to index and mutates node value. |
| **Inspection** | \`list.size()\` | \`int n = list.size();\` | $O(1)$ | Returns \`size\` integer field. |
| | \`list.isEmpty()\` | \`if (list.isEmpty()) { ... }\` | $O(1)$ | Checks if \`size == 0\`. |`,
    code: `import java.util.*;

public class LinkedListLab {
    public void demonstrate() {
        // 1. Boundary operations as Deque
        LinkedList<Integer> list = new LinkedList<>();
        list.addFirst(10);
        list.addLast(20);
        list.addFirst(5); // [5, 10, 20]

        // 2. Queue FIFO processing
        list.offer(30);   // Enqueues at tail
        int front = list.poll(); // Dequeues 5 from head

        // 3. Iterator removal without ConcurrentModificationException
        ListIterator<Integer> it = list.listIterator();
        while (it.hasNext()) {
            if (it.next() == 20) {
                it.remove(); // Safe in-place unlinking
            }
        }
    }
}`,
  },

  // ── 3. CopyOnWriteArrayList<E> ──
  {
    id: "jcf-copyonwrite-arraylist",
    title: "CopyOnWriteArrayList<E>: Snapshot Lock-Free Concurrency",
    slug: "jcf-copyonwrite-arraylist",
    track: "jcf",
    category: "Java Collections",
    subCategory: "Thread-Safe Lists",
    language: "Java",
    difficulty: "Intermediate",
    tags: ["java", "jcf", "copyonwrite", "concurrency", "thread-safe", "lock-free"],
    xpBounty: 60,
    paradigm: "Copy-on-Write Immutability Snapshot",
    coreConcept: "Thread-safe list creating a fresh copy of backing array on every write, providing lock-free snapshot reads that never throw ConcurrentModificationException",
    timeComplexity: "O(1) get(i) lock-free read, O(N) add / set / remove write copy",
    spaceComplexity: "Transient 2x memory during mutation array cloning",
    description: "Thread-safe variant of ArrayList where all mutative operations clone the underlying array, making traversal lightning-fast and lock-free.",
    theory: `#### Container Specification & Hierarchy (java.util.concurrent)
\`CopyOnWriteArrayList<E>\` is a thread-safe list designed specifically for scenarios where **read operations vastly outnumber write operations** (e.g. event listener registries, routing tables, cached state).
* Package: \`java.util.concurrent\`.
* Implements: \`List<E>\`, \`RandomAccess\`, \`Cloneable\`, \`java.io.Serializable\`.

#### The Copy-on-Write Memory Synchronization Protocol
All mutative operations (\`add\`, \`set\`, \`remove\`) acquire an internal \`ReentrantLock\`, make a fresh copy of the entire underlying array, modify the copy, and publish it via a **\`volatile Object[] array\`** pointer swap:
$$\\text{Write Overhead} = O(N) \\text{ memory allocation and arraycopy}$$

\`\`\`text
Thread 1 (Reader): Traversing Snapshot Array A [ 10 | 20 | 30 ] (Lock-free!)
                                                ^
Thread 2 (Writer): Clones Array A -> Array B [ 10 | 20 | 30 | 40 ]
                   Updates volatile pointer: array = Array B
\`\`\`

#### Exhaustive Member Method Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Reads (Lock-Free)**| \`list.get(0)\` | \`E val = list.get(i); // zero locking\` | $O(1)$ | Lock-free reading directly from volatile snapshot. |
| | \`list.iterator()\` | \`for (E item : list) { ... } // never throws CME\` | $O(1)$ | Returns immutable snapshot iterator; never throws \`ConcurrentModificationException\`. |
| **Writes (Lock & Copy)**| \`list.add(val)\` | \`list.add(listener); // clones array\` | $O(N)$ | Acquires lock, clones array, appends item, updates reference. |
| | \`list.addIfAbsent(val)\`| \`list.addIfAbsent(uniqueHandler);\` | $O(N)$ | Appends element only if not already present in snapshot. |
| | \`list.remove(val)\` | \`list.remove(listener);\` | $O(N)$ | Acquires lock, clones array excluding matching item. |
| **Inspection** | \`list.size()\` | \`int n = list.size();\` | $O(1)$ | Reads length of current volatile array snapshot. |
| | \`list.isEmpty()\` | \`if (list.isEmpty()) { ... }\` | $O(1)$ | Checks if array length is 0. |`,
    code: `import java.util.concurrent.CopyOnWriteArrayList;

public class CopyOnWriteLab {
    public void demonstrate() {
        // Safe for concurrent event listeners
        CopyOnWriteArrayList<String> listeners = new CopyOnWriteArrayList<>();
        listeners.add("OnStart");
        listeners.add("OnProgress");

        // Concurrent mutation during traversal is 100% safe!
        for (String event : listeners) {
            if ("OnStart".equals(event)) {
                listeners.add("OnComplete"); // Clones array in background without CME
            }
        }
        assert listeners.size() == 3;
    }
}`,
  },

  // ── 4. ArrayDeque<E> ──
  {
    id: "jcf-arraydeque",
    title: "ArrayDeque<E>: Resizable Circular Bitmask Double-Ended Queue",
    slug: "jcf-arraydeque",
    track: "jcf",
    category: "Java Collections",
    subCategory: "Queues & Deques",
    language: "Java",
    difficulty: "Intermediate",
    tags: ["java", "jcf", "arraydeque", "deque", "stack", "queue"],
    xpBounty: 55,
    paradigm: "Circular Power-of-Two Bitmask Buffer",
    coreConcept: "Array-backed circular buffer using power-of-two bitmasking for pointer wraps, providing faster stack/queue operations than Stack and LinkedList",
    timeComplexity: "O(1) push / pop, O(1) offerFirst / pollLast, O(1) peek",
    spaceComplexity: "Contiguous Object[] array with 2x geometric growth",
    description: "High-performance resizable circular array buffer implementing Deque with zero node allocations, outperforming LinkedList and legacy Stack.",
    theory: `#### Container Specification & Hierarchy (java.util.ArrayDeque)
\`ArrayDeque<E>\` is the recommended general-purpose implementation of both the \`Queue<E>\` and \`Deque<E>\` interfaces.
* Implements: \`Deque<E>\`, \`Queue<E>\`, \`Cloneable\`, \`java.io.Serializable\`.
* Prohibits \`null\` elements (calling \`add(null)\` throws \`NullPointerException\`).
* Recommended Replacement: Replaces legacy synchronized \`java.util.Stack\` and allocation-heavy \`LinkedList\`.

#### Circular Buffer & Power-of-Two Bitmask Pointer Wraps
Backing capacity is always constrained to a **power of two** ($2^K$). This eliminates expensive modulo division (\`%\`), wrapping indices via ultra-fast bitwise AND:
$$\\text{head} = (\\text{head} - 1) \\mathbin{\\&} (\\text{elements.length} - 1)$$
$$\\text{tail} = (\\text{tail} + 1) \\mathbin{\\&} (\\text{elements.length} - 1)$$

\`\`\`text
Circular Array Buffer: capacity = 8 (mask = 7 -> 0b111)
[ Slot 0 | Slot 1 | Slot 2 | Slot 3 | Slot 4 | Slot 5 | Slot 6 | Slot 7 ]
             ^                                   ^
            head (tail wraps around)            tail
\`\`\`

#### Exhaustive Member Method Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Queue Operations** | \`dq.offer(10)\` | \`dq.offer(task); // safe queue append\` | $O(1)$ | Enqueues at tail; returns \`true\`. |
| | \`dq.poll()\` | \`Integer val = dq.poll(); // null if empty\` | $O(1)$ | Removes and returns head; returns \`null\` if empty. |
| | \`dq.peek()\` | \`if (dq.peek() != null) { ... }\` | $O(1)$ | Inspects head without removal; returns \`null\` if empty. |
| **Stack Operations** | \`dq.push(0)\` | \`dq.push(curr_node); // LIFO stack push\` | $O(1)$ | Prepends at head (\`addFirst\`); preferred over legacy \`Stack\`. |
| | \`dq.pop()\` | \`int top = dq.pop(); // throws if empty\` | $O(1)$ | Removes from head (\`removeFirst\`); throws \`NoSuchElementException\`. |
| **Dual Boundary** | \`dq.offerFirst(x)\` | \`dq.offerFirst(vertex); // push to head\` | $O(1)$ | Inserts at front in constant time without shifting elements. |
| | \`dq.pollLast()\` | \`while (!dq.isEmpty() && dq.peekLast() <= x) dq.pollLast();\` | $O(1)$ | Removes from tail (monotonic deque sliding window pattern). |
| | \`dq.peekFirst()\`, \`dq.peekLast()\`| \`int l = dq.peekFirst(), r = dq.peekLast();\`| $O(1)$ | Reads front and back values without removal. |
| **Capacity** | \`dq.isEmpty()\` | \`while (!dq.isEmpty()) { int u = dq.poll(); }\` | $O(1)$ | Checks if \`head == tail\`. |
| | \`dq.size()\` | \`int count = dq.size();\` | $O(1)$ | Computes \`(tail - head) & (elements.length - 1)\`. |`,
    code: `import java.util.*;

public class ArrayDequeLab {
    public void demonstrate() {
        // High performance LIFO stack replacing legacy Stack
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(10);
        stack.push(20);
        int top = stack.pop(); // 20

        // FIFO BFS Queue
        Deque<String> queue = new ArrayDeque<>();
        queue.offer("A");
        queue.offer("B");
        String next = queue.poll(); // "A"
    }
}`,
  },

  // ── 5. PriorityQueue<E> ──
  {
    id: "jcf-priorityqueue",
    title: "PriorityQueue<E>: Resizable Array Binary Min-Heap",
    slug: "jcf-priorityqueue",
    track: "jcf",
    category: "Java Collections",
    subCategory: "Queues & Deques",
    language: "Java",
    difficulty: "Intermediate",
    tags: ["java", "jcf", "priorityqueue", "heap", "min-heap", "dijkstra"],
    xpBounty: 60,
    paradigm: "Array-Indexed Complete Binary Heap",
    coreConcept: "Resizable array Object[] queue structured as a binary min-heap ordered by Comparable or custom Comparator",
    timeComplexity: "O(log N) offer() / poll(), O(1) peek(), O(N) heapify from collection",
    spaceComplexity: "Contiguous Object[] array with 1.5x geometric growth",
    description: "Unbounded priority queue based on a binary min-heap supporting logarithmic insertions, deletions, and custom comparators.",
    theory: `#### Container Specification & Hierarchy (java.util.PriorityQueue)
\`PriorityQueue<E>\` is an unbounded priority queue based on a **binary min-heap**.
* Elements are ordered according to their natural ordering (\`Comparable<E>\`) or by a \`Comparator<E>\` provided at construction.
* Does not permit \`null\` elements.
* Non-synchronized (use \`PriorityBlockingQueue\` for concurrent environments).

#### Heap Storage & Parent/Child Indexing
Stored in a flat array \`Object[] queue\`:
$$\\text{LeftChild}(i) = 2i + 1, \\quad \\text{RightChild}(i) = 2i + 2, \\quad \\text{Parent}(i) = \\frac{i - 1}{2}$$

\`\`\`text
Min-Heap Tree:                 Array Storage:
         [ 10 ] (0)            queue: [ 10 | 30 | 20 | 80 | 50 ]
        /      \\
     [ 30 ]    [ 20 ]
      /  \\
   [ 80 ] [ 50 ]
\`\`\`

#### Exhaustive Member Method Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Modifiers** | \`pq.offer(30)\` | \`pq.offer(candidate); // logarithmic sift-up\` | $O(\\log N)$ | Inserts item into heap and bubbles up to restore min-heap invariant. |
| | \`pq.poll()\` | \`Node min = pq.poll(); // removes root\` | $O(\\log N)$ | Removes root, places last element at index 0, and sifts down. |
| | \`pq.remove(obj)\` | \`pq.remove(staleItem); // linear scan\` | $O(N)$ | Finds element via linear scan and re-heaps remaining array. |
| | \`pq.clear()\` | \`pq.clear(); // resets heap\` | $O(N)$ | Nulls out backing array slots. |
| **Inspection** | \`pq.peek()\` | \`int minVal = pq.peek(); // inspects root\` | $O(1)$ | Returns root extremum without removal; returns \`null\` if empty. |
| | \`pq.isEmpty()\` | \`while (!pq.isEmpty()) { ... }\` | $O(1)$ | Checks if \`size == 0\`. |
| | \`pq.size()\` | \`int active = pq.size();\` | $O(1)$ | Returns active count of heap nodes. |`,
    code: `import java.util.*;

public class PriorityQueueLab {
    public void demonstrate() {
        // 1. Natural Min-Heap (Default)
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        minHeap.offer(30);
        minHeap.offer(10);
        minHeap.offer(20);
        assert minHeap.poll() == 10;

        // 2. Max-Heap via Collections.reverseOrder()
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
        maxHeap.offer(10);
        maxHeap.offer(30);
        assert maxHeap.poll() == 30;

        // 3. Custom Object Comparator (Dijkstra Edge Heap)
        record Edge(int to, int weight) {}
        PriorityQueue<Edge> edgeHeap = new PriorityQueue<>(Comparator.comparingInt(Edge::weight));
        edgeHeap.offer(new Edge(2, 5));
        edgeHeap.offer(new Edge(3, 1));
        assert edgeHeap.peek().to() == 3;
    }
}`,
  },

  // ── 6. HashSet<E> ──
  {
    id: "jcf-hashset",
    title: "HashSet<E>: Hash Table-Backed Unique Element Set",
    slug: "jcf-hashset",
    track: "jcf",
    category: "Java Collections",
    subCategory: "Sets & Maps",
    language: "Java",
    difficulty: "Beginner",
    tags: ["java", "jcf", "hashset", "set", "hashcode", "equals"],
    xpBounty: 50,
    paradigm: "HashMap Backed Set Invariant",
    coreConcept: "Backed by internal HashMap<E, Object> with dummy PRESENT value providing O(1) average uniqueness verification",
    timeComplexity: "O(1) average add(), O(1) average contains(), O(1) average remove()",
    spaceComplexity: "O(N + Buckets) hash table bucket overhead",
    description: "Standard hash-table backed unique element set providing amortized constant-time lookups and insertions.",
    theory: `#### Container Specification & Hierarchy (java.util.HashSet)
\`HashSet<E>\` implements the \`Set<E>\` interface, backed by a **\`HashMap<E, Object>\`** instance:
\`\`\`java
private transient HashMap<E, Object> map;
private static final Object PRESENT = new Object();
\`\`\`
* Every call to \`set.add(e)\` simply executes \`map.put(e, PRESENT) == null\`.
* Permits one \`null\` element (mapped to bucket 0).
* Makes **no guarantees** concerning iteration order.

#### The Fundamental \`hashCode()\` & \`equals()\` Contract
For \`HashSet\` to function correctly:
1. If \`a.equals(b)\`, then \`a.hashCode() == b.hashCode()\`.
2. Modifying fields used in \`hashCode()\` after insertion corrupts bucket placement and makes the element unfindable!

#### Exhaustive Member Method Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Modifiers** | \`set.add(42)\` | \`if (visited.add(u)) { dfs(u); }\` | $O(1)$ avg | Inserts element; returns \`true\` if element was newly added. |
| | \`set.remove(42)\` | \`set.remove(val); // unlinks item\` | $O(1)$ avg | Removes element based on hash and \`equals()\`. |
| | \`set.clear()\` | \`set.clear(); // wipes table\` | $O(N)$ | Clears backing HashMap. |
| **Lookup** | \`set.contains(42)\` | \`if (set.contains(target)) { ... }\` | $O(1)$ avg | Hashes key and checks bucket for element match. |
| **Inspection** | \`set.isEmpty()\` | \`if (set.isEmpty()) return;\` | $O(1)$ | Checks if \`map.isEmpty()\`. |
| | \`set.size()\` | \`int distinct = set.size();\` | $O(1)$ | Returns count of unique items. |`,
    code: `import java.util.*;

public class HashSetLab {
    public void demonstrate() {
        Set<Integer> visited = new HashSet<>();
        
        // add() returns false if item already exists
        boolean added1 = visited.add(10); // true
        boolean added2 = visited.add(10); // false

        // Fast O(1) membership check
        if (visited.contains(10)) {
            visited.remove(10);
        }
    }
}`,
  },

  // ── 7. LinkedHashSet<E> ──
  {
    id: "jcf-linkedhashset",
    title: "LinkedHashSet<E>: Insertion-Ordered Hash Set",
    slug: "jcf-linkedhashset",
    track: "jcf",
    category: "Java Collections",
    subCategory: "Sets & Maps",
    language: "Java",
    difficulty: "Intermediate",
    tags: ["java", "jcf", "linkedhashset", "set", "insertion-order"],
    xpBounty: 55,
    paradigm: "Hash Table with Doubly-Linked Iteration Chain",
    coreConcept: "Maintains a doubly-linked list across hash table buckets, guaranteeing iteration order strictly matches insertion order",
    timeComplexity: "O(1) average add(), contains(), remove(), O(N) iteration proportional to size (not bucket count)",
    spaceComplexity: "O(N) with extra before and after pointers per entry",
    description: "Unique element hash set maintaining predictable insertion-order iteration via a secondary doubly-linked list chain.",
    theory: `#### Container Specification & Hierarchy (java.util.LinkedHashSet)
\`LinkedHashSet<E>\` extends \`HashSet<E>\` and implements \`Set<E>\`.
* Backed internally by a **\`LinkedHashMap<E, Object>\`**.
* Maintains a **doubly-linked list running through all of its entries**.
* Iteration order is guaranteed to match the exact order elements were inserted.

#### Performance Advantage during Iteration
* In \`HashSet\`, iteration time is proportional to **capacity + size** ($O(C + N)$).
* In \`LinkedHashSet\`, iteration follows the linked list pointers and is strictly proportional to **size** ($O(N)$), irrespective of capacity!

#### Exhaustive Member Method Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Modifiers** | \`set.add(42)\` | \`set.add(id); // records order\` | $O(1)$ avg | Inserts element and links to tail of iteration chain. |
| | \`set.remove(42)\` | \`set.remove(id); // unlinks\` | $O(1)$ avg | Removes from hash bucket and unlinks from iteration chain. |
| **Lookup** | \`set.contains(42)\` | \`if (set.contains(id)) { ... }\` | $O(1)$ avg | Hash lookup without traversing the linked list. |
| **Iteration** | \`for (E x : set)\` | \`for (String s : set) // guaranteed insertion order\` | $O(N)$ | Traverses doubly-linked list in strictly $O(N)$ time. |`,
    code: `import java.util.*;

public class LinkedHashSetLab {
    public void demonstrate() {
        // Guaranteed insertion order
        Set<String> orderSet = new LinkedHashSet<>();
        orderSet.add("First");
        orderSet.add("Second");
        orderSet.add("Third");

        // Iteration order matches insertion order
        List<String> collected = new ArrayList<>(orderSet);
        assert collected.get(0).equals("First");
        assert collected.get(2).equals("Third");
    }
}`,
  },

  // ── 8. TreeSet<E> ──
  {
    id: "jcf-treeset",
    title: "TreeSet<E>: Red-Black Tree-Backed Navigable Sorted Set",
    slug: "jcf-treeset",
    track: "jcf",
    category: "Java Collections",
    subCategory: "Sets & Maps",
    language: "Java",
    difficulty: "Intermediate",
    tags: ["java", "jcf", "treeset", "red-black-tree", "navigable-set", "sorted"],
    xpBounty: 60,
    paradigm: "Self-Balancing Red-Black Binary Search Tree",
    coreConcept: "Backed by TreeMap implementing NavigableSet with O(log N) lookups, range subsets, and nearest-neighbor queries (floor, ceiling)",
    timeComplexity: "O(log N) add(), remove(), contains(), floor(), ceiling()",
    spaceComplexity: "O(N) with ~32-40 bytes tree node overhead per element",
    description: "Sorted set backed by a Red-Black tree providing guaranteed logarithmic time lookups and nearest-element range queries.",
    theory: `#### Container Specification & Hierarchy (java.util.TreeSet)
\`TreeSet<E>\` is a \`NavigableSet<E>\` implementation backed by a **\`TreeMap<E, Object>\`**.
* Elements are ordered according to natural ordering (\`Comparable<E>\`) or a specified \`Comparator<E>\`.
* Guarantees strictly **$O(\\log N)$ time** for basic operations (\`add\`, \`remove\`, \`contains\`).

#### Nearest-Neighbor & Range Query Primitives
Unlike \`HashSet\`, \`TreeSet\` provides boundary query methods:
* \`floor(e)\`: Greatest element $\\le e$.
* \`ceiling(e)\`: Least element $\\ge e$.
* \`lower(e)\`: Greatest element strictly $< e$.
* \`higher(e)\`: Least element strictly $> e$.

#### Exhaustive Member Method Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Modifiers** | \`set.add(42)\` | \`set.add(val); // log(N) insert\` | $O(\\log N)$ | Inserts key into Red-Black tree. |
| | \`set.remove(42)\` | \`set.remove(val); // log(N) delete\` | $O(\\log N)$ | Removes node from tree and rebalances. |
| | \`set.pollFirst()\` | \`Integer min = set.pollFirst();\` | $O(\\log N)$ | Removes and returns lowest element. |
| | \`set.pollLast()\` | \`Integer max = set.pollLast();\` | $O(\\log N)$ | Removes and returns highest element. |
| **Navigable Queries**| \`set.ceiling(10)\` | \`Integer next = set.ceiling(target); // first >= target\` | $O(\\log N)$ | Least element $\\ge$ specified key. |
| | \`set.floor(10)\` | \`Integer prev = set.floor(target); // first <= target\` | $O(\\log N)$ | Greatest element $\\le$ specified key. |
| | \`set.higher(10)\` | \`Integer strictNext = set.higher(target); // first > target\`| $O(\\log N)$ | Least element strictly $>$ specified key. |
| | \`set.lower(10)\` | \`Integer strictPrev = set.lower(target); // first < target\`| $O(\\log N)$ | Greatest element strictly $<$ specified key. |
| **Range Views** | \`set.subSet(from, to)\`| \`NavigableSet<Integer> win = set.subSet(10, true, 50, false);\` | $O(1)$ | View of range \`[from, to)\`. |`,
    code: `import java.util.*;

public class TreeSetLab {
    public void demonstrate() {
        NavigableSet<Integer> set = new TreeSet<>();
        set.add(10);
        set.add(25);
        set.add(40);
        set.add(60);

        // Nearest-neighbor queries
        int ceil = set.ceiling(20); // 25 (first >= 20)
        int flr  = set.floor(20);   // 10 (first <= 20)
        int high = set.higher(25);  // 40 (first > 25)

        // Extremum polls
        int lowest = set.pollFirst(); // 10
        assert lowest == 10;
    }
}`,
  },

  // ── 9. HashMap<K, V> ──
  {
    id: "jcf-hashmap",
    title: "HashMap<K, V>: Bucket Table with Red-Black Treeification",
    slug: "jcf-hashmap",
    track: "jcf",
    category: "Java Collections",
    subCategory: "Sets & Maps",
    language: "Java",
    difficulty: "Intermediate",
    tags: ["java", "jcf", "hashmap", "map", "treeify", "load-factor"],
    xpBounty: 65,
    paradigm: "Chained Hash Table with Treeify Threshold",
    coreConcept: "Array of Node<K,V> buckets that dynamically converts collision chains to Red-Black TreeNode instances once bucket collisions exceed 8",
    timeComplexity: "O(1) average put() / get(), O(log N) worst-case under treeification",
    spaceComplexity: "O(N + Capacity) bucket array + node graph",
    description: "The primary Java key-value dictionary using hash buckets that convert to Red-Black trees under heavy collisions for guaranteed O(log N) worst-case.",
    theory: `#### Container Specification & Hierarchy (java.util.HashMap)
\`HashMap<K, V>\` is a hash-table based implementation of the \`Map<K, V>\` interface.
* Implements: \`Map<K, V>\`, \`Cloneable\`, \`java.io.Serializable\`.
* Permits one \`null\` key and multiple \`null\` values.
* Unsynchronized (use \`ConcurrentHashMap\` for concurrent threads).

#### The Java 8 Treeification Architecture
In Java 8+, \`HashMap\` solves the denial-of-service hash collision vulnerability:
1. **Buckets**: \`Node<K, V>[] table\` array sized to a power of two ($2^K$).
2. **Singly-Linked Chain**: Collisions begin as a forward-linked list.
3. **Treeify Threshold (8)**: When collisions in a single bucket reach **8** elements AND total capacity $\\ge 64$, the bucket is converted into a **Red-Black \`TreeNode<K, V>\`**!
4. **Untreeify Threshold (6)**: When tree size shrinks to 6 during resizing, it converts back to a linked list.
This guarantees worst-case lookups degrade to **$O(\\log N)$** instead of $O(N)$!

\`\`\`text
Buckets:
[ Bucket 0 ] ----> Node {"A", 1} ----> Node {"B", 2}  (Linked Chain < 8)
[ Bucket 1 ] ----> null
[ Bucket 2 ] ----> TreeNode {"X", 10}  (Treeified Red-Black Tree >= 8 elements!)
                   /              \\
         TreeNode {"M", 5}     TreeNode {"Z", 20}
\`\`\`

#### Exhaustive Member Method Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Basic Mapping** | \`map.put("k", 1)\` | \`map.put(key, val); // O(1) avg insert\` | $O(1)$ avg | Inserts or overwrites key-value mapping. |
| | \`map.get("k")\` | \`Integer val = map.get(key); // null if absent\`| $O(1)$ avg | Returns mapped value or \`null\`. |
| | \`map.getOrDefault("k", 0)\`| \`int count = map.getOrDefault(key, 0);\` | $O(1)$ avg | Returns default value without mutating map. |
| **Modern Java 8+** | \`map.computeIfAbsent(k, f)\`| \`adj.computeIfAbsent(u, k -> new ArrayList<>()).add(v);\`| $O(1)$ avg | Computes and inserts value atomically if key missing. |
| | \`map.putIfAbsent(k, v)\` | \`map.putIfAbsent(token, session);\` | $O(1)$ avg | Inserts only if key is not mapped. |
| | \`map.merge(k, v, fn)\` | \`map.merge(word, 1, Integer::sum); // clean count\`| $O(1)$ avg | Merges value using binary remapping function. |
| **Lookup** | \`map.containsKey("k")\` | \`if (map.containsKey(id)) { ... }\` | $O(1)$ avg | Tests key presence without returning value. |
| | \`map.containsValue(v)\`| \`if (map.containsValue(val)) { ... }\` | $O(N)$ | Scans all buckets linearly. |
| **Views** | \`map.keySet()\` | \`for (String k : map.keySet()) { ... }\` | $O(N)$ | Set view of keys. |
| | \`map.entrySet()\` | \`for (Map.Entry<K, V> e : map.entrySet()) { ... }\`| $O(N)$ | Iterates entries avoiding double-lookup overhead. |`,
    code: `import java.util.*;

public class HashMapLab {
    public void demonstrate() {
        Map<String, Integer> map = new HashMap<>();

        // 1. Basic put and getOrDefault
        map.put("Apple", 5);
        int count = map.getOrDefault("Banana", 0); // 0 (safe read)

        // 2. Java 8 computeIfAbsent for Graph Adjacency List
        Map<Integer, List<Integer>> adj = new HashMap<>();
        adj.computeIfAbsent(1, k -> new ArrayList<>()).add(2);

        // 3. merge() for Word Frequency Counting
        Map<String, Integer> freq = new HashMap<>();
        freq.merge("word", 1, Integer::sum);
        freq.merge("word", 1, Integer::sum);
        assert freq.get("word") == 2;
    }
}`,
  },

  // ── 10. LinkedHashMap<K, V> ──
  {
    id: "jcf-linkedhashmap",
    title: "LinkedHashMap<K, V>: Predictable Iteration & LRU Cache Engine",
    slug: "jcf-linkedhashmap",
    track: "jcf",
    category: "Java Collections",
    subCategory: "Sets & Maps",
    language: "Java",
    difficulty: "Intermediate",
    tags: ["java", "jcf", "linkedhashmap", "lru-cache", "access-order"],
    xpBounty: 65,
    paradigm: "Hash Table with Access-Order Doubly-Linked Chain",
    coreConcept: "Augments HashMap with a running doubly-linked list of entries; supports access-order mode to construct an LRU cache via removeEldestEntry",
    timeComplexity: "O(1) average get(), put(), remove()",
    spaceComplexity: "O(N) with 2 extra references (before, after) per Entry",
    description: "Hash table maintaining insertion-order or access-order across entries, serving as the foundational building block for Java LRU caches.",
    theory: `#### Container Specification & Hierarchy (java.util.LinkedHashMap)
\`LinkedHashMap<K, V>\` extends \`HashMap<K, V>\` to provide deterministic iteration order:
1. **Insertion-Order (Default)**: Iteration reflects the sequence keys were first inserted.
2. **Access-Order**: Activated via \`new LinkedHashMap<>(cap, loadFactor, true)\`. Every \`get()\` or \`put()\` moves the accessed entry to the tail of the linked list!

#### Building an Instant LRU Cache
By overriding the protected method \`removeEldestEntry(Map.Entry<K, V> eldest)\`, \`LinkedHashMap\` transforms into an automated, bounded **LRU Cache**:
\`\`\`java
@Override
protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
    return size() > MAX_ENTRIES; // Evicts least recently used head element!
}
\`\`\`

#### Exhaustive Member Method Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Mapping Operations**| \`map.put("k", 1)\` | \`lru.put(key, val); // links to tail\` | $O(1)$ avg | Inserts/updates mapping and moves to tail in access-order mode. |
| | \`map.get("k")\` | \`lru.get(key); // moves entry to tail\` | $O(1)$ avg | Retrieves value and updates recency order. |
| **LRU Hook** | \`removeEldestEntry()\`| \`return size() > capacity; // automated eviction\`| $O(1)$ | Hook evaluated after every \`put()\` to trigger eviction. |
| **Views** | \`map.entrySet()\` | \`for (var e : map.entrySet()) { ... }\` | $O(N)$ | Iterates in strictly predictable order (insertion or recency). |`,
    code: `import java.util.*;

public class LinkedHashMapLab {
    // Elegant Production LRU Cache in 12 lines of Java
    public static class LRUCache<K, V> extends LinkedHashMap<K, V> {
        private final int maxCapacity;

        public LRUCache(int capacity) {
            super(capacity, 0.75f, true); // true = access-order
            this.maxCapacity = capacity;
        }

        @Override
        protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            return size() > maxCapacity; // Evicts least recently accessed
        }
    }

    public void demonstrate() {
        LRUCache<Integer, String> cache = new LRUCache<>(2);
        cache.put(1, "A");
        cache.put(2, "B");
        cache.get(1);     // Access 1 (makes 2 the eldest)
        cache.put(3, "C"); // Evicts 2!
        assert !cache.containsKey(2);
    }
}`,
  },

  // ── 11. TreeMap<K, V> ──
  {
    id: "jcf-treemap",
    title: "TreeMap<K, V>: Red-Black Tree-Backed Navigable Map",
    slug: "jcf-treemap",
    track: "jcf",
    category: "Java Collections",
    subCategory: "Sets & Maps",
    language: "Java",
    difficulty: "Intermediate",
    tags: ["java", "jcf", "treemap", "red-black-tree", "navigable-map", "sorted"],
    xpBounty: 65,
    paradigm: "Self-Balancing Red-Black Binary Search Tree",
    coreConcept: "NavigableMap implementation guaranteeing O(log N) lookups, sorted key traversal, and floor/ceiling prefix searches",
    timeComplexity: "O(log N) put(), get(), remove(), floorKey(), ceilingKey()",
    spaceComplexity: "O(N) with ~32-40 bytes tree node overhead per entry",
    description: "Sorted dictionary backed by a Red-Black tree providing guaranteed logarithmic lookups and extensive prefix/range queries.",
    theory: `#### Container Specification & Hierarchy (java.util.TreeMap)
\`TreeMap<K, V>\` is a \`NavigableMap<K, V>\` implementation based on a **Red-Black Tree**.
* Guarantees strictly **$O(\\log N)$ time** for \`containsKey\`, \`get\`, \`put\`, and \`remove\`.
* Iteration over keys or entries is guaranteed to be in ascending key order.

#### Exhaustive Member Method Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Mapping Operations**| \`map.put("k", 1)\` | \`map.put(key, val); // log(N) insert\` | $O(\\log N)$ | Inserts key-value pair and rebalances tree. |
| | \`map.get("k")\` | \`Integer val = map.get(key);\` | $O(\\log N)$ | Searches tree node matching key. |
| | \`map.remove("k")\` | \`map.remove(key); // log(N) delete\` | $O(\\log N)$ | Deletes node and restores Red-Black invariant. |
| **Navigable Queries**| \`map.floorKey(10)\` | \`Integer prev = map.floorKey(ts); // greatest <= ts\` | $O(\\log N)$ | Greatest key $\\le$ specified key. |
| | \`map.ceilingKey(10)\`| \`Integer next = map.ceilingKey(ts); // least >= ts\` | $O(\\log N)$ | Least key $\\ge$ specified key. |
| | \`map.firstEntry()\` | \`var minEntry = map.firstEntry();\` | $O(\\log N)$ | Entry with lowest key. |
| | \`map.lastEntry()\` | \`var maxEntry = map.lastEntry();\` | $O(\\log N)$ | Entry with highest key. |
| **Range Submaps** | \`map.subMap(from, to)\`| \`var range = map.subMap(10, true, 50, false);\` | $O(1)$ | View of submap within specified key range. |`,
    code: `import java.util.*;

public class TreeMapLab {
    public void demonstrate() {
        NavigableMap<Integer, String> timeline = new TreeMap<>();
        timeline.put(100, "Boot");
        timeline.put(250, "Auth");
        timeline.put(500, "Sync");

        // Nearest timestamp queries in O(log N)
        int nearestPast = timeline.floorKey(200);   // 100
        int nearestFuture = timeline.ceilingKey(200); // 250
        assert nearestFuture == 250;

        // Custom descending order
        NavigableMap<Integer, String> descMap = new TreeMap<>(Collections.reverseOrder());
        descMap.put(1, "Low");
        descMap.put(10, "High");
        assert descMap.firstKey() == 10;
    }
}`,
  },

  // ── 12. BitSet ──
  {
    id: "jcf-bitset",
    title: "BitSet: 64-Bit Word-Packed High-Speed Bit Vector",
    slug: "jcf-bitset",
    track: "jcf",
    category: "Java Collections",
    subCategory: "Specialized Containers",
    language: "Java",
    difficulty: "Advanced",
    tags: ["java", "jcf", "bitset", "bit-manipulation", "knapsack", "bit-parallelism"],
    xpBounty: 65,
    paradigm: "Word-Level Parallelism & Sub-Word Bit Packing",
    coreConcept: "Dynamically resizing long[] array packing 64 boolean flags into each primitive long word, accelerating bitwise operations by 64x",
    timeComplexity: "O(N/64) for bitwise logical operations (and, or, xor), O(1) for get/set/clear",
    spaceComplexity: "O(N/8) bytes contiguous storage (8x less memory than boolean[] array)",
    description: "Compact bit vector packing 64 boolean flags per native long word, accelerating graph reachability and subset-sum DP by 64x.",
    theory: `#### Container Specification & Hierarchy (java.util.BitSet)
\`BitSet\` is a specialized vector of bits that grows dynamically as needed.
* In standard Java, a \`boolean[]\` array consumes **1 byte per boolean** (8 bits).
* \`BitSet\` packs bits into primitive **\`long[] words\`** (64 bits per word).
$$\\text{Total Memory} = \\left\\lceil \\frac{N}{64} \\right\\rceil \\times 8 \\text{ bytes}$$

#### The 64x Bit-Parallel Speedup
Modern 64-bit CPUs execute bitwise instructions (\`and\`, \`or\`, \`xor\`) across 64 bits in a single CPU cycle.
* BitSet's \`bs.or(other)\` processes 64 elements per clock cycle:
$$\\text{Complexity} = O\\left(\\frac{N}{64}\\right)$$

\`\`\`text
BitSet long[] words:
Word 0: [ bit 63 ... bit 0 ] (64 boolean flags in 8 bytes)
Word 1: [ bit 127 ... bit 64 ]
One CPU instruction computes AND/OR across 64 booleans simultaneously!
\`\`\`

#### Exhaustive Member Method Reference Table
| Category | Function (Example) | Use Case (Code Snippet) | Time Complexity | Description & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Bit Access** | \`bs.get(3)\` | \`if (visited.get(u)) continue;\` | $O(1)$ | Returns \`true\` if bit is set. |
| | \`bs.cardinality()\` | \`int active = bs.cardinality(); // POPCNT\` | $O(N/64)$ | Returns number of bits set to 1. |
| | \`bs.length()\` | \`int highIndex = bs.length();\` | $O(1)$ | "Logical size": index of highest set bit + 1. |
| | \`bs.isEmpty()\` | \`if (bs.isEmpty()) return;\` | $O(N/64)$ | Returns \`true\` if no bits are set to 1. |
| **Modifiers** | \`bs.set(0)\` | \`bs.set(node_id); // mark visited\` | $O(1)$ | Sets bit at index to \`true\`. |
| | \`bs.clear(1)\` | \`bs.clear(flag_id); // unmark visited\` | $O(1)$ | Sets bit at index to \`false\`. |
| | \`bs.flip(2)\` | \`bs.flip(toggle_id); // toggle bit\` | $O(1)$ | Inverts bit at index. |
| **Bitwise Operations**| \`bs.or(other)\` | \`bs.or(mask); // 64x bitwise OR\` | $O(N/64)$ | Performs in-place bitwise OR. |
| | \`bs.and(other)\` | \`bs.and(mask); // 64x bitwise AND\` | $O(N/64)$ | Performs in-place bitwise AND. |
| | \`bs.xor(other)\` | \`bs.xor(mask); // 64x bitwise XOR\` | $O(N/64)$ | Performs in-place bitwise XOR. |
| | \`bs.intersects(other)\`| \`if (bs.intersects(other)) { ... }\` | $O(N/64)$ | Checks if two BitSets have any set bits in common. |`,
    code: `import java.util.BitSet;

public class BitSetLab {
    public void demonstrate() {
        BitSet bs = new BitSet(100);
        
        // 1. Bit access and modification
        bs.set(10);
        bs.set(25);
        boolean isSet = bs.get(10);   // true
        int totalSet = bs.cardinality(); // 2

        // 2. 64x Bit-Parallel Operations
        BitSet other = new BitSet(100);
        other.set(25);
        other.set(50);

        bs.or(other);                 // Computes union across 64 bits per instruction!
        assert bs.get(50);
    }
}`,
  },
];
