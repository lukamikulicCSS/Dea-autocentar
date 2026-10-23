"use client";

import Script from "next/script";
import { useActionState, useId } from "react";
import { CircleCheck, LoaderCircle } from "lucide-react";
import { submitInquiry, type InquiryState } from "@/app/actions/inquiry";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Minimalni upit: samo email (obavezno) i kratka poruka (neobavezno).
 * Radi i bez JavaScripta (Server Action + progresivno poboljšanje).
 */
export function InquiryForm({
  vehicleId,
  defaultMessage = "",
  tone = "light",
  compact = false,
}: {
  vehicleId?: string;
  defaultMessage?: string;
  tone?: "light" | "dark";
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState<InquiryState, FormData>(submitInquiry, { status: "idle" });
  const id = useId();
  const dark = tone === "dark";

  if (state.status === "success") {
    return (
      <div role="status" className={`flex gap-3 rounded-sm border p-5 ${dark ? "border-line-dark bg-graphite text-white" : "border-line bg-white"}`}>
        <CircleCheck className="mt-0.5 size-5 shrink-0 text-status-available" aria-hidden="true" />
        <div>
          <p className="font-semibold">Upit je zaprimljen.</p>
          <p className={`mt-1 text-[0.9375rem] ${dark ? "text-fog" : "text-ink-muted"}`}>
            Odgovorit ćemo vam na upisanu email adresu. Ako vam je hitno, slobodno nas nazovite.
          </p>
        </div>
      </div>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const values = state.status === "error" ? state.values : undefined;
  const labelClass = `label ${dark ? "text-white" : ""}`;

  return (
    <form action={action} noValidate className="space-y-4">
      {vehicleId && <input type="hidden" name="vehicleId" value={vehicleId} />}
      {/* Honeypot — skriveno od ljudi i čitača zaslona */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Web stranica
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label htmlFor={`${id}-email`} className={labelClass}>
          Vaša email adresa
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={254}
          defaultValue={values?.email}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? `${id}-email-err` : undefined}
          className="field"
          placeholder="ime@primjer.com"
        />
        {errors.email && (
          <p id={`${id}-email-err`} className="error-text">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${id}-msg`} className={labelClass}>
          Poruka <span className={`font-normal ${dark ? "text-fog" : "text-ink-muted"}`}>(neobavezno)</span>
        </label>
        <textarea
          id={`${id}-msg`}
          name="message"
          maxLength={2000}
          rows={compact ? 3 : 4}
          defaultValue={values?.message ?? defaultMessage}
          aria-invalid={errors.message ? true : undefined}
          className="field"
        />
        {errors.message && <p className="error-text">{errors.message}</p>}
      </div>

      {TURNSTILE_SITE_KEY && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
          <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-language="hr" data-theme={dark ? "dark" : "light"} />
        </>
      )}

      {state.status === "error" && (
        <p role="alert" className="error-text text-[0.9375rem]">
          {state.message}
        </p>
      )}

      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending}>
        {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        {pending ? "Šaljem…" : "Pošalji upit"}
      </button>
      <p className={`text-[0.8125rem] ${dark ? "text-fog" : "text-ink-muted"}`}>
        Email koristimo samo za odgovor na ovaj upit.{" "}
        <a href="/privatnost" className="underline underline-offset-2">
          Privatnost
        </a>
      </p>
    </form>
  );
}
