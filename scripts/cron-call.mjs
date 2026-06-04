// Calls a cron endpoint on the deployed app with the CRON_SECRET bearer token.
// Used by Railway Cron services (Vercel's cron config does NOT run on Railway).
//
//   APP_URL=https://your-app.railway.app CRON_SECRET=... \
//     node scripts/cron-call.mjs /api/cron/reset-scans
//
const path = process.argv[2];
const base = process.env.APP_URL;
const secret = process.env.CRON_SECRET;

if (!path) {
  console.error("Usage: node scripts/cron-call.mjs <path>");
  process.exit(1);
}
if (!base || !secret) {
  console.error("APP_URL and CRON_SECRET must be set.");
  process.exit(1);
}

const res = await fetch(`${base}${path}`, {
  headers: { Authorization: `Bearer ${secret}` },
});
const body = await res.text();
console.log(`${res.status} ${path}: ${body}`);
process.exit(res.ok ? 0 : 1);
