import Link from "next/link";

export default function VehicleNotFound() {
  return (
    <div className="wrap py-24">
      <span aria-hidden="true" className="mb-4 block h-[3px] w-10 -skew-x-[28deg] bg-red" />
      <h1 className="text-3xl">Oglas više nije dostupan</h1>
      <p className="mt-4 max-w-xl text-ink-muted">
        Vozilo je možda prodano ili uklonjeno iz ponude. Pogledajte aktualnu ponudu ili nam javite što tražite.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/vozila" className="btn btn-dark">Aktualna ponuda</Link>
        <Link href="/kontakt" className="btn btn-outline">Kontakt</Link>
      </div>
    </div>
  );
}
