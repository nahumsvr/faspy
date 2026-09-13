import type { ComponentProps } from "react";

export function Panel({ className = "", ...props }: ComponentProps<"section">) {
  return <section className={`clay-panel ${className}`} {...props} />;
}
