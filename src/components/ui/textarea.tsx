import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border-2 border-purple-200 bg-white px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-purple-500 focus-visible:ring-2 focus-visible:ring-purple-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-purple-800 dark:bg-gray-950",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
