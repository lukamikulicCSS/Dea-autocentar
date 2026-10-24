"use client";

import { useId, useRef, useState } from "react";
import { Search } from "lucide-react";
import { suggest, vehiclesLabel, type IndexRow, type SuggestScope, type Suggestion } from "@/lib/vehicles/suggest";

/** Sažetak ponude dijele sva polja na stranici i učitava se samo jednom. */
let indexPromise: Promise<IndexRow[]> | null = null;
function loadIndex(): Promise<IndexRow[]> {
  indexPromise ??= fetch("/api/marke")
    .then((r) => (r.ok ? r.json() : { rows: [] }))
    .then((d: { rows?: IndexRow[] }) => d.rows ?? [])
    .catch(() => {
      indexPromise = null; // pokušaj ponovno pri sljedećem fokusu
      return [];
    });
  return indexPromise;
}

/**
 * Polje pretrage s prijedlozima: već od prvog slova nudi marke (i modele)
 * s brojem vozila u ponudi. Odabir upisuje marku i odmah pokreće pretragu.
 * Pristupačno (ARIA combobox), radi strelicama, Enterom i Escapeom.
 * Bez JavaScripta ostaje obično polje pretrage.
 */
export function SearchSuggest({
  id,
  defaultValue,
  placeholder,
  scope,
  tone = "light",
  className = "",
}: {
  id: string;
  defaultValue?: string;
  placeholder?: string;
  scope: SuggestScope;
  tone?: "light" | "dark";
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const rowsRef = useRef<IndexRow[] | null>(null);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const dark = tone === "dark";

  function update(value: string) {
    const rows = rowsRef.current;
    if (!rows) {
      void loadIndex().then((r) => {
        rowsRef.current = r;
        if (inputRef.current === document.activeElement) update(inputRef.current?.value ?? "");
      });
      return;
    }
    const next = suggest(rows, value, scope);
    setItems(next);
    setActive(-1);
    setOpen(next.length > 0);
  }

  function choose(item: Suggestion) {
    const input = inputRef.current;
    if (!input) return;
    input.value = item.query;
    setOpen(false);
    input.form?.requestSubmit();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || items.length === 0) {
      if (e.key === "ArrowDown") update(e.currentTarget.value);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(items[active]!);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const optionId = (i: number) => `${listId}-o${i}`;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        maxLength={60}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        onFocus={(e) => {
          void loadIndex().then((r) => (rowsRef.current = r));
          if (e.currentTarget.value) update(e.currentTarget.value);
        }}
        onChange={(e) => update(e.currentTarget.value)}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
        className={className}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Prijedlozi"
          className={`absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-md border py-1 shadow-[0_8px_24px_rgb(17_19_21/0.18)] ${
            dark ? "border-line-dark bg-graphite text-white" : "border-line bg-white text-ink"
          }`}
        >
          {items.map((item, i) => (
            <li
              key={`${item.kind}-${item.label}`}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              // mousedown umjesto click: odabir se dogodi prije nego polje izgubi fokus
              onMouseDown={(e) => {
                e.preventDefault();
                choose(item);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex min-h-11 cursor-pointer items-center gap-3 px-3 text-[0.9375rem] ${
                i === active ? (dark ? "bg-graphite-2" : "bg-paper") : ""
              } ${item.kind === "model" ? "pl-9" : ""}`}
            >
              {item.kind === "brand" && <Search className={`size-4 shrink-0 ${dark ? "text-fog" : "text-ink-muted"}`} aria-hidden="true" />}
              <span className={`flex-1 truncate ${item.kind === "brand" ? "font-semibold" : ""}`}>{item.label}</span>
              <span className={`tabular shrink-0 text-sm ${dark ? "text-fog" : "text-ink-muted"}`}>{vehiclesLabel(item.count)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
