## 2026-02-24 - [Input Validation Gaps in Terminal Interface]
**Vulnerability:** User input for todo tasks and indices lacked length limits and proper numeric validation, leading to potential storage exhaustion and state corruption via NaN.
**Learning:** `parseInt` can return `NaN` which bypasses range checks like `n < 1`. Local storage can be easily exhausted by large inputs if not capped.
**Prevention:** Implement `MAX_TODO_LENGTH` and `MAX_TODO_COUNT` constants and use `Number.isInteger` for all index-based operations.
