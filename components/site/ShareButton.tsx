"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

/** Dijeljenje oglasa: izvorni izbornik na mobitelu, inače kopiranje poveznice. */
export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        if ((e as DOMException).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Kopirajte poveznicu:", url);
    }
  }

  return (
    <button type="button" onClick={share} className="btn btn-outline btn-sm">
      {copied ? <Check className="size-4 text-status-available" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
      <span aria-live="polite">{copied ? "Poveznica kopirana" : "Podijeli"}</span>
    </button>
  );
}
