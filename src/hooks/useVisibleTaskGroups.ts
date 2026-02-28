import { useMemo } from "react";
import { useVisibleTasks } from "@contexts/TaskContext";
import { groupVisibleTasks } from "@reducers/tasks/taskSelectors";
import type { VisibleTask } from "@reducers/tasks/taskTypes";

export const useVisibleTaskGroups = (
  visibleTasks?: readonly VisibleTask[]
) => {
  const stateVisibleTasks = useVisibleTasks();
  const source = visibleTasks ?? stateVisibleTasks;

  return useMemo(() => groupVisibleTasks(source), [source]);
};
