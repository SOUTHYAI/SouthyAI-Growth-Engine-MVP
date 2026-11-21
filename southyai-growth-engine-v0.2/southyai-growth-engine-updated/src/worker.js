// ===== RESEND INBOUND WEBHOOK =====
function b64ToBytes(b64){const bin=atob(b64);const out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out;}
async function verifyResendSignature(request, rawBody, secret){
  const id=request.headers.get("svix-id")||"";
  const ts=request.headers.get("svix-timestamp")||"";
  const sigHeader=request.headers.get("svix-signature")||"";
  if(!id||!ts||!sigHeader||!secret) return false;
  if(!Number.isFinite(Number(ts))||Math.abs(Date.now()/1000-Number(ts))>300) return false;
  const key=await crypto.subtle.importKey("raw",b64ToBytes(secret.replace(/^whsec_/,"")),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const sig=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(id+"."+ts+"."+rawBody));
  const expected=btoa(String.fromCharCode(...new Uint8Array(sig)));
  return sigHeader.split(" ").some(p=>{const [v,s]=p.split(",");return v==="v1"&&constantTimeEqual(s||"",expected);});
}
async function handleResendWebhook(request, env){
  const raw=await request.text();
  if(!(await verifyResendSignature(request,raw,String(env.RESEND_WEBHOOK_SECRET||"")))) return json({error:"Invalid signature"},401);
  let event; try{event=JSON.parse(raw);}catch{return json({error:"Bad JSON"},400);}
  if(event.type!=="email.received") return json({ok:true,ignored:true});
  if(!env.DB) return json({error:"D1 is not connected"},503);
  const d=event.data||{};
  let text="",html="";
  if(env.RESEND_API_KEY&&d.email_id){
    try{
      const r=await fetch("https://api.resend.com/emails/receiving/"+encodeURIComponent(d.email_id),{headers:{Authorization:"Bearer "+env.RESEND_API_KEY},signal:AbortSignal.timeout(10000)});
      if(r.ok){const full=await r.json();text=full.text||"";html=full.html||"";}
    }catch{}
  }
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS inbound_emails (id INTEGER PRIMARY KEY AUTOINCREMENT, email_id TEXT UNIQUE, from_addr TEXT, to_addr TEXT, subject TEXT, body_text TEXT, body_html TEXT, received_at TEXT DEFAULT CURRENT_TIMESTAMP)").run();
  await env.DB.prepare("INSERT OR IGNORE INTO inbound_emails (email_id, from_addr, to_addr, subject, body_text, body_html) VALUES (?,?,?,?,?,?)")
    .bind(String(d.email_id||""),String(d.from||"").slice(0,300),String(Array.isArray(d.to)?d.to.join(", "):(d.to||"")).slice(0,500),String(d.subject||"").slice(0,500),String(text).slice(0,20000),String(html).slice(0,100000)).run();
  return json({ok:true});
}
export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "allow": "GET,POST,OPTIONS", "cache-control": "no-store" } });
    try {
      const p = new URL(request.url).pathname;
      if (request.method === "POST" && p === "/api/inbound/resend") return await handleResendWebhook(request, env);
      return await handle(request, env);
    }
    catch (e) { return json({ error: "Unexpected error", detail: e.message }, 500); }
  }
};
