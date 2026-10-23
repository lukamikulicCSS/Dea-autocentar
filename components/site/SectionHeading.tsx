import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Naslov sekcije s crvenom kosom crtom iz DEA logotipa i neobaveznom poveznicom. */
export function SectionHeading({
  title,
  description,
  href,
  linkLabel,
  tone = "light",
  as: Tag = "h2",
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  tone?: "light" | "dark";
  as?: "h1" | "h2";
}) {
  const dark = tone === "dark";
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <span aria-hidden="true" className="mb-4 block h-[3px] w-10 -skew-x-[28deg] bg-red" />
        <Tag className={`text-[1.75rem] sm:text-[2.125rem] ${dark ? "text-white" : "text-ink"}`}>{title}</Tag>
        {description && <p className={`mt-3 text-[1.0625rem] ${dark ? "text-fog" : "text-ink-muted"}`}>{description}</p>}
      </div>
      {href && linkLabel && (
        <Link href={href} className={`group inline-flex shrink-0 items-center gap-2 text-[0.9375rem] font-semibold ${dark ? "text-white" : "text-ink"}`}>
          <span className="underline decoration-red decoration-2 underline-offset-[6px]">{linkLabel}</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
