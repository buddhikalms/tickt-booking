import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-amber-300 bg-white/90 px-3 py-2 text-sm shadow-sm placeholder:text-amber-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-700 dark:bg-amber-950/40 dark:placeholder:text-amber-200/60",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
