import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
        secondary: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
        destructive: "bg-red-100 text-red-700",
        outline: "border border-purple-300 text-purple-700",
        success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
        gold: "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-sm",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
