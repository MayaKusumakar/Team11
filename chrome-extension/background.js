// ─── FakeReview Detector – Background Service Worker ───────────────────────
//
// Responsibilities:
//   1. Create a repeating alarm every 10 minutes to keep the API warm.
//   2. On each alarm, ping GET /health so free-tier hosts (Render, Railway)
//      don't spin down between user visits.

const DEFAULT_API_URL = "https://fakereview-api-d72r.onrender.com";
const ALARM_NAME      = "fr-health-ping";
const PING_INTERVAL   = 10; // minutes

// Create alarm once after install / update
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: PING_INTERVAL });
  console.log("[FakeReview] Health-ping alarm created.");
});

// Fire on every alarm tick
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  const { apiUrl } = await chrome.storage.sync.get({ apiUrl: DEFAULT_API_URL });

  try {
    const res = await fetch(`${apiUrl}/health`);
    console.log(`[FakeReview] Health ping → ${res.status}`);
  } catch (err) {
    console.warn("[FakeReview] Health ping failed:", err.message);
  }
});
