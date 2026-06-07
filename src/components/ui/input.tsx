import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        size={undefined}
        className={cn(
          "flex h-10 w-full min-w-0 rounded-xl border-2 border-purple-200 bg-white px-4 py-2 text-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-purple-500 focus-visible:ring-2 focus-visible:ring-purple-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-purple-800 dark:bg-gray-950 dark:focus-visible:border-purple-400",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
