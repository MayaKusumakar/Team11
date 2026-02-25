export default function HowItWorks() {
  const cards = [
    { title: "Preprocess", desc: "Clean text, tokenize, normalize", icon: "🪄" },
    { title: "Extract Features", desc: "TF-IDF, character n-grams, sentiment", icon: "🔎" },
    { title: "Predict", desc: "Model outputs label + confidence", icon: "🎯" },
  ];

  return (
    <div id="how" className="mx-auto max-w-5xl px-4 py-14">
      <h2 className="text-center text-2xl font-semibold">How it works</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 shadow-sm">
            <div className="text-2xl">{c.icon}</div>
            <div className="mt-2 font-semibold">{c.title}</div>
            <div className="mt-1 text-sm opacity-70">{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}