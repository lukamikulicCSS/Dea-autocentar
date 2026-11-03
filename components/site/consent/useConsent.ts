"use client";

import { useSyncExternalStore } from "react";
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_SECONDS,
  makeChoice,
  readConsentFromCookieString,
  serializeConsent,
  type ConsentChoice,
} from "@/lib/consent";

/**
 * Stanje privole u pregledniku (kolačić `dea_privola`).
 *  - undefined → još nije poznato (renderiranje na serveru / hidracija)
 *  - null      → posjetitelj još nije odlučio
 *  - objekt    → valjana odluka
 */
const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cached: ConsentChoice | null = null;

function getSnapshot(): ConsentChoice | null {
  const raw = document.cookie;
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = readConsentFromCookieString(raw);
  }
  return cached;
}

function getServerSnapshot(): undefined {
  return undefined;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useConsent(): ConsentChoice | null | undefined {
  return useSyncExternalStore<ConsentChoice | null | undefined>(subscribe, getSnapshot, getServerSnapshot);
}

/** Sprema odluku posjetitelja (nužni kolačić, 180 dana) i obavještava sve komponente. */
export function saveConsent(external: boolean) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${serializeConsent(makeChoice(external))}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  for (const l of listeners) l();
}
