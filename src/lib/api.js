function normalizePredictResponse(raw) {
  // Accept a few common variants safely.
  // Output we want: { label, confidence, reasons: [], signals: [] }

  const label =
    raw?.label ??
    raw?.prediction ??
    raw?.result ??
    (raw?.is_fake === true ? "fake" : raw?.is_fake === false ? "real" : undefined);

  const confidence =
    raw?.confidence ??
    raw?.probability ??
    raw?.score ??
    raw?.pred_prob ??
    raw?.fake_probability ??
    raw?.real_probability;

  // Reasons/explanations
  const reasons =
    raw?.reasons ??
    raw?.explanations ??
    raw?.why ??
    raw?.highlights ??
    [];

  // Signals (allow strings or objects)
  const signalsRaw = raw?.signals ?? raw?.features ?? raw?.signal_chips ?? [];
  const signals = Array.isArray(signalsRaw)
    ? signalsRaw.map((s) => {
        if (typeof s === "string") return { name: s, direction: "none" };
        return {
          name: s?.name ?? s?.feature ?? s?.key ?? "Signal",
          direction: s?.direction ?? s?.dir ?? "none",
        };
      })
    : [];

  // Coerce confidence into 0..1 if it looks like percent
  let c = typeof confidence === "number" ? confidence : Number(confidence);
  if (!Number.isFinite(c)) c = 0;
  if (c > 1 && c <= 100) c = c / 100;

  return {
    label: String(label ?? "unknown"),
    confidence: c,
    reasons: Array.isArray(reasons) ? reasons.map(String) : [],
    signals,
  };
}

export async function predictReview({ text, domain = "amazon", explain = true }) {
  const API_URL = import.meta.env.VITE_API_URL;

  // Mock response for UI dev
  if (!API_URL) {
    await new Promise((r) => setTimeout(r, 600));
    return normalizePredictResponse({
      label: "fake",
      confidence: 0.82,
      reasons: [
        "Repetitive language detected",
        "Overly generic phrases",
        "Unusual n-gram patterns",
        "Sentiment extremeness is high",
      ],
      signals: [
        { name: "Lexical Diversity", direction: "down" },
        { name: "Spammy Phrases", direction: "up" },
        { name: "Excessive Intensifiers", direction: "up" },
      ],
    });
  }

  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, domain, explain }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "Request failed");
    throw new Error(msg);
  }

  const raw = await res.json();
  return normalizePredictResponse(raw);
}