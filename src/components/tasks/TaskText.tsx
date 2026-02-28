import type { VisibleTask } from "@reducers/tasks/taskTypes";
import TaskToken from "@components/tasks/TaskToken";

interface Props {
  task: VisibleTask;
}

const PRIORITY_COLORS: Record<string, string> = {
  A: "text-terminal-prioA",
  B: "text-terminal-prioB",
  C: "text-terminal-prioC",
};

const TaskText = ({ task }: Props) => (
  <span className="flex flex-wrap gap-x-2 gap-y-1">
    {task.priority ? (
      <TaskToken
        word={`(${task.priority})`}
        className={PRIORITY_COLORS[task.priority] ?? "text-terminal-text"}
      />
    ) : null}
    <TaskToken word={task.title} />
    {task.dueDate ? (
      <TaskToken word={`due ${task.dueDate}`} className="text-terminal-warning" />
    ) : null}
    {task.project ? (
      <TaskToken word={`#${task.project}`} className="text-terminal-prioH" />
    ) : null}
    {task.context ? (
      <TaskToken word={`@${task.context}`} className="text-terminal-prioF" />
    ) : null}
  </span>
);

export default TaskText;
