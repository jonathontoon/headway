import type { FunctionComponent, PropsWithChildren } from 'react'
import Paragraph from '../base/Paragraph.tsx'

type InstructionProps = object

const Instruction: FunctionComponent<PropsWithChildren<InstructionProps>> = ({
  children,
}) => <Paragraph className="mt-2 text-yellow-400">[{children}]</Paragraph>

export default Instruction
