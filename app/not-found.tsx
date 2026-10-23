import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-start justify-center bg-asphalt px-6 text-white sm:px-16">
      <span aria-hidden="true" className="mb-6 block h-1 w-14 -skew-x-[28deg] bg-red" />
      <h1 className="text-4xl">Stranica nije pronađena</h1>
      <p className="mt-4 max-w-md text-fog">Poveznica je možda zastarjela ili je oglas uklonjen.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">Početna</Link>
        <Link href="/vozila" className="btn btn-outline-dark">Ponuda vozila</Link>
      </div>
    </main>
  );
}
