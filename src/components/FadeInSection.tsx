import type { ReactNode } from "react";

interface FadeInSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeInSection({ children, className = "" }: FadeInSectionProps) {
  return <div className={className}>{children}</div>;
}
