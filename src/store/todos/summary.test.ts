import { formatBootMessage } from "./summary";

describe("todo boot summary", () => {
  it("formats the welcome message from overdue, today, and inbox tasks", () => {
    const message = formatBootMessage(
      [
        "2026-06-20 Pay electric bill +bills due:2026-06-28",
        "(B) 2026-06-25 Schedule Goodwill pickup @phone +GarageSale due:2026-07-04",
        "(C) 2026-06-30 Fix leaky faucet @home",
        "2026-06-30 Submit quarterly report +work @computer",
      ],
      "2026-07-04",
      "Good evening",
    );

    expect(message).toBe(
      [
        "↗ headway v0.13.0",
        "Good evening. You have 1 overdue task, and 1 due today.",
        "OVERDUE",
        "1. Pay electric bill +bills due:2026-06-28",
        "TODAY",
        "2. (B) Schedule Goodwill pickup @phone +GarageSale due:2026-07-04",
        "INBOX",
        "3. (C) Fix leaky faucet @home",
        "Type 'help' for all available commands.",
      ].join("\n"),
    );
  });
});
