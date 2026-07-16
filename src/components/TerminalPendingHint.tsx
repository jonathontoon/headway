import { useEffect } from "react";

type TerminalPendingHintProps = {
  readonly onCancel: () => void;
};

export function TerminalPendingHint({ onCancel }: TerminalPendingHintProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Preserve OS/browser shortcuts (copy, refresh, ...) instead of
      // treating every modifier combo as a cancel request.
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      onCancel();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <p
      onClick={onCancel}
      className="m-0 text-role-muted whitespace-pre-wrap font-mono text-xs sm:text-sm md:text-base leading-[1.9] cursor-pointer"
    >
      Press any key to cancel
    </p>
  );
}
