import type { FunctionComponent, PropsWithChildren } from 'react';
import Paragraph from '@atoms/Paragraph.tsx';

type InstructionProps = Record<string, never>;

const Instruction: FunctionComponent<PropsWithChildren<InstructionProps>> = ({
  children,
}) => <Paragraph className="mt-2 text-yellow-400">[{children}]</Paragraph>;

export default Instruction;
