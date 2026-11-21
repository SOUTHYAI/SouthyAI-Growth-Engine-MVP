// SouthyAI Growth Engine: outreach + AI conversations (v0.3)
// - Sends approved first emails through Resend
// - Receives prospect replies (Resend webhook), lets the AI answer within strict limits
// - Hands anything it is unsure about to a human (you)

const BOOKING_LINK = "https://calendly.com/southyai-support/30min";
const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const BACKUP_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MAX_AI_TURNS = 4;
const DEFAULT_FROM = "SouthyAI <ai@mail.southyai.co.za>";

const KNOWLEDGE = [
  "SouthyAI Technologies is a South African company.",
  "It provides fully remote, cloud-based customer service and technical support teams to international businesses. It has no physical call-centre office; its teams work remotely.",
  "It also builds speech datasets: native-speaker recordings across all 11 official South African languages, accurate transcription, and API licensing.",
  "SouthyAI Technologies was founded by Thandeka Biyela in South Africa.",
  "Customer service and technical support: remote agents handle customer queries and tech support for international businesses.",
  "Speech data: it collects authentic voice recordings from native South African speakers, provides transcription, and licenses voices to AI companies through an API.",
  "Voice and language AI: it builds AI assistant bots and voice solutions that understand South African languages.",
  "Custom software: it can also build custom software for clients who need it, and more details about this will be added to the website soon.",
  "Where it is from: SouthyAI Technologies is based in South Africa.",
  "Owner: SouthyAI Technologies is owned and led by its founder, Thandeka Biyela.",
  "Registration: SouthyAI Technologies is a registered company with the Companies and Intellectual Property Commission (CIPC) in South Africa. The registration number is not shared by the assistant; if someone asks for it, hand over to a person.",
  "LinkedIn: https://www.linkedin.com/in/southyai-technologies-7650b0437",
  "Contact: support@southyai.co.za and https://southyai.co.za",
  "A 30-minute call can be booked here: " + BOOKING_LINK
].join("\n");

let lastDebug = "";
const nowIso = () => new Date().toISOString();
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- tables (created automatically, no migration needed) ----------
let tablesReady = false;
export async function ensureTables(env) {
  if (tablesReady) return;
  const stmts = [
    "CREATE TABLE IF NOT EXISTS conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, lead_id INTEGER, email TEXT NOT NULL, subject TEXT, status TEXT NOT NULL DEFAULT 'Active', ai_turns INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS conv_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id INTEGER NOT NULL, direction TEXT NOT NULL, kind TEXT NOT NULL, body TEXT NOT NULL, provider_id TEXT, created_at TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS suppressions (email TEXT PRIMARY KEY, reason TEXT, created_at TEXT NOT NULL)",
    "CREATE INDEX IF NOT EXISTS idx_conv_email ON conversations(email)",
    "CREATE INDEX IF NOT EXISTS idx_msg_provider ON conv_messages(provider_id)"
  ];
  for (const s of stmts) await env.DB.prepare(s).run();
  tablesReady = true;
}

// ---------- small helpers ----------
export function extractAddress(from) {
  const m = String(from || "").match(/<([^>]+)>/);
  const a = (m ? m[1] : String(from || "")).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a) ? a : "";
}

export function stripQuoted(text) {
  const lines = String(text || "").replace(/\r/g, "").split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith(">")) break;
    if (/^On .+/i.test(t) && (/wrote:\s*$/i.test(t) || /wrote:\s*$/i.test((lines[i + 1] || "").trim()))) break;
    if (/^-{2,}\s*(Original Message|Forwarded)/i.test(t)) break;
    out.push(lines[i]);
  }
  return out.join("\n").trim().slice(0, 3000);
}

export function wantsOptOut(text) {
  return /\b(unsubscribe|remove me|stop (emailing|contacting|sending)|do not contact|don'?t contact|opt[- ]?out|not interested)\b/i.test(String(text || ""));
}

function headerMap(h) {
  const m = {};
  if (Array.isArray(h)) for (const x of h) { if (x && x.name) m[String(x.name).toLowerCase()] = String(x.value || ""); }
  else if (h && typeof h === "object") for (const k of Object.keys(h)) m[k.toLowerCase()] = String(h[k] || "");
  return m;
}

export function isAutoReply(subject, headers) {
  const h = headerMap(headers);
  if (h["auto-submitted"] && h["auto-submitted"].toLowerCase() !== "no") return true;
  if (h["x-autoreply"] || h["x-autorespond"] || (h["precedence"] || "").toLowerCase() === "auto_reply") return true;
  return /^(automatic reply|auto:|autoreply|out of office)/i.test(String(subject || "").trim());
}

export function draftFromNotes(notes) {
  const lines = String(notes || "").split("\n");
  if (lines.length && /^(DRAFT|APPROVED)/.test(lines[0])) lines.shift();
  return lines.join("\n").trim();
}

function footer(env) {
  return "\n\n--\nSent by SouthyAI's AI assistant on behalf of SouthyAI Technologies (South Africa)." +
    (env.BUSINESS_ADDRESS ? "\n" + env.BUSINESS_ADDRESS : "") +
    "\nNot relevant? Reply \"unsubscribe\" and we won't contact you again.";
}

const fromAddress = env => env.FROM_EMAIL || DEFAULT_FROM;

// ---------- finding a public business email on the prospect's own website ----------
export async function findContactEmail(website) {
  let host;
  try { host = new URL(website).hostname.replace(/^www\./, ""); } catch { return ""; }
  const paths = ["", "/contact", "/contact-us", "/about", "/about-us"];
  const found = new Map();
  for (const p of paths) {
    try {
      const r = await fetch(new URL(p, website).toString(), {
        signal: AbortSignal.timeout(8000),
        redirect: "follow",
        headers: { "User-Agent": "SouthyAI-Growth-Engine/0.3 (+https://southyai.co.za)" }
      });
      if (!r.ok) continue;
      const html = (await r.text()).slice(0, 300000)
        .replace(/&#64;|&commat;|&#x40;/gi, "@").replace(/\s*\[at\]\s*/gi, "@").replace(/mailto:/gi, " ");
      for (const m of html.matchAll(/[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi)) {
        const e = m[0].toLowerCase().replace(/[.]+$/, "");
        if (/\.(png|jpe?g|gif|svg|webp|css|js|woff2?)$/.test(e)) continue;
        if (/(sentry|example\.|domain\.com|yourname|noreply|no-reply|donotreply|wixpress|godaddy)/.test(e)) continue;
        const eh = e.split("@")[1];
        if (!(eh === host || eh.endsWith("." + host))) continue;
        found.set(e, (found.get(e) || 0) + 1);
      }
    } catch { /* try next page */ }
    if (found.size) break;
  }
  if (!found.size) return "";
  const prefer = ["partner", "sales", "hello", "info", "contact", "enquir", "business", "support"];
  const all = [...found.keys()];
  for (const p of prefer) { const hit = all.find(e => e.split("@")[0].includes(p)); if (hit) return hit; }
  return all[0];
}

// ---------- sending via Resend ----------
export async function sendViaResend(env, { to, subject, text, inReplyTo }) {
  if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY secret is missing.");
  const from = fromAddress(env);
  const body = { from, to: [to], subject, text, reply_to: from };
  if (inReplyTo) body.headers = { "In-Reply-To": inReplyTo, "References": inReplyTo };
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": "Bearer " + env.RESEND_API_KEY, "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000)
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("Resend said " + r.status + ": " + (data.message || data.name || "unknown error"));
  return data.id || "";
}

async function isSuppressed(env, email) {
  return !!(await env.DB.prepare("SELECT email FROM suppressions WHERE email = ?").bind(email).first());
}
async function addSuppression(env, email, reason) {
  await env.DB.prepare("INSERT OR IGNORE INTO suppressions (email, reason, created_at) VALUES (?, ?, ?)").bind(email, reason, nowIso()).run();
}
async function setLeadStatus(env, id, status) {
  if (!id) return;
  await env.DB.prepare("UPDATE leads SET status = ? WHERE id = ?").bind(status, id).run();
}
async function addMessage(env, convId, direction, kind, body, providerId) {
  await env.DB.prepare("INSERT INTO conv_messages (conversation_id, direction, kind, body, provider_id, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(convId, direction, kind, String(body).slice(0, 8000), providerId || null, nowIso()).run();
}
async function touchConversation(env, convId, status, addTurn) {
  await env.DB.prepare("UPDATE conversations SET status = ?, ai_turns = ai_turns + ?, updated_at = ? WHERE id = ?")
    .bind(status, addTurn ? 1 : 0, nowIso(), convId).run();
}

// ---------- first emails (only leads you approved) ----------
export async function sendApprovedLeads(env) {
  await ensureTables(env);
  if (!env.RESEND_API_KEY) throw new Error("Add the RESEND_API_KEY secret first.");
  const cap = Math.min(Number(env.DAILY_FIRST_EMAILS) || 20, 40);
  const today = nowIso().slice(0, 10);
  const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM conv_messages WHERE kind = 'first' AND created_at LIKE ?").bind(today + "%").first();
  let room = cap - ((row && row.n) || 0);
  const summary = { sent: [], needsEmail: [], skipped: 0, errors: [], dailyCap: cap };
  if (room <= 0) return summary;

  const res = await env.DB.prepare("SELECT id, company, website, contact_email, notes FROM leads WHERE status = 'Approved' ORDER BY id LIMIT 50").all();
  for (const lead of (res.results || [])) {
    if (room <= 0) break;
    let email = String(lead.contact_email || "").trim().toLowerCase();
    if (!email) email = await findContactEmail(lead.website);
    if (!email) { await setLeadStatus(env, lead.id, "Needs email"); summary.needsEmail.push(lead.company); continue; }
    if (await isSuppressed(env, email)) { await setLeadStatus(env, lead.id, "Opted out"); summary.skipped++; continue; }
    if (await env.DB.prepare("SELECT id FROM conversations WHERE email = ?").bind(email).first()) {
      await setLeadStatus(env, lead.id, "Contacted"); summary.skipped++; continue;
    }
    const draft = draftFromNotes(lead.notes);
    if (!draft) { summary.skipped++; continue; }
    const subject = "Question about customer support at " + String(lead.company).slice(0, 60);
    try {
      const providerId = await sendViaResend(env, { to: email, subject, text: draft + footer(env) });
      const now = nowIso();
      const ins = await env.DB.prepare("INSERT INTO conversations (lead_id, email, subject, status, ai_turns, created_at, updated_at) VALUES (?, ?, ?, 'Active', 0, ?, ?)")
        .bind(lead.id, email, subject, now, now).run();
      await addMessage(env, ins.meta.last_row_id, "out", "first", draft, providerId);
      await env.DB.prepare("UPDATE leads SET status = 'Contacted', contact_email = ? WHERE id = ?").bind(email, lead.id).run();
      summary.sent.push(lead.company);
      room--;
    } catch (e) {
      summary.errors.push(lead.company + ": " + e.message);
    }
    await sleep(400);
  }
  return summary;
}

// ---------- receiving replies ----------
async function verifySvix(headers, body, secret) {
  if (!secret) return false;
  const id = headers.get("svix-id"), ts = headers.get("svix-timestamp"), sigHeader = headers.get("svix-signature");
  if (!id || !ts || !sigHeader) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  try {
    const keyB64 = secret.startsWith("whsec_") ? secret.slice(6) : secret;
    const keyBytes = Uint8Array.from(atob(keyB64), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(id + "." + ts + "." + body));
    const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
    return sigHeader.split(" ").some(part => {
      const [v, s] = part.split(",");
      if (v !== "v1" || !s || s.length !== expected.length) return false;
      let d = 0;
      for (let i = 0; i < s.length; i++) d |= s.charCodeAt(i) ^ expected.charCodeAt(i);
      return d === 0;
    });
  } catch { return false; }
}

export async function handleInbound(request, env, ctx) {
  const raw = await request.text();
  const secret = String(env.RESEND_WEBHOOK_SECRET || "").trim();
  if (!secret) return new Response("Bad signature: RESEND_WEBHOOK_SECRET is missing on this worker", { status: 401 });
  if (!secret.startsWith("whsec_")) {
    return new Response("Bad signature: the saved secret does not start with whsec_ (it starts with " + secret.slice(0, 4) + "), length " + secret.length, { status: 401 });
  }
  if (!(await verifySvix(request.headers, raw, secret))) {
    return new Response("Bad signature: the secret starts with whsec_ (length " + secret.length + ") but did not match this message", { status: 401 });
  }
  let event;
  try { event = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }
  if (event.type === "email.received" && event.data) {
    ctx.waitUntil(processInbound(env, event.data).catch(e => console.log("Inbound failed:", e.message)));
  }
  return new Response("ok", { status: 200 });
}

async function fetchReceived(env, emailId) {
  const r = await fetch("https://api.resend.com/emails/receiving/" + encodeURIComponent(emailId), {
    headers: { "Authorization": "Bearer " + env.RESEND_API_KEY },
    signal: AbortSignal.timeout(15000)
  });
  if (!r.ok) throw new Error("Could not fetch the received email (HTTP " + r.status + ")");
  return r.json();
}

function htmlToText(html) {
  return String(html || "").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/[ \t]+/g, " ").trim();
}

async function history(env, convId) {
  const res = await env.DB.prepare("SELECT direction, body FROM conv_messages WHERE conversation_id = ? AND kind != 'auto' ORDER BY id DESC LIMIT 6").bind(convId).all();
  return (res.results || []).reverse().map(m => (m.direction === "out" ? "SouthyAI: " : "Prospect: ") + String(m.body).slice(0, 1200)).join("\n\n");
}

export function parseDecision(raw) {
  const s = String(raw || "");
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try {
    const j = JSON.parse(s.slice(a, b + 1).replace(/[\r\n]+/g, " "));
    const action = j.action === "reply" ? "reply" : j.action === "handover" ? "handover" : null;
    const reply = String(j.reply || "").trim();
    if (!action || !reply || reply.length > 1200) return null;
    const urls = reply.match(/https?:\/\/\S+/g) || [];
    if (urls.some(u => !(u.startsWith(BOOKING_LINK) || u.startsWith("https://southyai.co.za") || u.startsWith("https://www.linkedin.com/in/southyai-technologies-7650b0437")))) return null;
    return { action, reply };
  } catch { return null; }
}

async function decide(env, convId, latest) {
  const system =
    "You are SouthyAI's AI marketing assistant, replying by email to a business prospect on behalf of SouthyAI Technologies. " +
    "Sound friendly, personal and persuasive, like a good marketer: pick up on what the prospect said about their own business and connect it to the services in FACTS. You are an AI and never pretend to be a human employee. " +
    "You may ONLY state facts from the FACTS list. Never invent prices, team sizes, years of experience, clients, certifications, guarantees or timelines. " +
    "If the prospect asks about anything not in FACTS (pricing, contracts, legal or privacy terms, specific capabilities, availability), is upset or confused, or asks for a human, choose handover. " +
    "If they ask whether you are a bot or an AI, say plainly that you are SouthyAI's AI assistant and that a person from the team can follow up. " +
    "If they ask where the company is from, who owns it, or whether it is registered, answer plainly from FACTS, and share the LinkedIn link when they want to check the company out. Never give out a registration number. " +
    "If they show interest, invite them to book a call using the booking link in FACTS. " +
    "Keep replies under 150 words, warm, plain text, no hype. " +
    "If they ask what SouthyAI does, give a clear overview covering every service in FACTS, in short paragraphs, and end by inviting them to book a call. " +
    "Output ONLY valid JSON: {\"action\":\"reply\",\"reply\":\"...\"} or {\"action\":\"handover\",\"reply\":\"a short honest holding message saying a person from the team will come back to them\"}";
  const user = "FACTS:\n" + KNOWLEDGE + "\n\nCONVERSATION SO FAR:\n" + (await history(env, convId)) + "\n\nLATEST MESSAGE FROM PROSPECT:\n" + latest;
  lastDebug = "";
  let out;
  const input = { messages: [{ role: "system", content: system }, { role: "user", content: user }], max_tokens: 350 };
  try {
    out = await env.AI.run(MODEL, input);
  } catch (e1) {
    try {
      out = await env.AI.run(BACKUP_MODEL, input);
    } catch (e2) {
      lastDebug = "AI call failed: " + (e2 && e2.message ? e2.message : String(e2));
      return null;
    }
  }
  let raw = out && out.response;
  if (raw && typeof raw === "object") raw = JSON.stringify(raw);
  const d = parseDecision(raw);
  if (!d) lastDebug = "AI answer could not be used: " + String(raw).slice(0, 400);
  return d;
}

async function notifyOwner(env, conv, text, why) {
  if (!env.OWNER_EMAIL) return;
  try {
    await sendViaResend(env, {
      to: env.OWNER_EMAIL,
      subject: "[Growth Engine] " + why + ": " + conv.email,
      text: why + "\n\nProspect: " + conv.email + "\nSubject: " + (conv.subject || "") + "\n\nTheir latest message:\n" + String(text).slice(0, 1500) + "\n\nOpen your outreach page to see the whole conversation."
    });
  } catch (e) { console.log("Owner notify failed:", e.message); }
}

export async function processInbound(env, data) {
  await ensureTables(env);
  const sender = extractAddress(data.from);
  if (!sender || sender === extractAddress(fromAddress(env))) return;
  const emailId = data.email_id || data.id;
  if (!emailId) return;
  if (await env.DB.prepare("SELECT id FROM conv_messages WHERE provider_id = ?").bind(emailId).first()) return; // webhook retry

  const conv = await env.DB.prepare("SELECT * FROM conversations WHERE email = ? ORDER BY id DESC LIMIT 1").bind(sender).first();
  if (!conv) return; // not someone we wrote to

  const full = await fetchReceived(env, emailId);
  const subject = full.subject || data.subject || "";
  if (isAutoReply(subject, full.headers)) { await addMessage(env, conv.id, "in", "auto", "(automatic reply)", emailId); return; }
  const text = stripQuoted(full.text || htmlToText(full.html));
  if (!text) return;
  await addMessage(env, conv.id, "in", "reply", text, emailId);
  const inReplyTo = data.message_id || headerMap(full.headers)["message-id"] || "";
  const reSubject = /^re:/i.test(conv.subject || "") ? conv.subject : "Re: " + (conv.subject || "");

  if (wantsOptOut(text)) {
    await addSuppression(env, sender, "asked to stop");
    await touchConversation(env, conv.id, "Opted out", false);
    await setLeadStatus(env, conv.lead_id, "Opted out");
    try {
      const id = await sendViaResend(env, { to: sender, subject: reSubject, text: "Understood. You're removed and won't hear from us again. Thank you for letting us know.\n\nSouthyAI Technologies", inReplyTo });
      await addMessage(env, conv.id, "out", "reply", "(opt-out confirmation sent)", id);
    } catch (e) { console.log("Opt-out ack failed:", e.message); }
    return;
  }

  // Test conversations (no lead attached) reopen themselves, so testing never gets stuck on "Needs you".
  if (!conv.lead_id && (conv.status !== "Active" || conv.ai_turns >= MAX_AI_TURNS)) {
    await env.DB.prepare("UPDATE conversations SET status = 'Active', ai_turns = 0, updated_at = ? WHERE id = ?").bind(nowIso(), conv.id).run();
    conv.status = "Active";
    conv.ai_turns = 0;
  }

  if (conv.status !== "Active") { await notifyOwner(env, conv, text, "New message in a conversation waiting for you"); return; }

  lastDebug = "";
  let decision = null;
  if (conv.ai_turns < MAX_AI_TURNS) decision = await decide(env, conv.id, text);
  if (!decision) {
    decision = { action: "handover", reply: "Thanks for your message. I'm passing this to a person on our team, who will come back to you personally." };
    // Test conversations only (no lead attached): show why the AI could not answer.
    if (!conv.lead_id && lastDebug) decision.reply += "\n\n[test info: " + lastDebug + "]";
  }

  const id = await sendViaResend(env, { to: sender, subject: reSubject, text: decision.reply + "\n\n-- SouthyAI's AI assistant", inReplyTo });
  await addMessage(env, conv.id, "out", "reply", decision.reply, id);
  if (decision.action === "handover") {
    await touchConversation(env, conv.id, "Needs you", true);
    await setLeadStatus(env, conv.lead_id, "Needs you");
    await notifyOwner(env, conv, text, "Prospect needs you");
  } else {
    await touchConversation(env, conv.id, "Active", true);
    await setLeadStatus(env, conv.lead_id, "In conversation");
  }
}

// ---------- admin API for the /outreach page ----------
const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export async function handleOutreachApi(request, env, url) {
  await ensureTables(env);
  const path = url.pathname.replace("/api/outreach", "");
  const method = request.method;
  const body = method === "POST" ? await request.json().catch(() => ({})) : {};
  try {
    if (method === "GET" && path === "/drafts") {
      const res = await env.DB.prepare("SELECT id, company, website, contact_email, notes FROM leads WHERE status = 'Draft ready' ORDER BY id DESC LIMIT 40").all();
      return json({ drafts: (res.results || []).map(l => ({ id: l.id, company: l.company, website: l.website, email: l.contact_email || "", text: draftFromNotes(l.notes) })) });
    }
    if (method === "POST" && path === "/approve") {
      const id = Number(body.id);
      const email = String(body.email || "").trim().toLowerCase();
      const text = String(body.text || "").trim();
      if (!id || !text) return json({ error: "Missing id or message text." }, 400);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "That email address doesn't look right." }, 400);
      await env.DB.prepare("UPDATE leads SET status = 'Approved', contact_email = ?, notes = ? WHERE id = ?").bind(email, ("APPROVED\n" + text).slice(0, 1990), id).run();
      return json({ ok: true });
    }
    if (method === "POST" && path === "/skip") {
      await setLeadStatus(env, Number(body.id), "Skipped");
      return json({ ok: true });
    }
    if (method === "POST" && path === "/send-now") return json(await sendApprovedLeads(env));
    if (method === "POST" && path === "/test-email") {
      const to = String(body.to || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return json({ error: "Enter a valid email address." }, 400);
      const subject = "Test from your SouthyAI Growth Engine";
      const text = "Hi, this is a test from your Growth Engine.\n\nReply to this email with a question like \"What does SouthyAI do?\" and the AI assistant should answer you." + footer(env);
      const id = await sendViaResend(env, { to, subject, text });
      let conv = await env.DB.prepare("SELECT id FROM conversations WHERE email = ? ORDER BY id DESC LIMIT 1").bind(to).first();
      if (!conv) {
        const now = nowIso();
        const ins = await env.DB.prepare("INSERT INTO conversations (lead_id, email, subject, status, ai_turns, created_at, updated_at) VALUES (NULL, ?, ?, 'Active', 0, ?, ?)").bind(to, subject, now, now).run();
        conv = { id: ins.meta.last_row_id };
      }
      await addMessage(env, conv.id, "out", "test", text, id);
      return json({ ok: true, sentTo: to });
    }
    if (method === "GET" && path === "/conversations") {
      const convs = (await env.DB.prepare("SELECT id, email, subject, status, ai_turns, updated_at FROM conversations ORDER BY updated_at DESC LIMIT 25").all()).results || [];
      for (const c of convs) c.messages = ((await env.DB.prepare("SELECT direction, kind, body, created_at FROM conv_messages WHERE conversation_id = ? ORDER BY id").bind(c.id).all()).results) || [];
      return json({ conversations: convs });
    }
    if (method === "POST" && path === "/reopen") {
      await env.DB.prepare("UPDATE conversations SET status = 'Active', ai_turns = 0, updated_at = ? WHERE id = ?").bind(nowIso(), Number(body.id)).run();
      return json({ ok: true });
    }
  } catch (e) {
    return json({ error: e.message || "Something went wrong." }, 500);
  }
  return json({ error: "Not found" }, 404);
}
