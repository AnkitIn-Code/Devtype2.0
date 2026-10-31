// src/data/curatedSnippets.js
// Curated Algorithmic Blueprints catalog:
// - C++ Foundations & Language Mechanics (8 Blueprints)
// - STL Mastery & Standard Containers (12 Standard Container Headers: <array>, <vector>, <deque>, <forward_list>, <list>, <stack>, <queue>, <set>, <map>, <unordered_set>, <unordered_map>, <bitset>)
// - Java Core Foundations & Language Mechanics (15 Master Blueprints from Oracle Tutorials)
// - Java Collections Framework (JCF) Mastery (12 Standard Containers: ArrayList, LinkedList, CopyOnWriteArrayList, ArrayDeque, PriorityQueue, HashSet, LinkedHashSet, TreeSet, HashMap, LinkedHashMap, TreeMap, BitSet)
// - CP-Algorithms.com Algorithmic Drills (36 Blueprints)
import { CPP_FOUNDATIONS_SNIPPETS } from './cppFoundationsSnippets.js';
import { STL_SNIPPETS } from './stlSnippets.js';
import { JAVA_FOUNDATIONS_SNIPPETS } from './javaFoundationsSnippets.js';
import { JAVA_COLLECTIONS_SNIPPETS } from './javaCollectionsSnippets.js';
import { CP_SNIPPETS } from './cpSnippets.js';

export const CURATED_SNIPPETS = [
  ...CPP_FOUNDATIONS_SNIPPETS,
  ...STL_SNIPPETS,
  ...JAVA_FOUNDATIONS_SNIPPETS,
  ...JAVA_COLLECTIONS_SNIPPETS,
  ...CP_SNIPPETS.map((s) => ({ ...s, track: s.track || 'cp' })),
];
