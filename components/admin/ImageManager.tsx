"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Camera, GripVertical, ImagePlus, LoaderCircle, RotateCcw, Star, Trash2, X } from "lucide-react";
import { deleteImage, reorderImages } from "@/app/admin/actions/images";
import { MAX_IMAGES_PER_VEHICLE, MAX_UPLOAD_BYTES, vehicleImageUrl } from "@/lib/images";
import type { VehicleImage } from "@/lib/types";
import { ConfirmButton } from "./ConfirmButton";
import { Notice } from "./Notice";

type QueueItem = {
  key: string;
  file: File;
  preview: string;
  progress: number;
  status: "waiting" | "uploading" | "error";
  error?: string;
};

const CLIENT_MAX_EDGE = 2560;
const CONCURRENCY = 2;

/**
 * Smanjuje fotografiju u pregledniku prije slanja (brži upload s mobitela,
 * ispod ograničenja veličine zahtjeva). Server je svejedno ponovno provjerava i obrađuje.
 */
async function prepareImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    if (file.size <= MAX_UPLOAD_BYTES) return file; // server će provjeriti format
    throw new Error("Ovaj format fotografije preglednik ne može otvoriti. Pošaljite JPG ili PNG.");
  }
  const scale = Math.min(1, CLIENT_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Obrada fotografije nije uspjela.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const toBlob = (type: string, q: number) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));
  let blob = await toBlob("image/webp", 0.88);
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg", 0.88);
  if (!blob) throw new Error("Obrada fotografije nije uspjela.");
  if (blob.size > MAX_UPLOAD_BYTES) blob = (await toBlob("image/jpeg", 0.75)) ?? blob;
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error("Fotografija je prevelika ni nakon smanjivanja.");
  return blob;
}

function uploadWithProgress(url: string, blob: Blob, onProgress: (p: number) => void): Promise<{ ok: boolean; image?: VehicleImage; message?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      const body = (xhr.response ?? {}) as { ok?: boolean; image?: VehicleImage; message?: string };
      if (xhr.status >= 200 && xhr.status < 300 && body.ok) resolve({ ok: true, image: body.image });
      else resolve({ ok: false, message: body.message ?? (xhr.status === 413 ? "Fotografija je prevelika." : "Učitavanje nije uspjelo.") });
    };
    xhr.onerror = () => resolve({ ok: false, message: "Nema veze s poslužiteljem. Provjerite internet i pokušajte ponovno." });
    const fd = new FormData();
    fd.append("file", blob, "foto");
    xhr.send(fd);
  });
}

export function ImageManager({
  vehicleId,
  vehicleTitle,
  initialImages,
  isPublished,
}: {
  vehicleId: string;
  vehicleTitle: string;
  initialImages: VehicleImage[];
  isPublished: boolean;
}) {
  const [images, setImages] = useState<VehicleImage[]>(initialImages);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [savingOrder, startOrder] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const previews = useRef(new Set<string>());

  // Oslobodi lokalne preglede pri izlasku sa stranice
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const patchItem = (key: string, patch: Partial<QueueItem>) =>
    setQueue((q) => q.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  async function uploadOne(item: QueueItem) {
    patchItem(item.key, { status: "uploading", progress: 0, error: undefined });
    try {
      const blob = await prepareImage(item.file);
      const res = await uploadWithProgress(`/api/admin/vozila/${vehicleId}/slike`, blob, (p) => patchItem(item.key, { progress: p }));
      if (res.ok && res.image) {
        const image = res.image;
        setImages((imgs) => [...imgs, image].sort((a, b) => a.sort_order - b.sort_order));
        URL.revokeObjectURL(item.preview);
        previews.current.delete(item.preview);
        setQueue((q) => q.filter((i) => i.key !== item.key));
      } else {
        patchItem(item.key, { status: "error", error: res.message });
      }
    } catch (e) {
      patchItem(item.key, { status: "error", error: (e as Error).message });
    }
  }

  /** Najviše dva istodobna uploada — stabilnije na mobilnoj mreži. */
  async function runUploads(items: QueueItem[]) {
    const pending = [...items];
    const worker = async () => {
      for (let item = pending.shift(); item; item = pending.shift()) await uploadOne(item);
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker));
  }

  function addFiles(list: FileList | File[]) {
    setMessage(null);
    const files = Array.from(list).filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name));
    const room = MAX_IMAGES_PER_VEHICLE - images.length - queue.length;
    if (files.length === 0) {
      setMessage({ tone: "error", text: "Odaberite fotografije (JPG, PNG ili WebP)." });
      return;
    }
    if (room <= 0) {
      setMessage({ tone: "error", text: `Vozilo može imati najviše ${MAX_IMAGES_PER_VEHICLE} fotografija.` });
      return;
    }
    const accepted = files.slice(0, room);
    if (accepted.length < files.length) {
      setMessage({ tone: "error", text: `Dodano je ${accepted.length} fotografija — dosegnuto je ograničenje od ${MAX_IMAGES_PER_VEHICLE}.` });
    }
    const items: QueueItem[] = accepted.map((file) => {
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      return { key: `${file.name}-${file.size}-${crypto.randomUUID()}`, file, preview, progress: 0, status: "waiting" };
    });
    setQueue((q) => [...q, ...items]);
    void runUploads(items);
  }

  function persistOrder(next: VehicleImage[], previous: VehicleImage[]) {
    setImages(next.map((img, i) => ({ ...img, sort_order: i })));
    startOrder(async () => {
      const res = await reorderImages(vehicleId, next.map((i) => i.id));
      if (!res.ok) {
        setImages(previous);
        setMessage({ tone: "error", text: res.message });
      }
    });
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    persistOrder(next, images);
  }

  async function remove(id: string) {
    const previous = images;
    const res = await deleteImage(id);
    if (res.ok) {
      setImages((imgs) => imgs.filter((i) => i.id !== id).map((img, i) => ({ ...img, sort_order: i })));
      return res;
    }
    setImages(previous);
    return res;
  }

  const uploading = queue.some((q) => q.status !== "error");

  return (
    <section className="rounded-sm border border-line bg-surface p-4 sm:p-6" aria-labelledby="slike-naslov">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="slike-naslov" className="text-lg" style={{ fontStretch: "105%" }}>
            Fotografije <span className="tabular text-ink-muted">({images.length}/{MAX_IMAGES_PER_VEHICLE})</span>
          </h2>
          <p className="mt-1 max-w-xl text-sm text-ink-muted">
            Prva fotografija je naslovna. Najbolje izgledaju vodoravne fotografije snimljene pri dobrom svjetlu. Fotografije se automatski smanjuju i uklanjaju se podaci o lokaciji.
          </p>
        </div>
        {savingOrder && (
          <span className="flex items-center gap-1.5 text-sm text-ink-muted">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Spremam redoslijed…
          </span>
        )}
      </div>

      {message && <div className="mb-4"><Notice tone={message.tone}>{message.text}</Notice></div>}
      {isPublished && images.length === 1 && (
        <div className="mb-4"><Notice tone="info">Objavljeno vozilo mora imati barem jednu fotografiju, pa se zadnja ne može obrisati.</Notice></div>
      )}

      {/* Odabir: galerija/datoteke, kamera, povlačenje na desktopu */}
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (e.dataTransfer.files.length) {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }
        }}
        className={`flex flex-col items-center gap-3 rounded-sm border-2 border-dashed p-6 text-center transition-colors ${dragOver ? "border-red bg-[#fbecec] dark:bg-red/10" : "border-line bg-paper"}`}
      >
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => fileInput.current?.click()} className="btn btn-dark">
            <ImagePlus className="size-4" aria-hidden="true" />
            Odaberi fotografije
          </button>
          <button type="button" onClick={() => cameraInput.current?.click()} className="btn btn-outline">
            <Camera className="size-4" aria-hidden="true" />
            Snimi kamerom
          </button>
        </div>
        <p className="hint mt-0 hidden sm:block">ili ih povucite i ispustite ovdje</p>
        <p className="hint mt-0">JPG, PNG ili WebP. Možete odabrati više fotografija odjednom.</p>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Red čekanja / napredak */}
      {queue.length > 0 && (
        <ul className="mt-4 space-y-2" aria-live="polite">
          {queue.map((item) => (
            <li key={item.key} className="flex items-center gap-3 rounded-sm border border-line p-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- lokalni pregled prije uploada */}
              <img src={item.preview} alt="" className="size-12 shrink-0 rounded-sm object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.file.name}</p>
                {item.status === "error" ? (
                  <p className="error-text mt-0.5">{item.error}</p>
                ) : (
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Učitavanje ${item.file.name}`}>
                    <div className="h-full bg-red transition-[width]" style={{ width: `${item.status === "waiting" ? 0 : Math.max(item.progress, 4)}%` }} />
                  </div>
                )}
              </div>
              {item.status === "error" && (
                <>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => void runUploads([item])}>
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    Ponovi
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm px-2"
                    aria-label="Ukloni s popisa"
                    onClick={() => {
                      URL.revokeObjectURL(item.preview);
                      previews.current.delete(item.preview);
                      setQueue((q) => q.filter((i) => i.key !== item.key));
                    }}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {uploading && <p className="mt-2 text-sm text-ink-muted">Ne zatvarajte stranicu dok se fotografije ne učitaju.</p>}

      {/* Spremljene fotografije */}
      {images.length > 0 && (
        <ol className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, index) => (
            <li
              key={img.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => {
                if (dragIndex !== null) e.preventDefault();
              }}
              onDrop={(e) => {
                if (dragIndex !== null) {
                  e.preventDefault();
                  move(dragIndex, index);
                  setDragIndex(null);
                }
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`group overflow-hidden rounded-sm border bg-paper ${index === 0 ? "border-red" : "border-line"} ${dragIndex === index ? "opacity-50" : ""}`}
            >
              <div className="relative aspect-[4/3]">
                <Image src={vehicleImageUrl(img.storage_path)} alt={`${vehicleTitle} – fotografija ${index + 1}`} fill sizes="(min-width: 1024px) 220px, 50vw" className="object-cover" />
                <span className="tabular absolute left-1.5 top-1.5 rounded-sm bg-asphalt/80 px-1.5 py-0.5 text-xs font-semibold text-white">
                  {index === 0 ? "Naslovna" : index + 1}
                </span>
                <GripVertical className="absolute right-1.5 top-1.5 hidden size-5 cursor-grab rounded-sm bg-white/80 p-0.5 text-ink lg:block" aria-hidden="true" />
              </div>
              <div className="flex items-center justify-between gap-1 p-1.5">
                <div className="flex gap-1">
                  <button type="button" className="btn btn-sm min-h-9 px-2" onClick={() => move(index, index - 1)} disabled={index === 0 || savingOrder} aria-label={`Pomakni fotografiju ${index + 1} ulijevo`}>
                    <ArrowLeft className="size-4" aria-hidden="true" />
                  </button>
                  <button type="button" className="btn btn-sm min-h-9 px-2" onClick={() => move(index, index + 1)} disabled={index === images.length - 1 || savingOrder} aria-label={`Pomakni fotografiju ${index + 1} udesno`}>
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </button>
                  {index !== 0 && (
                    <button type="button" className="btn btn-sm min-h-9 px-2" onClick={() => move(index, 0)} disabled={savingOrder} aria-label={`Postavi fotografiju ${index + 1} kao naslovnu`} title="Postavi kao naslovnu">
                      <Star className="size-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <ConfirmButton
                  label="Obriši"
                  title="Obrisati fotografiju?"
                  description="Fotografija će biti trajno uklonjena s oglasa."
                  confirmLabel="Obriši"
                  onConfirm={() => remove(img.id)}
                  className="btn btn-sm min-h-9 px-2 text-red-deep"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  <span className="sr-only">Obriši fotografiju {index + 1}</span>
                </ConfirmButton>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
