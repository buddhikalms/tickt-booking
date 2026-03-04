import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", {
  variants: {
    variant: {
      default: "bg-amber-700 text-amber-50 dark:bg-amber-500 dark:text-amber-950",
      secondary: "border border-[var(--border-soft)] bg-[var(--surface-panel)] text-[var(--text-soft)] dark:text-[var(--text-soft)]",
      success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
      warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
      destructive: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
