import Link from "next/link";
import { cn } from "@/lib/utils";

interface PlayhubLogoProps {
  href?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const markSizes = {
  sm: "h-8 w-8 text-sm",
  md: "h-9 w-9 text-base",
  lg: "h-11 w-11 text-lg",
};

const textSizes = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
};

function LogoContent({
  showWordmark = true,
  size = "md",
}: Pick<PlayhubLogoProps, "showWordmark" | "size">) {
  return (
    <>
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20",
          markSizes[size]
        )}
        aria-hidden="true"
      >
        <span className="font-semibold tracking-[-0.08em]">P</span>
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary-foreground/85" />
      </span>
      {showWordmark && (
        <span
          className={cn(
            "font-semibold tracking-[-0.035em] text-foreground",
            textSizes[size]
          )}
        >
          PLAYHUB
        </span>
      )}
    </>
  );
}

export function PlayhubLogo({
  href = "/",
  showWordmark = true,
  size = "md",
  className,
}: PlayhubLogoProps) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5 focus-ring", className)}
      aria-label="PLAYHUB home"
    >
      <LogoContent showWordmark={showWordmark} size={size} />
    </Link>
  );
}

export function PlayhubLogoMark({
  size = "md",
  className,
}: Pick<PlayhubLogoProps, "size" | "className">) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <LogoContent showWordmark={false} size={size} />
    </span>
  );
}
