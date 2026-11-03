"use client";

import { OPEN_CONSENT_EVENT } from "@/lib/consent";

/** Gumb koji u bilo kojem trenutku otvara postavke kolačića (povlačenje privole jednako lako kao davanje). */
export function CookieSettingsButton({ className, children = "Postavke kolačića" }: { className?: string; children?: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}>
      {children}
    </button>
  );
}
