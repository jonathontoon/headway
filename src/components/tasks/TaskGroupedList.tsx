import { useVisibleTaskGroups } from "@hooks/useVisibleTaskGroups";
import type { VisibleTask } from "@reducers/tasks/taskTypes";
import TaskRow from "@components/tasks/TaskRow";

interface Props {
  tasks: readonly VisibleTask[];
}

const TaskGroupedList = ({ tasks }: Props) => {
  const groups = useVisibleTaskGroups(tasks);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <div className="mb-1 select-none text-sm text-terminal-muted">
            -- {group.label} --
          </div>
          <ol className="m-0 flex flex-col gap-0.5 list-none p-0">
            {group.tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
};

export default TaskGroupedList;
