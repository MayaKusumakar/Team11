import { useRef, useState } from "react";
import { predictReview } from "../lib/api";
import ResultPanel from "./ResultPanel";
import Examples from "./Examples";
import { useToast } from "./ToastProvider";

const TABS = ["Paste Review", "Upload CSV", "API"];

export default function AnalyzerCard() {
  const { toast } = useToast();
  const [tab, setTab] = useState(TABS[0]);
  const [text, setText] = useState("");
  const [domain, setDomain] = useState("amazon");
  const [explain, setExplain] = useState(true);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const textareaRef = useRef(null);

  async function onAnalyze() {
    setErr("");
    setLoading(true);
    setResult(null);

    try {
      const data = await predictReview({ text, domain, explain });
      setResult(data);
      toast({ type: "success", title: "Analysis complete", message: `Predicted: ${String(data.label).toUpperCase()}` });
    } catch (e) {
      const msg = e?.message ?? "Request failed";
      setErr(msg);
      toast({ type: "error", title: "Analysis failed", message: msg, durationMs: 4500 });
    } finally {
      setLoading(false);
    }
  }

  function disabledTab(t) {
    return t !== "Paste Review";
  }

  function onPickExample(exampleText) {
  setTab("Paste Review");
  setText(exampleText);
  setErr("");
  setResult(null);

  toast({ type: "info", title: "Example loaded", message: "Ready to analyze ✨" });

  // focus + scroll to analyzer textarea
  textareaRef.current?.focus();
  textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  // auto-analyze after state updates apply
  setTimeout(() => {
    // if user clicked example, text is non-empty so analyze is safe
    onAnalyze();
  }, 0);
}

  return (
    <div id="analyze" className="mx-auto mt-10 max-w-5xl px-4">
      <div className="rounded-3xl border bg-white shadow-sm">
        {/* Tabs */}
        <div className="flex gap-2 border-b px-3 pt-3">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => !disabledTab(t) && setTab(t)}
              className={[
                "rounded-t-xl px-4 py-2 text-sm",
                tab === t ? "bg-violet-50 font-semibold" : "opacity-70",
                disabledTab(t) ? "cursor-not-allowed opacity-30" : "hover:opacity-100",
              ].join(" ")}
              title={disabledTab(t) ? "Coming soon" : ""}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid gap-6 p-5 md:grid-cols-2">
          {/* Input */}
          <div>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste a product review here..."
              className="h-56 w-full resize-none rounded-2xl border p-4 text-sm outline-none focus:ring-2 focus:ring-violet-200"
            />

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="text-sm opacity-70">Domain:</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="rounded-xl border bg-white px-3 py-2 text-sm"
              >
                <option value="amazon">Amazon</option>
                <option value="yelp">Yelp</option>
                <option value="general">General</option>
              </select>

              <label className="ml-auto inline-flex items-center gap-2 text-sm opacity-70">
                <span>Explain results</span>
                <input
                  type="checkbox"
                  checked={explain}
                  onChange={(e) => setExplain(e.target.checked)}
                  className="h-4 w-4 accent-violet-600"
                />
              </label>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={onAnalyze}
                disabled={!text.trim() || loading}
                className="rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-40 hover:bg-violet-700"
              >
                {loading ? "Analyzing..." : "Analyze"}
              </button>
              <button
                onClick={() => {
                  setText("");
                  setResult(null);
                  setErr("");
                  toast({ type: "info", message: "Cleared." });
                }}
                className="rounded-full border bg-white px-6 py-3 text-sm font-semibold shadow-sm"
              >
                Clear
              </button>
            </div>

            <div className="mt-3 text-xs opacity-50">
              Tip: Example buttons below will fill the textbox.
            </div>
          </div>

          { }
          <ResultPanel result={result} loading={loading} error={err} />
        </div>
      </div>

      {}
      <div className="mt-10">
        <Examples onPickExample={onPickExample} disabled={loading} />
      </div>
    </div>
  );
}