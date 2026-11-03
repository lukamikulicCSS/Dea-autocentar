import { describe, expect, it } from "vitest";
import {
  CONSENT_COOKIE,
  CONSENT_VERSION,
  makeChoice,
  parseConsent,
  readConsentFromCookieString,
  serializeConsent,
} from "@/lib/consent";

describe("privola za kolačiće", () => {
  it("sprema i čita odluku bez gubitka", () => {
    const c = makeChoice(true, new Date("2026-11-02T10:00:00.000Z"));
    expect(parseConsent(serializeConsent(c))).toEqual(c);
    const n = makeChoice(false, new Date("2026-11-02T10:00:00.000Z"));
    expect(parseConsent(serializeConsent(n))?.external).toBe(false);
  });

  it("nema odluke ili je vrijednost oštećena → ponovo pitaj", () => {
    expect(parseConsent(undefined)).toBeNull();
    expect(parseConsent("")).toBeNull();
    expect(parseConsent("smeće")).toBeNull();
    expect(parseConsent("%E0%A4%A")).toBeNull();
    expect(parseConsent(encodeURIComponent(`${CONSENT_VERSION}.2.2026-11-02T10:00:00.000Z`))).toBeNull();
  });

  it("stara verzija pravila → privola više ne vrijedi", () => {
    const old = encodeURIComponent(`${CONSENT_VERSION + 1}.1.2026-11-02T10:00:00.000Z`);
    expect(parseConsent(old)).toBeNull();
  });

  it("pronalazi kolačić među ostalima", () => {
    const value = serializeConsent(makeChoice(true, new Date("2026-11-02T10:00:00.000Z")));
    const jar = `sb-abc-auth-token=xyz; ${CONSENT_COOKIE}=${value}; drugi=1`;
    expect(readConsentFromCookieString(jar)?.external).toBe(true);
    expect(readConsentFromCookieString("drugi=1")).toBeNull();
  });
});
