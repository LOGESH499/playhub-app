import { PlatformSidebar } from "@/features/platform-admin";

export default function PlatformShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <PlatformSidebar />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
