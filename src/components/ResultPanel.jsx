function Shimmer({ className = "" }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-black/10 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
  );
}

function Badge({ label, confidence }) {
  const isFake = label?.toLowerCase() === "fake";
  return (
    <div
      className={`rounded-xl p-4 text-white shadow-sm ${
        isFake ? "bg-red-400" : "bg-emerald-500"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="text-2xl font-bold">{label?.toUpperCase()}</div>
        <div className="text-xl">{isFake ? "⚠️" : "✅"}</div>
      </div>
      <div className="mt-1 text-sm opacity-90">
        {Math.round((confidence ?? 0) * 100)}% Confident
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-white/30">
        <div
          className="h-2 rounded-full bg-white/70"
          style={{ width: `${Math.round((confidence ?? 0) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function SignalChip({ name, direction }) {
  const arrow = direction === "up" ? "↑" : direction === "down" ? "↓" : "•";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs">
      <span className="opacity-80">{name}</span>
      <span className="font-semibold">{arrow}</span>
    </span>
  );
}

export default function ResultPanel({ result, loading, error }) {
  if (loading) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <Shimmer className="h-6 w-44" />
      <div className="mt-4 space-y-3">
        <Shimmer className="h-20 w-full" />
        <Shimmer className="h-10 w-full" />
        <div className="flex flex-wrap gap-2">
          <Shimmer className="h-7 w-28" />
          <Shimmer className="h-7 w-32" />
          <Shimmer className="h-7 w-24" />
        </div>
      </div>
    </div>
  );
}

  if (error) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="font-semibold text-red-600">Something went wrong</div>
        <div className="mt-2 text-sm opacity-70">{error}</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-sm opacity-70">
          Your result will appear here after you analyze a review.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <Badge label={result.label} confidence={result.confidence} />

      <div className="mt-4">
        <div className="font-semibold">Why we think so:</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm opacity-80">
          {(result.reasons ?? []).slice(0, 5).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(result.signals ?? []).slice(0, 6).map((s, i) => (
          <SignalChip key={i} name={s.name} direction={s.direction} />
        ))}
      </div>
    </div>
  );
}