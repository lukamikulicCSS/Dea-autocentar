"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Mail, Trash2 } from "lucide-react";
import { deleteInquiry, updateInquiry } from "@/app/admin/actions/inquiries";
import { INQUIRY_STATUS_LABELS, INQUIRY_STATUSES, type InquiryStatus } from "@/lib/vehicles/constants";
import { ConfirmButton } from "./ConfirmButton";
import { Notice } from "./Notice";

export function InquiryControls({
  id,
  email,
  subject,
  initial,
}: {
  id: string;
  email: string;
  subject: string;
  initial: { status: InquiryStatus; is_read: boolean; internal_note: string | null };
}) {
  const [status, setStatus] = useState(initial.status);
  const [isRead, setIsRead] = useState(initial.is_read);
  const [note, setNote] = useState(initial.internal_note ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function save(patch: Parameters<typeof updateInquiry>[1]) {
    setMsg(null);
    start(async () => {
      const res = await updateInquiry(id, patch);
      setMsg({ ok: res.ok, text: res.ok ? res.message ?? "Spremljeno." : res.message });
    });
  }

  const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <a href={mailto} className="btn btn-primary" onClick={() => { if (status === "new") { setStatus("in_progress"); save({ status: "in_progress", is_read: true }); } }}>
          <Mail className="size-4" aria-hidden="true" />
          Odgovori emailom
        </a>
        <button type="button" className="btn btn-outline" disabled={pending} onClick={() => { setStatus("answered"); setIsRead(true); save({ status: "answered" }); }}>
          Označi kao odgovoreno
        </button>
        <button type="button" className="btn btn-outline" disabled={pending} onClick={() => { const v = !isRead; setIsRead(v); save({ is_read: v }); }}>
          {isRead ? "Označi kao nepročitano" : "Označi kao pročitano"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
        <div>
          <label htmlFor="inq-status" className="label">Status upita</label>
          <select
            id="inq-status"
            className="field"
            value={status}
            onChange={(e) => {
              const v = e.target.value as InquiryStatus;
              setStatus(v);
              save({ status: v });
            }}
          >
            {INQUIRY_STATUSES.map((s) => <option key={s} value={s}>{INQUIRY_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="inq-note" className="label">Interna bilješka</label>
          <textarea id="inq-note" className="field" rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="npr. Nazvan 24.10., dolazi u subotu" />
          <button type="button" className="btn btn-dark btn-sm mt-2" disabled={pending} onClick={() => save({ internal_note: note })}>
            {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            Spremi bilješku
          </button>
        </div>
      </div>

      {msg && <Notice tone={msg.ok ? "success" : "error"}>{msg.text}</Notice>}

      <div className="border-t border-line pt-5">
        <ConfirmButton
          label="Obriši upit"
          title="Obrisati upit?"
          description="Upit i bilješka bit će trajno obrisani. Koristite ovo i kad kupac zatraži brisanje svojih podataka."
          confirmLabel="Obriši"
          onConfirm={() => deleteInquiry(id)}
          className="btn btn-sm btn-outline text-red-deep"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Obriši upit
        </ConfirmButton>
      </div>
    </div>
  );
}
