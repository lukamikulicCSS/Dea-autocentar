export default function AdminLoading() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Učitavanje…</span>
      <div className="skeleton h-9 w-56 rounded-sm" />
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton h-24 rounded-sm" />)}
      </div>
    </div>
  );
}
