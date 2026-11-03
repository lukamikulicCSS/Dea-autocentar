import { POLICY } from "@/lib/legal";

/** Zajednički izgled pravnih tekstova (politika privatnosti, uvjeti korištenja). */
export function LegalArticle({ children }: { children: React.ReactNode }) {
  return (
    <article
      className={[
        "wrap max-w-3xl space-y-10 py-14 text-[1.0625rem] leading-relaxed",
        "[&_h2]:mb-3 [&_h2]:scroll-mt-28 [&_h2]:text-xl",
        "[&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-semibold",
        "[&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5",
        "[&_a]:underline [&_a]:underline-offset-2",
      ].join(" ")}
    >
      {children}
      <p className="border-t border-line pt-6 text-sm text-ink-muted">
        Verzija {POLICY.version}, vrijedi od {POLICY.effectiveDate}
      </p>
    </article>
  );
}

/** Tablica koja se na uskom zaslonu pomiče vodoravno unutar sebe. */
export function LegalTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-sm border border-line">
      <table className="w-full min-w-[36rem] border-collapse text-left text-[0.9375rem]">
        <thead className="bg-surface">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="border-b border-line px-3 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              {r.map((c, j) => (
                <td key={j} className="border-b border-line px-3 py-2.5 last:pr-4">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
