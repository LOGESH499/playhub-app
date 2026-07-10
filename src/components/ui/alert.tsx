import { cn } from "@/lib/utils";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success";
}

export function Alert({ className, variant = "default", ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-xl border px-4 py-3 text-sm leading-6 shadow-xs",
        variant === "default" && "border-border/70 bg-muted/45 text-foreground",
        variant === "destructive" &&
          "border-destructive/35 bg-destructive/10 text-destructive",
        variant === "success" &&
          "border-success/35 bg-success/10 text-success",
        className
      )}
      {...props}
    />
  );
}
