import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StatusStateTone = "empty" | "error" | "success";

interface StatusStateProps {
  title: string;
  description?: string;
  tone?: StatusStateTone;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

const toneStyles: Record<StatusStateTone, string> = {
  empty: "text-muted-foreground",
  error: "text-destructive",
  success: "text-success",
};

const defaultIcons: Record<StatusStateTone, LucideIcon> = {
  empty: Inbox,
  error: AlertCircle,
  success: CheckCircle2,
};

export function StatusState({
  title,
  description,
  tone = "empty",
  icon,
  action,
  className,
}: StatusStateProps) {
  const Icon = icon ?? defaultIcons[tone];

  return (
    <div
      className={cn(
        "surface-card flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
    >
      <div
        className={cn(
          "mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-muted/40",
          toneStyles[tone]
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="text-base font-semibold tracking-[-0.02em]">{title}</h2>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <Button
          className="mt-5"
          onClick={action.onClick}
          asChild={Boolean(action.href)}
        >
          {action.href ? <a href={action.href}>{action.label}</a> : action.label}
        </Button>
      )}
    </div>
  );
}
