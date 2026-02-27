// ─── FakeReview Detector – Content Script ──────────────────────────────────
//
// Runs on:  amazon.com/*/product-reviews/*
//           amazon.com/dp/*
//
// Flow:
//   1. Scrape all [data-hook="review"] elements from the loaded DOM.
//   2. Show a loading badge on each review immediately.
//   3. Check chrome.storage.local for cached results (keyed by Amazon review ID).
//   4. Send only uncached reviews to POST /predict/batch.
//   5. Render Fake / Real / Uncertain badges with confidence scores.
//   6. Inject a product-level summary banner above the review list.

"use strict";

const DEFAULT_API_URL = "https://fakereview-api-d72r.onrender.com";

// ─── Helpers: storage ───────────────────────────────────────────────────────

async function getSettings() {
  const { apiUrl, modelId } = await chrome.storage.sync.get({
    apiUrl:  DEFAULT_API_URL,
    modelId: "lstm",
  });
  return { apiUrl: apiUrl.replace(/\/$/, ""), modelId };
}

async function readCache(keys) {
  return new Promise((resolve) =>
    chrome.storage.local.get(keys, resolve)
  );
}

async function writeCache(entries) {
  return new Promise((resolve) =>
    chrome.storage.local.set(entries, resolve)
  );
}

// ─── Helpers: DOM scraping ──────────────────────────────────────────────────

/**
 * Parse the star rating out of Amazon's "X.X out of 5 stars" text.
 * Falls back to parsing the CSS class name (a-star-4, a-star-small-5, …).
 */
function extractRating(reviewEl) {
  const ratingEl = reviewEl.querySelector(
    '[data-hook="review-star-rating"] .a-icon-alt, ' +
    '[data-hook="cmps-review-star-rating"] .a-icon-alt, ' +
    '[data-hook="review-star-rating"], ' +
    '[data-hook="cmps-review-star-rating"]'
  );

  if (ratingEl) {
    const text = ratingEl.textContent || ratingEl.innerText || "";
    const m = text.match(/(\d+\.?\d*)\s+out\s+of/i);
    if (m) return parseFloat(m[1]);
  }

  // CSS-class fallback: a-star-5, a-star-small-4, …
  const starEl = reviewEl.querySelector('[class*="a-star-"]');
  if (starEl) {
    const m = starEl.className.match(/a-star(?:-small)?-(\d)/);
    if (m) return parseInt(m[1], 10);
  }

  return null;
}

/**
 * Extract clean review body text, stripping "Read more" noise.
 */
function extractText(reviewEl) {
  const bodyEl = reviewEl.querySelector('[data-hook="review-body"]');
  if (!bodyEl) return null;

  const clone = bodyEl.cloneNode(true);

  // Remove "See more" / "Read more" controls
  clone
    .querySelectorAll(
      '[data-hook="review-see-all-reviews-link"], ' +
      '.cr-see-all-reviews-text, ' +
      '.a-expander-prompt'
    )
    .forEach((n) => n.remove());

  const text = (clone.innerText || clone.textContent || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 1000); // model uses max 100 tokens (~500 chars), no value sending more

  return text.length >= 10 ? text : null;
}

/**
 * Collect all reviews that are currently rendered in the DOM.
 */
function scrapeReviews() {
  const elements = document.querySelectorAll('[data-hook="review"]');
  const reviews  = [];

  elements.forEach((el) => {
    const reviewId = el.id;
    if (!reviewId) return; // no ID → can't cache or track

    const text   = extractText(el);
    const rating = extractRating(el);

    if (!text || rating === null) return;

    reviews.push({ reviewId, text, rating, element: el });
  });

  return reviews;
}

// ─── Helpers: badge UI ──────────────────────────────────────────────────────

const BADGE_BASE = `
  display:inline-block;
  padding:2px 9px;
  border-radius:3px;
  font-size:11px;
  font-weight:700;
  font-family:Arial,sans-serif;
  letter-spacing:0.3px;
  margin:5px 0 2px 0;
  line-height:1.6;
  cursor:default;
`;

const BADGE_THEME = {
  loading:   "background:#e9ecef;color:#6c757d;",
  fake:      "background:#dc3545;color:#fff;",
  real:      "background:#198754;color:#fff;",
  uncertain: "background:#ffc107;color:#212529;",
  error:     "background:#6c757d;color:#fff;",
};

function makeBadge(type, confidence) {
  const el = document.createElement("span");
  el.setAttribute("data-fr-badge", type);
  el.style.cssText = BADGE_BASE + (BADGE_THEME[type] || BADGE_THEME.loading);

  switch (type) {
    case "loading":
      el.textContent = "⏳ Analyzing…";
      break;
    case "fake":
      el.textContent = `🔴 Fake · ${Math.round(confidence * 100)}%`;
      el.title = `Model is ${Math.round(confidence * 100)}% confident this review is fake.`;
      break;
    case "real":
      el.textContent = `🟢 Real · ${Math.round((1 - confidence) * 100)}%`;
      el.title = `Model is ${Math.round((1 - confidence) * 100)}% confident this review is genuine.`;
      break;
    case "uncertain":
      el.textContent = "🟡 Uncertain";
      el.title = "Model confidence is too low to classify this review definitively.";
      break;
    case "error":
      el.textContent = "⚠ API Error";
      el.title = "Could not reach the FakeReview API. Check your API URL in the extension popup.";
      break;
  }

  return el;
}

/**
 * Inject (or replace) a badge into a review element.
 * Anchors to review-title > review-date > review-star-rating, in that priority.
 */
function injectBadge(reviewEl, badge) {
  const old = reviewEl.querySelector("[data-fr-badge]");
  if (old) old.remove();

  const anchor =
    reviewEl.querySelector('[data-hook="review-title"]') ||
    reviewEl.querySelector('[data-hook="review-date"]')  ||
    reviewEl.querySelector('[data-hook="review-star-rating"]');

  if (anchor) {
    anchor.insertAdjacentElement("afterend", badge);
  } else {
    reviewEl.prepend(badge);
  }
}

// ─── Helpers: summary banner ─────────────────────────────────────────────────

function injectSummary(total, fakeCount, uncertainCount) {
  const old = document.getElementById("fr-summary-banner");
  if (old) old.remove();

  const realCount    = total - fakeCount - uncertainCount;
  const fakePercent  = total > 0 ? Math.round((fakeCount / total) * 100) : 0;
  const highRisk     = fakePercent >= 30;

  const banner = document.createElement("div");
  banner.id = "fr-summary-banner";
  banner.style.cssText = `
    background:#f8f9fa;
    border:1px solid #dee2e6;
    border-left:4px solid ${highRisk ? "#dc3545" : "#198754"};
    border-radius:4px;
    padding:10px 14px;
    margin:12px 0;
    font-family:Arial,sans-serif;
    font-size:13px;
    line-height:1.8;
  `;

  banner.innerHTML =
    `<strong style="font-size:14px">🔍 FakeReview Detector</strong> — ` +
    `Analyzed <strong>${total}</strong> review${total !== 1 ? "s" : ""} on this page<br>` +
    `<span style="color:#198754">●</span> <strong>${realCount}</strong> Real &nbsp;` +
    `<span style="color:#dc3545">●</span> <strong>${fakeCount}</strong> Fake (${fakePercent}%) &nbsp;` +
    `<span style="color:#e6a800">●</span> <strong>${uncertainCount}</strong> Uncertain` +
    (highRisk
      ? `<br><strong style="color:#dc3545">⚠ High proportion of suspicious reviews — consider looking elsewhere.</strong>`
      : "");

  // Find the best injection point above the review list
  const anchor =
    document.querySelector('[data-hook="reviews-medley-footer"]') ||
    document.querySelector("#cm_cr-review_list")                  ||
    document.querySelector('[data-hook="review"]');

  if (anchor) {
    anchor.insertAdjacentElement("beforebegin", banner);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function run() {
  const reviews = scrapeReviews();
  if (reviews.length === 0) return;

  const { apiUrl, modelId } = await getSettings();

  // Show loading badges immediately so the user sees activity
  reviews.forEach(({ element }) => injectBadge(element, makeBadge("loading", 0)));

  // ── Cache lookup ──
  const ids    = reviews.map((r) => r.reviewId);
  const cached = await readCache(ids);

  // Apply cached results without waiting for the API
  reviews
    .filter((r) => cached[r.reviewId])
    .forEach(({ reviewId, element }) => {
      const { label, confidence } = cached[reviewId];
      injectBadge(element, makeBadge(label.toLowerCase(), confidence));
    });

  // ── API fetch for uncached reviews ──
  const toFetch = reviews.filter((r) => !cached[r.reviewId]);
  const resultMap = { ...cached };

  if (toFetch.length > 0) {
    try {
      const response = await fetch(`${apiUrl}/predict/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviews:  toFetch.map((r) => ({ text: r.text, rating: r.rating })),
          model_id: modelId,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        console.error("[FakeReview Detector] 422 detail:", detail);
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const results = await response.json();
      const toCache = {};

      toFetch.forEach(({ reviewId, element }, i) => {
        const res = results[i];
        injectBadge(element, makeBadge(res.label.toLowerCase(), res.confidence));
        resultMap[reviewId] = res;
        toCache[reviewId]   = res;
      });

      await writeCache(toCache);

    } catch (err) {
      console.error("[FakeReview Detector] API error:", err.message);
      toFetch.forEach(({ element }) => injectBadge(element, makeBadge("error", 0)));
    }
  }

  // ── Summary banner ──
  const labels       = reviews.map((r) => resultMap[r.reviewId]?.label).filter(Boolean);
  const fakeCount    = labels.filter((l) => l === "Fake").length;
  const uncertainCnt = labels.filter((l) => l === "Uncertain").length;

  if (labels.length > 0) {
    injectSummary(labels.length, fakeCount, uncertainCnt);
  }
}

// Amazon's review pages sometimes finish rendering after document_idle fires
// (especially on /dp/* pages where reviews lazy-load). We run once immediately
// and once more after a short delay to catch late-rendered reviews.
run();
setTimeout(run, 3000);

// ─── URL change detection ────────────────────────────────────────────────────
// Amazon sometimes navigates between review pages without a full reload
// (pagination, sort/filter changes). Poll for URL changes and re-run.

let _lastUrl = location.href;

setInterval(() => {
  if (location.href !== _lastUrl) {
    _lastUrl = location.href;
    setTimeout(run, 1500); // wait 1.5s for Amazon to finish rendering the new reviews
  }
}, 1000);

// Also catch history.pushState navigation
window.addEventListener("popstate", () => setTimeout(run, 1500));

// ─── Message listener (triggered by popup "Scan Page" button) ────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "scan") run();
});
