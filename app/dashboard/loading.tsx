export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="skeleton h-9 w-56 rounded-xl" />
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );
}
