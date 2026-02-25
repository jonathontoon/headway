## 2026-02-21 - Terminal History Rendering Optimization

**Learning:** In terminal-like applications where input and history share a common parent state, typing in the input can trigger expensive re-renders of the entire history list. Isolating the history into a memoized component prevents this, keeping the input snappy even with large histories.
**Action:** Always decouple frequently-changing input state from static or semi-static list state (like logs or history) using memoization or state isolation.

## 2026-02-21 - Redundant Data Processing

**Learning:** Mutative operations that then display the result (like adding a todo and then listing todos) often re-read from the source of truth unnecessarily.
**Action:** Reuse the already-computed updated state for immediate display to avoid redundant O(n) parsing/serialization cycles.
