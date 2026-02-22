import Span from "@base/Span.tsx";
import Footer from "@base/Footer.tsx";

interface SummaryProps {
  totalTasks: number;
  overdue: number;
  dueToday: number;
  contexts: number;
  projects: number;
}

const Summary = ({ totalTasks, overdue, dueToday, contexts, projects }: SummaryProps) => (
  <Footer className="flex flex-row shrink-0 gap-6 py-1.5 px-4 sm:px-9 pb-safe-or-1.5 overflow-x-auto bg-black border-t border-[#1a1a1a] font-departure text-xs text-[#444444] select-none">
    <Span>{totalTasks} tasks</Span>
    <Span>{overdue} overdue</Span>
    <Span>{dueToday} due today</Span>
    <Span>{contexts} contexts</Span>
    <Span>{projects} projects</Span>
  </Footer>
);

export default Summary;
