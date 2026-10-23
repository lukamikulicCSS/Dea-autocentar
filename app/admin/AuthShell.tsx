import { Logo } from "@/components/site/Logo";

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-asphalt px-4 py-10">
      <div className="w-full max-w-sm">
        <Logo variant="light" className="mx-auto w-[110px]" priority />
        <div className="mt-8 rounded-sm bg-paper p-6 sm:p-7">
          <h1 className="mb-5 text-2xl">{title}</h1>
          {children}
        </div>
      </div>
    </main>
  );
}
