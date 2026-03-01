function normalizePredictResponse(raw) {
  // { label: "fake"|"real"|"uncertain", confidence: 0..1, reasons: [], signals: [] }

  const first =
    Array.isArray(raw) ? raw[0]
    : Array.isArray(raw?.predictions) ? raw.predictions[0]
    : Array.isArray(raw?.results) ? raw.results[0]
    : raw?.result ? raw.result
    : raw;

  let label =
    first?.label ??
    first?.prediction ??
    first?.class ??
    first?.result ??
    (first?.is_fake === true ? "Fake" : first?.is_fake === false ? "Real" : undefined);

  if (label === 1) label = "Fake";
  if (label === 0) label = "Real";

  let confidence =
    first?.confidence ??
    first?.probability ??
    first?.score ??
    first?.pred_prob ??
    first?.fake_probability ??
    first?.real_probability;

  const reasons = first?.reasons ?? first?.explanations ?? first?.why ?? [];
  const signalsRaw = first?.signals ?? first?.features ?? first?.signal_chips ?? [];

  
  let c = typeof confidence === "number" ? confidence : Number(confidence);
  if (!Number.isFinite(c)) c = 0;
  if (c > 1 && c <= 100) c = c / 100;

  
  const lbl = String(label ?? "Uncertain").toLowerCase();
  let normalizedLabel = "uncertain";
  if (lbl.includes("fake")) normalizedLabel = "fake";
  else if (lbl.includes("real")) normalizedLabel = "real";
  else if (lbl.includes("uncertain")) normalizedLabel = "uncertain";

  const signals = Array.isArray(signalsRaw)
    ? signalsRaw.map((s) => {
        if (typeof s === "string") return { name: s, direction: "none" };
        return {
          name: s?.name ?? s?.feature ?? s?.key ?? "Signal",
          direction: s?.direction ?? s?.dir ?? "none",
        };
      })
    : [];

  return {
    label: normalizedLabel,
    confidence: c,
    reasons: Array.isArray(reasons) ? reasons.map(String) : [],
    signals,
  };
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${txt ? ` — ${txt}` : ""}`);
  }
  return res.json();
}

export async function predictReview({ text, rating = 5, domain, explain } = {}) {
  const API_URL = import.meta.env.VITE_API_URL;

  // If API URL isn't set, mock data
  if (!API_URL) {
    await new Promise((r) => setTimeout(r, 450));
    return normalizePredictResponse({
      label: "Fake",
      confidence: 0.82,
      reasons: [
        "Repetitive language detected",
        "Overly generic phrasing",
        "Unusual n-gram patterns",
      ],
      signals: [
        { name: "Lexical Diversity", direction: "down" },
        { name: "Spammy Phrases", direction: "up" },
      ],
    });
  }

  const endpoints = [
    `${API_URL}/predict`,
    `${API_URL}/api/predict`,
    `${API_URL}/v1/predict`,
    `${API_URL}/predict-review`,
    `${API_URL}/reviews/predict`,
  ];

  const payloads = [
    { text, rating },                                  
    { review: { text, rating } },                      
    { reviews: [{ text, rating }] },                   
    { inputs: [{ text, rating }] },                    
    { text, rating, domain, explain },
    { review: { text, rating, domain, explain } },
    { reviews: [{ text, rating, domain, explain }] },
  ];

  let lastErr = null;

  for (const url of endpoints) {
    for (const body of payloads) {
      try {
        const raw = await postJson(url, body);
        return normalizePredictResponse(raw);
      } catch (e) {
        lastErr = e; 
      }
    }
  }

  throw new Error(
    lastErr?.message ??
      "Could not reach prediction API. Check VITE_API_URL and backend route."
  );
}