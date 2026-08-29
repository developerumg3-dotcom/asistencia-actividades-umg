import type { HTMLAttributes } from "react";

export function Tarjeta({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-md border border-neutral-200 p-4 ${className ?? ""}`} {...props} />;
}
