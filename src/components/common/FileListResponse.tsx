import BlockQuote from "../base/BlockQuote"
import Paragraph from "../base/Paragraph"
import Response from "../common/Response"
import List from "../common/List"
import ListItem from "../base/ListItem"
import Span from "../base/Span"

import type { FunctionComponent } from "react"
import Instruction from "../common/Instruction"

interface FileInfo {
  name: string
  extension: string
  size: string
}

interface FileListResponseProps {
  titleText: string
  files: FileInfo[]
  instructionText?: string
  isOrdered?: boolean
}

const FileListResponse: FunctionComponent<FileListResponseProps> = ({
  titleText,
  files,
  instructionText,
  isOrdered,
}) => {
  return (
    <Response>
      <Paragraph className="pb-2 text-zinc-50">{titleText}</Paragraph>
      <BlockQuote className="pl-4">
        <List ordered={isOrdered}>
          {files.map((file) => (
            <ListItem
              key={`${file.name}${file.extension}`}
              className="text-zinc-50"
            >
              <Span className="text-cyan-300">{file.name}</Span>
              <Span className="text-yellow-200">{file.extension}</Span>
              <Span className="ml-2 text-zinc-400">({file.size})</Span>
            </ListItem>
          ))}
        </List>
      </BlockQuote>
      {instructionText && <Instruction>{instructionText}</Instruction>}
    </Response>
  )
}

export default FileListResponse
