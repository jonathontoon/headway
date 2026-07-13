import { TerminalEntry } from "./TerminalEntry";
import {
  buildShowcaseSections,
  SHOWCASE_TASK_COUNT,
} from "./testShowcaseFixtures";

const sections = buildShowcaseSections();

export default function TestShowcase() {
  return (
    <main className="block h-dvh overflow-y-auto overscroll-contain px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-6 sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:px-8 md:pt-8 md:pb-[calc(2rem+env(safe-area-inset-bottom))] box-border [-webkit-overflow-scrolling:touch]">
      {sections.map((section) => (
        <section key={section.title} className="mb-6">
          <h2 className="m-0 mb-2 font-mono text-xs sm:text-sm md:text-base leading-[1.9] text-role-muted">
            {section.title}
          </h2>
          {section.entries.map((entry, index) => (
            <TerminalEntry
              key={index}
              command={entry.command}
              output={entry.output}
              taskCount={SHOWCASE_TASK_COUNT}
            />
          ))}
        </section>
      ))}
    </main>
  );
}
