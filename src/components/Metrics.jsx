export default function Metrics() {
  const stats = [
    { k: "Accuracy", v: "—" },
    { k: "Precision", v: "—" },
    { k: "Recall", v: "—" },
    { k: "F1 Score", v: "—" },
  ];

  return (
    <div id="model" className="mx-auto max-w-5xl px-4 pb-14">
      <h3 className="text-center text-xl font-semibold">Model & Metrics</h3>
      <div className="mt-6 rounded-2xl border-white/10 bg-slate-950/40 p-6 shadow-sm">
        <div className="text-sm font-semibold">LSTM Classifier</div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.k} className="rounded-xl border-white/10 bg-slate-950/40 p-4 text-center">
              <div className="text-xs opacity-60">{s.k}</div>
              <div className="mt-1 text-lg font-semibold">{s.v}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 text-center">
          <button className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white opacity-50">
            View evaluation details →
          </button>
        </div>
      </div>
    </div>
  );
}