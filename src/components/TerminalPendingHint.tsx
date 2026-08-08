import { useKeyDown } from "../hooks/useKeyDown";

type TerminalPendingHintProps = {
  readonly onCancel: () => void;
};

/**
 * Renders the pending-operation cancel hint.
 *
 * @param props - Cancel handler called when the user presses a key.
 * @returns The pending command hint.
 */
export const TerminalPendingHint = ({ onCancel }: TerminalPendingHintProps) => {
  useKeyDown((event) => {
    // Preserve OS/browser shortcuts (copy, refresh, ...) instead of
    // treating every modifier combo as a cancel request.
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    onCancel();
  });

  return (
    <p className="m-0 text-role-muted whitespace-pre-wrap font-mono text-xs sm:text-sm md:text-base leading-[1.9]">
      Press any key to cancel
    </p>
  );
};
