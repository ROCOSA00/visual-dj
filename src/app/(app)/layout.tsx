import { AppShortcutsDialog, CreateVisualDialog, ShowPickerDialog } from "@/components/app-shell/AppDialogs";
import { AppSidebar } from "@/components/app-shell/AppSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <AppSidebar />
      <main className="relative min-w-0 flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_60%_80%_at_30%_-20%,rgb(139_92_246/0.14),transparent_70%),radial-gradient(ellipse_40%_60%_at_90%_-10%,rgb(34_211_238/0.08),transparent_70%)]" />
        <div className="relative">{children}</div>
      </main>
      <CreateVisualDialog />
      <ShowPickerDialog />
      <AppShortcutsDialog />
    </div>
  );
}
