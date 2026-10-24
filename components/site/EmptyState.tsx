import Link from "next/link";
import { CarFront } from "lucide-react";

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center rounded-sm border border-dashed border-line bg-surface px-6 py-14 text-center">
      <CarFront className="size-9 text-ink-muted" strokeWidth={1.5} aria-hidden="true" />
      <h2 className="mt-4 text-xl" style={{ fontStretch: "110%" }}>{title}</h2>
      <p className="mt-2 max-w-md text-ink-muted">{text}</p>
      {action && (
        <Link href={action.href} className="btn btn-dark mt-6">
          {action.label}
        </Link>
      )}
    </div>
  );
}
