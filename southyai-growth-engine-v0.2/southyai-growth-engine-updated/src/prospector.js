// SouthyAI Growth Engine: automatic prospector
// Finds businesses via a web search API, asks Cloudflare Workers AI to write the
// personal part of an outreach email for each, wraps it in SouthyAI's standard
// introduction, services and trust details, and saves it to the leads table as
// "Draft ready" so you can approve it. It never sends anything by itself.

const BOOKING_LINK = "https://calendly.com/southyai-support/30min";
const LINKEDIN = "https://www.linkedin.com/in/southyai-technologies-7650b0437";
const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const BACKUP_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

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

// The AI only writes the personal part (2-3 sentences) about the prospect.
// Everything else in the email is fixed text, so it is always accurate and consistent.
async function writeHook(env, company, description) {
  const system =
    "You write the personal part of a B2B outreach email for SouthyAI Technologies, a South African company " +
    "that offers fully remote customer service and technical support teams, South African speech data and voice AI, and custom software. " +
    "Write 2 or 3 sentences only. " +
    "Sentence 1: show you understand what the prospect company does, using ONLY the facts you are given about them. " +
    "Sentences 2 and 3: mention a challenge that businesses like theirs commonly face (for example keeping customer support fast and affordable as they grow, " +
    "or finding quality language data) and say SouthyAI could help. " +
    "Never invent facts, numbers, names, awards or compliments about the prospect, and never claim to know their current problems. " +
    "No greeting, no sign-off, no links, no bullet points. Plain text, warm and natural. Output only the 2 or 3 sentences.";
  const user =
    "Prospect company: " + company + "\n" +
    "What their website says: " + (description || "(no description available)") + "\n" +
    "Write the 2 or 3 sentences.";
  const input = {
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
    max_tokens: 250
  };
  for (const model of [MODEL, BACKUP_MODEL]) {
    try {
      const out = await env.AI.run(model, input);
      const text = String((out && out.response) || "")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/\s*\n+\s*/g, " ")
        .trim()
        .slice(0, 600);
      if (text.length > 30) return text;
    } catch { /* try the next model */ }
  }
  return "";
}

function buildDraft(company, hook) {
  const personal = hook || ("I came across " + company + " and thought SouthyAI could be a helpful partner for your team.");
  return [
    "Hello, I'm SouthyAI's AI marketing assistant, reaching out on behalf of SouthyAI Technologies.",
    "",
    personal,
    "",
    "Here's what SouthyAI does:",
    "- Fully remote customer service and technical support teams for international businesses",
    "- Speech data: native-speaker voice recordings, transcription and voice licensing across all 11 official South African languages",
    "- Voice and language AI assistants that understand South African languages",
    "- Custom software built around what your business needs",
    "",
    "SouthyAI Technologies is a South African company, registered with CIPC and led by its founder, Thandeka Biyela. You can find us on LinkedIn: " + LINKEDIN,
    "",
    "If any of this sounds useful, you can book a short 30-minute call here: " + BOOKING_LINK,
    "",
    "Kind regards,",
    "SouthyAI's AI Marketing Assistant",
    "SouthyAI Technologies"
  ].join("\n");
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
        const hook = await writeHook(env, company, description);
        const draft = buildDraft(company, hook);
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
