import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60",
  {
    variants: {
      variant: {
        default: "bg-amber-700 text-amber-50 hover:bg-amber-800 dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400",
        outline:
          "border border-amber-300 bg-white/75 text-amber-950 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/45 dark:text-amber-100 dark:hover:bg-amber-900/60",
        ghost: "text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/60",
        destructive: "bg-red-600 text-white hover:bg-red-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
