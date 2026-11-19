// Entry point: wraps your existing worker.js and adds the auto-prospector.
import worker from "./worker.js";
import { runProspecting } from "./prospector.js";

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

function sameText(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Run the prospector now (for testing). Uses the same admin token lock.
    if (request.method === "POST" && url.pathname === "/api/prospect") {
      const configured = String(env.ADMIN_API_TOKEN || "");
      const supplied = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      if (configured.length < 32 || !sameText(supplied, configured)) {
        return jsonRes({ error: "Unauthorised. Enter the valid admin access token." }, 401);
      }
      try {
        const body = await request.json().catch(() => ({}));
        return jsonRes(await runProspecting(env, body));
      } catch (e) {
        return jsonRes({ error: e.message || "Prospecting failed." }, 500);
      }
    }
    return worker.fetch(request, env, ctx);
  },

  // Runs automatically on the schedule in wrangler.toml.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      runProspecting(env).catch(e => console.log("Prospecting failed:", e.message))
    );
  }
};
