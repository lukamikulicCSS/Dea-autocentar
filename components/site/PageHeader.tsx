import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** Zaglavlje podstranice: putanja (breadcrumbs) + naslov na tamnoj podlozi. */
export function PageHeader({
  title,
  description,
  crumbs,
  children,
}: {
  title: string;
  description?: string;
  crumbs: { name: string; href?: string }[];
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-asphalt text-white">
      <div className="wrap pb-10 pt-6 sm:pb-12">
        <nav aria-label="Putanja">
          <ol className="flex flex-wrap items-center gap-1 text-[0.8125rem] text-fog">
            {crumbs.map((c, i) => (
              <li key={c.name} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3.5" aria-hidden="true" />}
                {c.href ? (
                  <Link href={c.href} className="hover:text-white">{c.name}</Link>
                ) : (
                  <span aria-current="page" className="text-white">{c.name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <span aria-hidden="true" className="mb-4 mt-8 block h-[3px] w-10 -skew-x-[28deg] bg-red" />
        <h1 className="max-w-3xl text-[2rem] sm:text-[2.75rem]">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-[1.0625rem] text-fog">{description}</p>}
        {children}
      </div>
    </div>
  );
}
