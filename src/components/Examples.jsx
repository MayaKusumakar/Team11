export default function Examples({ onPickExample, disabled }) {
  const ex = [
    "Loved this gadget, works perfectly! A+",
    "This product is amazing, must buy!!! Best purchase of my life!!!",
    "Arrived broken, worst purchase ever. Customer service never responded.",
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-14">
      <h3 className="text-center text-xl font-semibold">Try some examples</h3>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {ex.map((t, i) => (
          <div key={i} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm opacity-80">{t}</div>
            <div className="mt-4">
              <button
                disabled={disabled}
                onClick={() => onPickExample?.(t)}
                className="rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                    >
                Try this example
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}