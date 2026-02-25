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
      toast({
        type: "success",
        title: "Analysis complete",
        message: `Predicted: ${String(data.label).toUpperCase()}`,
      });
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

    toast({ type: "info", title: "Example loaded", message: "Auto-analyzing…" });

    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => onAnalyze(), 0);
  }

  return (
    <div id="analyze" className="mx-auto mt-10 max-w-5xl px-4">
      <div className="rounded-3xl border border-white/10 bg-slate-950/40 shadow-sm backdrop-blur">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 px-3 pt-3">
          {TABS.map((t) => {
            const isActive = tab === t;
            const isDisabled = disabledTab(t);

            return (
              <button
                key={t}
                onClick={() => !isDisabled && setTab(t)}
                className={[
                  "rounded-t-xl px-4 py-2 text-sm",
                  "text-slate-300 hover:text-white",
                  isActive ? "bg-blue-500/10 text-white font-semibold" : "opacity-80",
                  isDisabled ? "cursor-not-allowed opacity-30" : "hover:opacity-100",
                ].join(" ")}
                title={isDisabled ? "Coming soon" : ""}
              >
                {t}
              </button>
            );
          })}
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
              className="h-56 w-full resize-none rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-300/30"
            />

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="text-sm text-slate-300">Domain:</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-blue-300/30"
              >
                <option value="amazon">Amazon</option>
                <option value="yelp">Yelp</option>
                <option value="general">General</option>
              </select>

              <label className="ml-auto inline-flex items-center gap-2 text-sm text-slate-300">
                <span>Explain results</span>
                <input
                  type="checkbox"
                  checked={explain}
                  onChange={(e) => setExplain(e.target.checked)}
                  className="h-4 w-4 accent-blue-500"
                />
              </label>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={onAnalyze}
                disabled={!text.trim() || loading}
                className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-40"
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
                className="rounded-full border border-white/10 bg-slate-900/40 px-6 py-3 text-sm font-semibold text-slate-100 shadow-sm hover:bg-slate-900/60"
              >
                Clear
              </button>
            </div>

            <div className="mt-3 text-xs text-slate-400">
              Tip: Example buttons below will fill the textbox.
            </div>
          </div>

          {/* Output */}
          <ResultPanel result={result} loading={loading} error={err} />
        </div>
      </div>

      <div className="mt-10">
        <Examples onPickExample={onPickExample} disabled={loading} />
      </div>
    </div>
  );
}