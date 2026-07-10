import { PlatformSidebar } from "@/features/platform-admin";

export default function PlatformShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <PlatformSidebar />
      </aside>
      <div>{children}</div>
    </div>
  );
}
