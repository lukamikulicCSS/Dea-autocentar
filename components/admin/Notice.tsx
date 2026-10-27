import { CircleAlert, CircleCheck } from "lucide-react";

export function Notice({ tone, children }: { tone: "success" | "error" | "info"; children: React.ReactNode }) {
  const styles = {
    success: "border-status-available/30 bg-[#e9f3ee] text-[#14532f] dark:bg-status-available/15 dark:text-[#8fd8ae]",
    error: "border-red/30 bg-[#fbecec] text-red-deep dark:bg-red/15 dark:text-[#ff9a9e]",
    info: "border-steel/30 bg-[#e8eef3] text-steel dark:bg-steel/20 dark:text-steel-light",
  }[tone];
  const Icon = tone === "error" ? CircleAlert : CircleCheck;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-2.5 rounded-sm border px-3.5 py-3 text-[0.9375rem] ${styles}`}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
