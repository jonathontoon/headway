import { parseTodoLine, serializeTodo } from "./parser";

describe("todo.txt parser", () => {
  it("parses and serializes an incomplete task with priority and creation date", () => {
    const result = parseTodoLine(
      "(A) 2026-07-05 Task +Project @context due:2026-07-10 custom:value",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.task).toMatchObject({
      completed: false,
      priority: "A",
      creationDate: "2026-07-05",
      text: "Task +Project @context due:2026-07-10 custom:value",
      projects: ["Project"],
      contexts: ["context"],
    });
    expect(result.task.metadata).toEqual([
      { key: "due", value: "2026-07-10" },
      { key: "custom", value: "value" },
    ]);
    expect(serializeTodo(result.task)).toBe(
      "(A) 2026-07-05 Task +Project @context due:2026-07-10 custom:value",
    );
  });

  it("parses and serializes a completed task with completion date and pri metadata", () => {
    const result = parseTodoLine(
      "x 2026-07-05 2026-07-01 Task +Project @context pri:A",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.task).toMatchObject({
      completed: true,
      priority: "A",
      completionDate: "2026-07-05",
      creationDate: "2026-07-01",
      text: "Task +Project @context pri:A",
    });
    expect(serializeTodo(result.task)).toBe(
      "x 2026-07-05 2026-07-01 Task +Project @context pri:A",
    );
  });

  it("keeps malformed-looking free text as task text", () => {
    const result = parseTodoLine("Really call Mom (A) xylophone due soon");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.task.priority).toBeUndefined();
    expect(result.task.text).toBe("Really call Mom (A) xylophone due soon");
  });

  it("rejects blank lines", () => {
    expect(parseTodoLine("   ")).toEqual({
      ok: false,
      error: "blank todo.txt line",
    });
  });
});
