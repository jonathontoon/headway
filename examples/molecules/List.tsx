import type { FunctionComponent, PropsWithChildren, ReactNode } from "react";
import OrderedList from "@atoms/OrderedList.tsx";
import UnorderedList from "@atoms/UnorderedList.tsx";

interface ListProps {
  className?: string;
  children: ReactNode;
  ordered?: boolean;
}

const List: FunctionComponent<PropsWithChildren<ListProps>> = ({
  className,
  children,
  ordered = false
}) => {
  return ordered ? (
    <OrderedList
      className={`list-inside list-decimal space-y-1${className ? ` ${className}` : ""}`}
    >
      {children}
    </OrderedList>
  ) : (
    <UnorderedList
      className={`list-inside list-none space-y-1${className ? ` ${className}` : ""}`}
    >
      {children}
    </UnorderedList>
  );
};

export default List;
