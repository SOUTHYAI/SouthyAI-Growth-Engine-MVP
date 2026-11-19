// Entry point: wraps your existing worker.js and adds prospecting + outreach.
import worker from "./worker.js";
import { runProspecting } from "./prospector.js";
import { handleOutreachApi, handleInbound, sendApprovedLeads } from "./outreach.js";
import { OUTREACH_HTML } from "./outreach-page.js";

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

function isAdmin(request, env) {
  const configured = String(env.ADMIN_API_TOKEN || "");
  const supplied = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return configured.length >= 32 && sameText(supplied, configured);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // The approval + conversations page (the page itself holds no data; it asks for your token).
    if (request.method === "GET" && url.pathname === "/outreach") {
      return new Response(OUTREACH_HTML, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    }

    // Resend calls this when a prospect replies (signature-checked inside).
    if (request.method === "POST" && url.pathname === "/api/inbound/resend") {
      return handleInbound(request, env, ctx);
    }

    // Everything else under /api/outreach and /api/prospect needs your admin token.
    if (url.pathname.startsWith("/api/outreach/") || url.pathname === "/api/prospect") {
      if (!isAdmin(request, env)) return jsonRes({ error: "Unauthorised. Enter the valid admin access token." }, 401);
      if (url.pathname === "/api/prospect" && request.method === "POST") {
        try {
          const body = await request.json().catch(() => ({}));
          return jsonRes(await runProspecting(env, body));
        } catch (e) {
          return jsonRes({ error: e.message || "Prospecting failed." }, 500);
        }
      }
      return handleOutreachApi(request, env, url);
    }

    return worker.fetch(request, env, ctx);
  },

  // Runs automatically on the schedule in wrangler.toml.
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      try { await runProspecting(env); } catch (e) { console.log("Prospecting failed:", e.message); }
      try { await sendApprovedLeads(env); } catch (e) { console.log("Sending failed:", e.message); }
    })());
  }
};
