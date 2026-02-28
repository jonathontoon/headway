import type { VisibleTask } from "@reducers/tasks/taskTypes";
import Response from "@components/ui/Response";
import TaskRow from "@components/tasks/TaskRow";

interface Props {
  tasks: readonly VisibleTask[];
}

const TaskList = ({ tasks }: Props) => (
  <Response as="ol" className="m-0 flex flex-col gap-0.5 list-none p-0">
    {tasks.map((task) => (
      <TaskRow key={task.id} task={task} />
    ))}
  </Response>
);

export default TaskList;
