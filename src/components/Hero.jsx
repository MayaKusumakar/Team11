export default function Hero() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-12">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Spot <span className="underline decoration-blue-300 decoration-4">fake reviews</span> in seconds.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base opacity-70">
          Paste a review and we’ll predict whether it’s real or fake — with a confidence score.
        </p>
        <a
          href="#analyze"
          className="mx-auto mt-7 inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          Try it now
        </a>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {[
            "TF-IDF + Char N-grams",
            "Sentiment & Linguistics",
            "Fast & Explainable",
          ].map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/10 bg-slate-950/40 px-4 py-2 text-xs shadow-sm"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}