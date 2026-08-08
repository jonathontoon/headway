import { TERMINAL_BLOCK_GAP_H } from "../constants";

/**
 * Renders a terminal spacer row.
 *
 * @returns An empty terminal block gap.
 */
export const TerminalBlank = () => {
  return <div className={TERMINAL_BLOCK_GAP_H} aria-hidden="true" />;
};
