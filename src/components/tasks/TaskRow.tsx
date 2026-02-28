import type { VisibleTask } from "@reducers/tasks/taskTypes";
import TaskIndex from "@components/tasks/TaskIndex";
import TaskText from "@components/tasks/TaskText";

interface Props {
  task: VisibleTask;
}

const TaskRow = ({ task }: Props) => (
  <li className="flex gap-2">
    <TaskIndex index={task.visibleIndex} />
    <TaskText task={task} />
  </li>
);

export default TaskRow;
