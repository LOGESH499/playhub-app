import { cn } from "@/lib/utils";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success";
}

export function Alert({ className, variant = "default", ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border px-4 py-3 text-sm",
        variant === "default" && "border-border bg-muted/50 text-foreground",
        variant === "destructive" &&
          "border-destructive/50 bg-destructive/10 text-destructive",
        variant === "success" &&
          "border-primary/30 bg-primary/10 text-accent-foreground",
        className
      )}
      {...props}
    />
  );
}
