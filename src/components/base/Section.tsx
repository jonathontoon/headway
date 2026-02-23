import { type HTMLAttributes, type PropsWithChildren, forwardRef } from 'react';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  className?: string;
}

const Section = forwardRef<HTMLElement, PropsWithChildren<SectionProps>>(
  ({ className, children, ...attrs }, ref) => (
    <section ref={ref} className={className} {...attrs}>
      {children}
    </section>
  )
);

Section.displayName = 'Section';

export default Section;
