import type { FunctionComponent, PropsWithChildren } from "react";
import Paragraph from "@atoms/Paragraph.tsx";

interface InstructionProps {}

const Instruction: FunctionComponent<PropsWithChildren<InstructionProps>> = ({
  children
}) => {
  return <Paragraph className="mt-2 text-yellow-400">[{children}]</Paragraph>;
};

export default Instruction;
