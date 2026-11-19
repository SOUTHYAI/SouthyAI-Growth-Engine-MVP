// SouthyAI Growth Engine: automatic prospector
// Finds businesses via a web search API, asks Cloudflare Workers AI to draft a
// short personal message for each, and saves them to the leads table as
// "Draft ready" so you can approve them. It never sends anything by itself.

const BOOKING_LINK = "https://calendly.com/southyai-support/30min";

const BLOCKED = [
  "linkedin.com", "facebook.com", "twitter.com", "x.com", "instagram.com",
  "youtube.com", "tiktok.com", "wikipedia.org", "glassdoor.com", "indeed.com",
  "crunchbase.com", "clutch.co", "g2.com", "capterra.com", "trustpilot.com",
  "reddit.com", "medium.com", "quora.com", "pinterest.com", "gov.za",
  "yellowpages.co.za", "gumtree.co.za", "bizcommunity.com", "businesstech.co.za",
  "upwork.com", "fiverr.com", "freelancer.com", "forbes.com", "inc.com", "techradar.com"
];

// What to search for. Edit these any time to change who it hunts.
export const SEARCHES = [
  "companies looking to outsource customer support offshore remote team",
  "offshore customer service outsourcing for US companies",
  "hire dedicated remote customer support team UK business",
  "Australian business outsourcing customer support offshore",
  "ecommerce brand outsourcing customer service to remote agents",
  "SaaS company outsourcing technical support offshore team",
  "startup needs 24/7 remote customer support team",
  "BPO and offshore staffing partnership for international companies",
  "voice AI company needs African language speech data collection",
  "remote customer experience team outsourcing partner"
];

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
}

function isBlocked(host) {
  return !host || BLOCKED.some(b => host === b || host.endsWith("." + b));
}

async function searchWeb(env, query) {
  const r = await fetch(
    "https://api.search.brave.com/res/v1/web/search?count=10&q=" + encodeURIComponent(query),
    {
      headers: { "Accept": "application/json", "X-Subscription-Token": env.SEARCH_API_KEY },
      signal: AbortSignal.timeout(15000)
    }
  );
  if (!r.ok) throw new Error("Search service returned HTTP " + r.status + ". Check SEARCH_API_KEY.");
  const data = await r.json();
  return (data.web && data.web.results) || [];
}

async function draftMessage(env, company, description) {
  const system =
    "You write short, warm, honest B2B outreach messages for SouthyAI Technologies, " +
    "a South African company that provides fully remote, cloud-based customer service " +
    "and technical support teams to international businesses, plus South African " +
    "speech-data collection and transcription. " +
    "Rules: max 90 words. Use ONLY the facts you are given about the prospect; never invent " +
    "details, numbers or compliments you cannot see. No hype, no fake urgency. " +
    "End by inviting a short call and include this booking link: " + BOOKING_LINK + ". " +
    "Sign off as SouthyAI Technologies. Output only the message.";
  const user =
    "Prospect company: " + company + "\n" +
    "What their website says: " + (description || "(no description available)") + "\n" +
    "Write the message.";
  const out = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
    max_tokens: 300
  });
  return String((out && out.response) || "").trim();
}

export async function runProspecting(env, options = {}) {
  if (!env.DB) throw new Error("D1 database is not connected (binding DB).");
  if (!env.AI) throw new Error("Workers AI is not connected (binding AI).");
  if (!env.SEARCH_API_KEY) throw new Error("Add SEARCH_API_KEY as a Cloudflare Worker secret first.");

  const maxNew = Math.min(Number(options.max) || 8, 15);
  const day = new Date().getUTCDate();
  const queries = options.queries && options.queries.length
    ? options.queries.slice(0, 3)
    : [SEARCHES[day % SEARCHES.length], SEARCHES[(day + 1) % SEARCHES.length]];

  const summary = { queries, added: [], skipped: 0, errors: [] };

  for (const q of queries) {
    let results = [];
    try { results = await searchWeb(env, q); }
    catch (e) { summary.errors.push(q + ": " + e.message); continue; }

    for (const item of results) {
      if (summary.added.length >= maxNew) break;
      const host = hostOf(item.url);
      if (isBlocked(host)) { summary.skipped++; continue; }
      const website = "https://" + host;

      const existing = await env.DB.prepare("SELECT id FROM leads WHERE website = ? OR website = ?")
        .bind(website, website + "/").first();
      if (existing) { summary.skipped++; continue; }

      const company = String(item.title || host).split(/[|\-–—:]/)[0].trim().slice(0, 120) || host;
      const description = String(item.description || "").replace(/<[^>]+>/g, "").slice(0, 400);

      try {
        const draft = await draftMessage(env, company, description);
        if (!draft) { summary.skipped++; continue; }
        await env.DB.prepare(
          "INSERT INTO leads (company, website, contact_name, contact_email, source_url, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          company, website, "", "", String(item.url).slice(0, 500),
          ("DRAFT (needs your approval before sending)\n" + draft).slice(0, 1990),
          "Draft ready"
        ).run();
        summary.added.push(company);
      } catch (e) { summary.errors.push(company + ": " + e.message); }
    }
    if (summary.added.length >= maxNew) break;
  }
  return summary;
}
