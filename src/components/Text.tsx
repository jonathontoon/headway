import { type FunctionComponent, type PropsWithChildren } from "react";

const Text: FunctionComponent<PropsWithChildren> = ({ children }) => (
  <p>{children}</p>
);

export default Text;
