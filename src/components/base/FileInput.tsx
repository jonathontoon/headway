import { type HTMLAttributes, type FunctionComponent } from "react"

interface FileInputProps extends HTMLAttributes<HTMLInputElement> {
  className?: string
}

const FileInput: FunctionComponent<FileInputProps> = ({
  className,
  ...attrs
}) => {
  return <input type="file" className={className} {...attrs} />
}

export default FileInput
