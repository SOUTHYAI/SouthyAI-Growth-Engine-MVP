const HTML = `
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SouthyAI Growth Engine</title>
<style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033;background:#f5f7fb}
*{box-sizing:border-box}body{margin:0}.top{background:#10172a;color:#fff;padding:24px max(20px,calc((100vw - 1120px)/2));display:flex;align-items:center;justify-content:space-between;gap:20px}.brand{font-weight:800;letter-spacing:.3px;font-size:20px}.sub{color:#bac4d8;font-size:13px;margin-top:5px}.pill{border:1px solid #46516a;border-radius:999px;padding:7px 11px;font-size:12px;color:#dce5f8}.wrap{max-width:1120px;margin:26px auto;padding:0 18px}.hero h1{font-size:clamp(25px,4vw,38px);margin:0 0 8px}.hero p{color:#5b6577;max-width:760px;line-height:1.55;margin:0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:24px}.card{background:white;border:1px solid #e2e7f0;border-radius:16px;padding:20px;box-shadow:0 5px 20px #1b2a4410;min-width:0}.wide{grid-column:1/-1}.card h2{font-size:18px;margin:0 0 6px}.hint{font-size:13px;color:#657084;line-height:1.5;margin:0 0 14px}label{display:block;font-size:13px;font-weight:650;margin:12px 0 6px}input,textarea,select{width:100%;padding:11px 12px;border:1px solid #cfd7e5;border-radius:9px;background:#fff;font:inherit;font-size:14px;color:#172033}textarea{min-height:86px;resize:vertical}.btn{background:#192746;color:white;border:0;border-radius:9px;padding:11px 15px;font-weight:700;cursor:pointer;margin-top:12px}.btn.secondary{background:#edf1f8;color:#1a2947}.btn:disabled{opacity:.5;cursor:wait}.status{font-size:13px;color:#657084;margin-top:10px;white-space:pre-wrap}.results{margin-top:16px}.score{font-size:34px;font-weight:800}.checks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:14px}.check{border:1px solid #e5e9f1;padding:10px;border-radius:9px;font-size:13px}.ok{color:#16734c}.bad{color:#b14b31}.output{white-space:pre-wrap;background:#f7f9fc;border:1px solid #e3e8f1;padding:13px;border-radius:9px;margin-top:10px;font-size:13px;line-height:1.55;overflow-wrap:anywhere}.mini{font-size:12px;color:#667085}.nav{display:flex;gap:8px;flex-wrap:wrap;max-width:1120px;margin:18px auto 0;padding:0 18px}.nav a{color:#23365e;text-decoration:none;background:#fff;border:1px solid #dfe5ef;border-radius:999px;padding:9px 13px;font-size:13px;font-weight:700}.nav a:hover{background:#eaf0ff}.feature-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.feature{border:1px solid #e5e9f1;border-radius:10px;padding:12px}.feature p{margin:5px 0 0;color:#657084;font-size:13px;line-height:1.45}.footer{text-align:center;color:#7a8495;font-size:12px;padding:26px 10px}.tablewrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:9px;border-bottom:1px solid #e7ebf2;vertical-align:top}th{color:#606b7e}
@media(max-width:760px){.grid{grid-template-columns:1fr}.wide{grid-column:auto}.checks{grid-template-columns:1fr}.top{align-items:flex-start;flex-direction:column}}
</style></head>
<body>
<header class="top"><div><div class="brand">SOUTHYAI <span style="color:#8da9ff">GROWTH ENGINE</span></div><div class="sub">Your first low-cost marketing and visibility workspace</div></div><span class="pill" id="apiStatus">Checking service…</span></header>
<nav class="nav" aria-label="Growth Engine sections">
<a href="#intelligence">Business intelligence</a><a href="#competitors">Competitors</a><a href="#content">Campaign studio</a><a href="#leads">Lead tracker</a><a href="#history">Reports</a><a href="#video-studio">AI video studio</a>
</nav>
<main class="wrap">
<section class="hero"><h1>Make SouthyAI easier to discover.</h1><p>Start with your website. Audit technical SEO, inspect competitor sites, generate marketing drafts, and organise leads. This MVP does not yet buy ads, publish posts, send emails, or render AI videos automatically.</p></section>
<section class="card wide" id="admin-access" style="margin-top:18px"><h2>Secure admin access</h2><p class="hint">Enter the private ADMIN_API_TOKEN configured as a Cloudflare Worker secret. The token is kept only in this browser tab session and is never written into the public code.</p><label for="adminToken">Admin access token</label><input id="adminToken" type="password" autocomplete="current-password" placeholder="Paste your private admin token"><button class="btn" id="saveAdminTokenBtn">Verify and unlock dashboard</button><button class="btn secondary" id="clearAdminTokenBtn">Lock this session</button><div class="status" id="adminAccessStatus">Admin access is locked until a valid token is verified.</div></section>
<div class="grid">
<section class="card wide" id="intelligence"><h2>1. Business intelligence · Website deep-dive</h2><p class="hint">Checks the homepage and a small sample of internal pages, plus robots.txt and sitemap.xml. Only enter a public website you own or have permission to audit.</p>
<label for="siteUrl">Website URL</label><input id="siteUrl" value="https://southyai.co.za" placeholder="https://example.com">
<button class="btn" id="auditBtn">Run website audit</button><div class="status" id="auditStatus"></div><div id="auditResults" class="results"></div></section>
<section class="card" id="competitors"><h2>2. Competitor comparison</h2><p class="hint">Run a basic public-page audit on a competitor website and compare its title, description, content and checks with your own. Add only one URL at a time.</p>
<label for="competitorUrl">Competitor website</label><input id="competitorUrl" placeholder="https://competitor.com">
<button class="btn" id="competitorBtn">Audit competitor</button><div id="competitorStatus" class="status"></div><div id="competitorResults"></div></section>
<section class="card" id="content"><h2>3. Campaign content generator</h2><p class="hint">Creates editable draft copy for LinkedIn, Facebook, and a short video ad script. It does not render video or publish content.</p>
<label for="service">Service to promote</label><select id="service"><option>Remote customer service and technical support</option><option>South African speech-data collection and transcription</option><option>South African voice AI and assistant bots</option><option>Healthcare information assistant (non-diagnostic)</option></select>
<label for="audience">Target buyer</label><input id="audience" value="international businesses needing reliable customer support">
<label for="offer">Call to action / offer</label><input id="offer" value="Let's discuss a small pilot">
<button class="btn" id="contentBtn">Generate campaign drafts</button><div id="contentStatus" class="status"></div><div id="contentResults"></div></section>
<section class="card" id="leads"><h2>4. Lead tracker</h2><p class="hint">Save companies you discover so you can track them. This is a tracker, not an automatic lead-finding or email-sending engine.</p>
<label for="leadCompany">Company name *</label><input id="leadCompany" placeholder="Company name">
<label for="leadWebsite">Website</label><input id="leadWebsite" placeholder="https://company.com">
<label for="leadContact">Decision-maker / contact</label><input id="leadContact" placeholder="Name if publicly listed">
<label for="leadEmail">Business email</label><input id="leadEmail" type="email" placeholder="name@company.com">
<label for="leadSource">Source URL</label><input id="leadSource" placeholder="Where you found this company">
<label for="leadNotes">Notes / potential need</label><textarea id="leadNotes" placeholder="Why this prospect may need SouthyAI"></textarea>
<button class="btn" id="saveLeadBtn">Save lead</button><div id="leadStatus" class="status"></div><button class="btn secondary" id="loadLeadsBtn">Load saved leads</button><div id="leadsResults" class="results"></div></section>
<section class="card" id="history"><h2>5. Saved audit history</h2><p class="hint">Connect Cloudflare D1 and run the included database schema to save reports and leads between sessions.</p><button class="btn secondary" id="historyBtn">Load audit history</button><div id="historyStatus" class="status"></div><div id="historyResults"></div></section>
<section class="card wide" id="video-studio"><h2>8. SouthyAI One-Prompt Video Studio</h2><p class="hint">Describe the advert once. SouthyAI sends it to the video engine to create a finished video with an AI presenter, voice and scenes. Portrait video, up to 60 seconds. Generation requires the video service to be connected.</p>
<label for="videoPrompt">What video should we create?</label><textarea id="videoPrompt" style="min-height:125px" placeholder="Example: Create a cinematic 60-second advert for a modern bank. Show a friendly AI banking assistant helping customers, with a professional presenter, warm lighting and a clear invitation to learn more."></textarea>
<div class="grid" style="margin-top:4px">
<div><label for="videoAvatar">AI presenter</label><select id="videoAvatar"><option value="auto">Let SouthyAI choose</option><option value="Adriana SuitSofa Front">Adriana · Corporate</option><option value="Alex in Black Suit">Alex · Corporate</option><option value="Judy Suit Front">Judy · Corporate</option><option value="Brandon in Grey Suit">Brandon · Corporate</option><option value="Yola Business Front">Yola · Business</option><option value="Justo CustomerService Front">Justo · Customer service</option><option value="Caroline in Blue Suit">Caroline · Corporate</option><option>Ivan in Black Suit</option></select>
<label for="videoAccent">Voice accent</label><select id="videoAccent"><option value="South African English">South African English</option><option value="British English (UK)">British English (UK)</option><option value="American English (US)">American English (US)</option><option value="Neutral international English">Neutral international English</option></select></div>
<div><label for="videoOrientation">Video format</label><select id="videoOrientation"><option value="portrait" selected>Portrait 9:16 · Facebook / LinkedIn</option><option value="landscape">Landscape 16:9</option></select>
<label for="videoDuration">Duration</label><select id="videoDuration"><option value="60" selected>Up to 60 seconds</option><option value="30">30 seconds</option></select>
<label for="videoImage">Upload an image (optional)</label><input id="videoImage" type="file" accept="image/png,image/jpeg,image/webp"><div id="videoImageName" class="mini">No image uploaded — the video engine will create visuals from your prompt.</div></div></div>
<button class="btn" id="videoGenerateBtn">Generate my video</button><div id="videoStatus" class="status" aria-live="polite">Ready when you are. Video generation uses paid provider credits.</div><div id="videoResults"></div></section>
<section class="card wide"><h2>What still needs connecting</h2><div class="checks">
<div class="check"><b>Website crawler</b><br>Included: homepage + up to 7 same-domain HTML links.</div>
<div class="check"><b>AI reasoning / competitor discovery</b><br>Needs an AI/search provider and secure API key.</div>
<div class="check"><b>ChatGPT search visibility</b><br>Audit can help prepare; rankings and citations cannot be guaranteed.</div>
<div class="check"><b>Video rendering</b><br>Concepts and scripts are available; rendering actual videos needs a connected video service.</div>
<div class="check"><b>Social posting and paid ads</b><br>Requires authorised platform connections and ad-account budget controls.</div>
<div class="check"><b>Automated email outreach</b><br>Requires an email service, consent/compliance rules, and sending safeguards.</div>
</div></section>
</div><div class="footer">SouthyAI Growth Engine • MVP 0.2 • Check every AI-generated claim before publishing.</div>
</main>
<script>
const $ = id => document.getElementById(id);
async function api(path, body) {
  const token = sessionStorage.getItem("southyai_admin_token") || "";
  const headers = {};
  if (body) headers["content-type"] = "application/json";
  if (token) headers.authorization = "Bearer " + token;
  const options = { method: body ? "POST" : "GET", headers: headers };
  if (body) options.body = JSON.stringify(body);
  const r = await fetch(path, options);
  const data = await r.json().catch(()=>({error:"Unexpected response"}));
  if(!r.ok) throw new Error(data.error || "Request failed (" + r.status + ")");
  return data;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function renderAudit(d, target) {
  $(target).innerHTML = \`<div class="card" style="padding:14px;margin-top:12px"><div class="score">\${d.score}/100</div><div class="mini">Basic technical/content checklist score · \${d.pagesCrawled||1} page(s) crawled · \${d.wordCount} detected words</div><h3>Homepage findings</h3><div class="checks">\${d.checks.map(c=>\`<div class="check"><b class="\${c.ok?'ok':'bad'}">\${c.ok?'✓':'!'} \${esc(c.name)}</b><br>\${esc(c.detail)}</div>\`).join("")}</div><h3>Page details</h3><p><b>Title:</b> \${esc(d.title||"Missing")}<br><b>Description:</b> \${esc(d.description||"Missing")}<br><b>H1:</b> \${esc((d.h1||[]).join(" / ")||"Missing")}<br><b>Internal/external links detected:</b> \${d.linkCount}<br><b>Images detected:</b> \${d.imageCount} (\${d.missingAlt} missing alt text)</p><h3>robots.txt and sitemap</h3><p><b>robots.txt:</b> \${d.crawl?.["/robots.txt"]?.found?"Found":"Not found / inaccessible"} · HTTP \${d.crawl?.["/robots.txt"]?.status||"—"}<br><b>sitemap.xml:</b> \${d.crawl?.["/sitemap.xml"]?.found?"Found":"Not found / inaccessible"} · HTTP \${d.crawl?.["/sitemap.xml"]?.status||"—"}</p>\${d.pages?.length?\`<h3>Sampled internal pages</h3><div class="tablewrap"><table><thead><tr><th>Page</th><th>Title</th><th>Score</th></tr></thead><tbody>\${d.pages.map(p=>\`<tr><td>\${esc(p.url)}</td><td>\${esc(p.title)}</td><td>\${p.score}/100</td></tr>\`).join("")}</tbody></table></div>\`:""}<p class="mini">\${esc(d.note||"")}</p><button class="btn secondary" onclick="downloadJson('southyai-audit.json',window.latestAudit)">Download audit JSON</button></div>\`;
}
$("adminToken").value = sessionStorage.getItem("southyai_admin_token") || "";
$("saveAdminTokenBtn").onclick = async () => {
  const token = $("adminToken").value.trim();
  if (!token) { $("adminAccessStatus").textContent = "Paste the admin token first."; return; }
  sessionStorage.setItem("southyai_admin_token", token);
  $("adminAccessStatus").textContent = "Checking token…";
  try { await api("/api/auth/check"); $("adminAccessStatus").textContent = "Verified. Admin functions are unlocked for this browser session."; }
  catch (e) { sessionStorage.removeItem("southyai_admin_token"); $("adminAccessStatus").textContent = e.message; }
};
$("clearAdminTokenBtn").onclick = () => {
  sessionStorage.removeItem("southyai_admin_token");
  $("adminToken").value = "";
  $("adminAccessStatus").textContent = "Session locked. Enter the token again to use admin functions.";
};
window.latestAudit = null;
window.latestVideoBrief = null;
window.downloadJson = (name,data) => {const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download=name;a.click();URL.revokeObjectURL(a.href);};
async function statusCheck(){try{const d=await api("/api/health");$("apiStatus").textContent="Service online · v"+d.version+(d.databaseConnected?" · D1 connected":" · D1 not connected")+(d.adminAuthConfigured?" · Admin lock enabled":" · ADMIN_API_TOKEN missing");}catch{$("apiStatus").textContent="Service check failed";}}
$("auditBtn").onclick=async()=>{const b=$("auditBtn");b.disabled=true;$("auditStatus").textContent="Crawling a small sample of public pages…";$("auditResults").innerHTML="";try{const d=await api("/api/audit",{url:$("siteUrl").value.trim()});window.latestAudit=d;renderAudit(d,"auditResults");$("auditStatus").textContent="Audit complete.";}catch(e){$("auditStatus").textContent=e.message;}finally{b.disabled=false;}};
$("competitorBtn").onclick=async()=>{const b=$("competitorBtn");b.disabled=true;$("competitorStatus").textContent="Auditing public competitor page…";$("competitorResults").innerHTML="";try{const d=await api("/api/audit",{url:$("competitorUrl").value.trim()});$("competitorResults").innerHTML=\`<div class="output"><b>\${esc(d.url)}</b><br>Score: \${d.score}/100<br>Title: \${esc(d.title||"Missing")}<br>Description: \${esc(d.description||"Missing")}<br>H1: \${esc((d.h1||[]).join(" / ")||"Missing")}<br>Detected words: \${d.wordCount}<br><br>Compare this with your own audit. This does not assess their private sales, actual revenue, or Google rankings.</div>\`;$("competitorStatus").textContent="Competitor audit complete.";}catch(e){$("competitorStatus").textContent=e.message;}finally{b.disabled=false;}};
$("contentBtn").onclick=async()=>{const b=$("contentBtn");b.disabled=true;$("contentStatus").textContent="Preparing campaign drafts…";$("contentResults").innerHTML="";try{const d=await api("/api/content",{business:"SouthyAI Technologies",service:$("service").value,audience:$("audience").value,offer:$("offer").value,tone:"professional and human"});$("contentResults").innerHTML=Object.entries(d).map(([k,v])=>\`<h3>\${esc(k.replace(/([A-Z])/g," $1"))}</h3><div class="output">\${esc(v)}</div><button class="btn secondary" onclick="copyText(\${JSON.stringify(v).replace(/</g,"\\\\u003c")})">Copy draft</button>\`).join("");$("contentStatus").textContent="Drafts generated. Review claims and personalise before use.";}catch(e){$("contentStatus").textContent=e.message;}finally{b.disabled=false;}};
window.copyText=async t=>{try{await navigator.clipboard.writeText(t);alert("Copied");}catch{alert("Please select and copy the draft manually.");}};
$("saveLeadBtn").onclick=async()=>{const b=$("saveLeadBtn");b.disabled=true;$("leadStatus").textContent="Saving lead…";try{await api("/api/leads",{company:$("leadCompany").value.trim(),website:$("leadWebsite").value.trim(),contact_name:$("leadContact").value.trim(),contact_email:$("leadEmail").value.trim(),source_url:$("leadSource").value.trim(),notes:$("leadNotes").value.trim(),status:"New"});$("leadStatus").textContent="Lead saved.";["leadCompany","leadWebsite","leadContact","leadEmail","leadSource","leadNotes"].forEach(id=>$(id).value="");}catch(e){$("leadStatus").textContent=e.message;}finally{b.disabled=false;}};
$("loadLeadsBtn").onclick=async()=>{try{const d=await api("/api/leads");$("leadsResults").innerHTML=\`<div class="tablewrap"><table><thead><tr><th>Company</th><th>Website</th><th>Status</th><th>Notes</th></tr></thead><tbody>\${d.leads.map(l=>\`<tr><td>\${esc(l.company)}</td><td>\${esc(l.website)}</td><td>\${esc(l.status)}</td><td>\${esc(l.notes)}</td></tr>\`).join("")}</tbody></table></div>\`;}catch(e){$("leadStatus").textContent=e.message;}};
$("historyBtn").onclick=async()=>{try{const d=await api("/api/audits");$("historyResults").innerHTML=\`<div class="tablewrap"><table><thead><tr><th>Date</th><th>Website</th><th>Score</th></tr></thead><tbody>\${d.audits.map(a=>\`<tr><td>\${esc(a.created_at)}</td><td>\${esc(a.website_url)}</td><td>\${a.score}/100</td></tr>\`).join("")}</tbody></table></div>\`;$("historyStatus").textContent=\`\${d.audits.length} saved audit(s).\`;}catch(e){$("historyStatus").textContent=e.message;}};

const makeVideoBrief = () => {
 const brand=$("videoBrand").value.trim()||"SouthyAI Technologies", product=$("videoProduct").value.trim(), audience=$("videoAudience").value.trim(), goal=$("videoGoal").value, format=$("videoFormat").value, style=$("videoStyle").value, tone=$("videoTone").value, length=$("videoLength").value;
 const hook = \`Still losing customers because support cannot keep up?\`;
 const script = \`\${hook}\\n\\n\${brand} helps \${audience.toLowerCase()} with \${product}\\n\\nWe combine trained people, clear processes and technology to help businesses deliver more consistent customer experiences.\\n\\nLet’s \${goal}. Connect with \${brand} today.\`;
 const scenes = [
  {time:"0–3 sec",visual:"Strong opening shot: professional presenter looks directly into camera. Display the hook as large on-screen text.",voiceover:hook},
  {time:"3–10 sec",visual:\`Show the business problem and relevant customer-service or technical-support visuals. Caption the core need: \${audience}.\`,voiceover:\`For \${audience.toLowerCase()}, every customer conversation matters.\`},
  {time:"10–22 sec",visual:\`Introduce \${brand}; show remote support team, secure workstation imagery and service workflow. Avoid implying certifications or results that have not been verified.\`,voiceover:\`\${brand} offers \${product}\`},
  {time:"22–30 sec",visual:\`Presenter returns. Show brand name, website and one clear call to action: \${goal}.\`,voiceover:\`Let’s \${goal}. Connect with \${brand} today.\`}
 ];
 return {brand,product,audience,objective:goal,format,style,tone,targetDuration:length,script,scenes,visualPrompt:\`Create a \${format}, \${length} \${style.toLowerCase()} advertisement for \${brand}. Tone: \${tone}. Audience: \${audience}. Service: \${product}. Use authentic professional business visuals, readable captions, clean scene transitions, clear audio, and a final call to action to \${goal}. Do not invent customer testimonials, statistics, awards, certifications or guarantees.\`,status:"Production brief only — AI video rendering provider not connected."};
};
$("videoBriefBtn").onclick=()=>{const brief=makeVideoBrief();window.latestVideoBrief=brief;$("videoDownloadBtn").disabled=false;$("videoStatus").textContent="Concept and storyboard ready. Review every claim before production.";$("videoResults").innerHTML=\`<div class="output"><h3>Ad script</h3>\${esc(brief.script)}<h3>Scene-by-scene storyboard</h3>\${brief.scenes.map(s=>\`<p><b>\${esc(s.time)}</b><br><b>Visual:</b> \${esc(s.visual)}<br><b>Voiceover:</b> \${esc(s.voiceover)}</p>\`).join("")}<h3>AI video generation prompt</h3>\${esc(brief.visualPrompt)}<p class="mini">Format: \${esc(brief.format)} · Duration: \${esc(brief.targetDuration)} · \${esc(brief.status)}</p><button class="btn secondary" id="copyVideoScript">Copy script</button><button class="btn secondary" id="copyVideoPrompt">Copy visual prompt</button></div>\`;$("copyVideoScript").onclick=()=>copyText(brief.script);$("copyVideoPrompt").onclick=()=>copyText(brief.visualPrompt);};
const videoFileToDataUrl = file => new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error("Could not read the uploaded image."));reader.readAsDataURL(file);});
$("videoImage").onchange=()=>{$("videoImageName").textContent=$("videoImage").files[0] ? $("videoImage").files[0].name : "No image uploaded — the video engine will create visuals from your prompt.";};
$("videoGenerateBtn").onclick=async()=>{
 const btn=$("videoGenerateBtn"), prompt=$("videoPrompt").value.trim(), file=$("videoImage").files[0];
 if(!prompt){$("videoStatus").textContent="Please describe the video first.";return;}
 if(file && (!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>5*1024*1024)){$("videoStatus").textContent="Use a PNG, JPG or WebP image smaller than 5 MB.";return;}
 btn.disabled=true;$("videoResults").innerHTML="";$("videoStatus").textContent="Sending your video brief to the generation engine…";
 try{
  const imageData=file?await videoFileToDataUrl(file):undefined;
  const started=await api("/api/video/generate",{prompt,avatar:$("videoAvatar").value,accent:$("videoAccent").value,orientation:$("videoOrientation").value,duration:$("videoDuration").value,imageData});
  $("videoStatus").textContent="Video accepted and queued. SouthyAI is creating it now…";
  let done=false;
  for(let i=0;i<120;i++){
   await new Promise(resolve=>setTimeout(resolve,5000));
   const state=await api("/api/video/status?request_id="+encodeURIComponent(started.requestId));
   if(state.status==="COMPLETED"&&state.videoUrl){
    $("videoStatus").textContent="Your video is ready!";
    $("videoResults").innerHTML='<div class="output"><video controls playsinline style="width:100%;max-width:420px;border-radius:12px" src="'+esc(state.videoUrl)+'"></video><p><a href="'+esc(state.videoUrl)+'" target="_blank" rel="noopener">Open or download your MP4 video</a></p></div>';
    done=true;break;
   }
   if(state.status==="FAILED"||state.status==="CANCELLED")throw new Error("Video generation failed. Please try again with a simpler prompt.");
   $("videoStatus").textContent="Your video is rendering… Status: "+state.status+". This can take a few minutes.";
  }
  if(!done)$("videoStatus").textContent="Your video is still processing. Please come back and try again shortly; your generation request was submitted.";
 }catch(e){$("videoStatus").textContent=e.message||"Video generation could not be completed.";}
 finally{btn.disabled=false;}
};


statusCheck();
</script></body></html>

`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "strict-origin-when-cross-origin", "x-frame-options": "DENY" }
  });
}
function isPrivateIPv4(host) {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return false;
  const p=host.split(".").map(Number);
  if(p.some(n=>n<0||n>255)) return true;
  const a=p[0],b=p[1],c=p[2];
  return a===0||a===10||a===127||a>=224||(a===100&&b>=64&&b<=127)||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&(b===168||(b===0&&(c===0||c===2))))||(a===198&&(b===18||b===19||(b===51&&c===100)))||(a===203&&b===0&&c===113);
}
function isPrivateIPv6(host) {
  const x=host.toLowerCase().replace(/^\[|\]$/g,"");
  if(x.includes("%")) return true;
  const first=parseInt(x.split(":")[0]||"0",16);
  if(!Number.isFinite(first)||first<0x2000||first>0x3fff) return true;
  return x.startsWith("2001:db8:")||x.startsWith("2001:10:")||x.startsWith("2001:20:");
}
function safeUrl(input) {
  let u;
  try { u=new URL(input); } catch { throw new Error("Enter a valid full URL, e.g. https://southyai.co.za"); }
  if(!["http:","https:"].includes(u.protocol)) throw new Error("Only http and https URLs are supported.");
  if(u.username||u.password) throw new Error("URLs containing credentials are not allowed.");
  const host=u.hostname.toLowerCase().replace(/^\[|\]$/g,"");
  if(!host||host==="localhost"||host.endsWith(".localhost")||host.endsWith(".local")||host.endsWith(".internal")||host.endsWith(".test")||host.endsWith(".invalid")||host==="metadata.google.internal"||host==="instance-data") throw new Error("Private, local and reserved hostnames cannot be audited.");
  if(host.includes(":")&&isPrivateIPv6(host)) throw new Error("Private or reserved IP addresses cannot be audited.");
  if(isPrivateIPv4(host)) throw new Error("Private or reserved IP addresses cannot be audited.");
  return u;
}
async function assertPublicDns(host) {
  const name=host.toLowerCase().replace(/^\[|\]$/g,"");
  if(name.includes(":")||/^\d{1,3}(?:\.\d{1,3}){3}$/.test(name)) return;
  const ips=[];
  for(const type of ["A","AAAA"]) {
    const r=await fetch("https://cloudflare-dns.com/dns-query?name="+encodeURIComponent(name)+"&type="+type,{headers:{accept:"application/dns-json"},signal:AbortSignal.timeout(5000)});
    if(!r.ok) throw new Error("Could not safely verify the website DNS records. Try again later.");
    const d=await r.json();
    if(d.Status!==0) throw new Error("The website hostname could not be safely resolved.");
    for(const answer of (d.Answer||[])) if(answer.type===1||answer.type===28) ips.push(String(answer.data||"").toLowerCase());
  }
  if(!ips.length) throw new Error("The website hostname did not resolve to a public IP address.");
  if(ips.some(ip=>ip.includes(":")?isPrivateIPv6(ip):isPrivateIPv4(ip))) throw new Error("The website resolves to a private or reserved IP address and was blocked.");
}
function stripHtml(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ").trim();
}
function extractAll(html, regex) {
  const out = []; let m;
  while ((m = regex.exec(html)) !== null) out.push(m[1] || "");
  return out;
}
function absoluteLink(href, base) {
  try { const u = new URL(href, base); if (u.protocol === "http:" || u.protocol === "https:") return u.href; } catch {}
  return null;
}
async function fetchPage(inputUrl) {
  let current=safeUrl(inputUrl.href),res;
  for(let hop=0;hop<=5;hop++) {
    await assertPublicDns(current.hostname);
    res=await fetch(current.href,{headers:{"user-agent":"SouthyAI-GrowthEngine/0.1 (public-site audit)","accept":"text/html,application/xhtml+xml,text/plain;q=0.8,*/*;q=0.5"},redirect:"manual",signal:AbortSignal.timeout(12000)});
    if(![301,302,303,307,308].includes(res.status)) break;
    const loc=res.headers.get("location");
    if(!loc) break;
    if(hop===5) throw new Error("The website redirected too many times.");
    const next=safeUrl(new URL(loc,current.href).href);
    try{if(res.body) await res.body.cancel();}catch{}
    current=next;
  }
  const type=res.headers.get("content-type")||"",body=await res.text();
  return {res,type,body,finalUrl:current.href};
}
function auditHtml(html, url, status, contentType) {
  const title = (html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [,""])[1].replace(/<[^>]*>/g, "").trim();
  const description = (html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
    || html.match(/<meta\b[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i) || [,""])[1].trim();
  const canonical = (html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)
    || html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i) || [,""])[1];
  const h1 = extractAll(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi).map(x => stripHtml(x));
  const h2 = extractAll(html, /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi).map(x => stripHtml(x));
  const images = extractAll(html, /<img\b[^>]*>/gi);
  const missingAlt = images.filter(tag => !/\balt\s*=\s*["'][^"']*["']/i.test(tag)).length;
  const links = extractAll(html, /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>/gi)
    .map(h => absoluteLink(h, url.href)).filter(Boolean);
  const text = stripHtml(html);
  const checks = [
    { name: "Page returned successfully", ok: status >= 200 && status < 400, detail: `HTTP ${status}` },
    { name: "Page title", ok: !!title, detail: title ? `${title.slice(0, 100)}${title.length > 100 ? "…" : ""}` : "No title found" },
    { name: "Title length", ok: title.length >= 20 && title.length <= 65, detail: `${title.length} characters; aim for roughly 20–60` },
    { name: "Meta description", ok: !!description, detail: description ? `${description.length} characters` : "No meta description found" },
    { name: "Description length", ok: description.length >= 70 && description.length <= 170, detail: description ? `${description.length} characters; aim for roughly 70–160` : "Add a concise description" },
    { name: "One clear H1", ok: h1.length === 1, detail: `${h1.length} H1 heading(s) found` },
    { name: "Readable page content", ok: text.length >= 300, detail: `${text.length} visible-text characters detected` },
    { name: "Images have alt text", ok: images.length === 0 || missingAlt === 0, detail: images.length ? `${missingAlt} of ${images.length} image tags lack alt text` : "No image tags detected" },
    { name: "Canonical URL", ok: !!canonical, detail: canonical || "No canonical link detected" },
    { name: "HTTPS", ok: url.protocol === "https:", detail: url.protocol === "https:" ? "HTTPS URL" : "Use HTTPS" }
  ];
  const score = Math.round(checks.filter(c => c.ok).length / checks.length * 100);
  return { url: url.href, status, contentType, title, description, canonical, h1, h2: h2.slice(0, 12), textPreview: text.slice(0, 1200), wordCount: text ? text.split(/\s+/).length : 0, linkCount: links.length, links: links.slice(0, 100), imageCount: images.length, missingAlt, score, checks };
}
async function auditWebsite(input, env) {
  const url = safeUrl(input);
  const { res, type, body, finalUrl } = await fetchPage(url);
  if (!type.includes("html") && !type.includes("text")) throw new Error(`The website did not return HTML/text (content type: ${type || "unknown"}).`);
  const result = auditHtml(body, new URL(finalUrl), res.status, type);
  result.crawl = {};
  const origin = new URL(finalUrl).origin;
  for (const path of ["/robots.txt", "/sitemap.xml"]) {
    try {
      const fetched=await fetchPage(new URL(path,origin));
      const txt=fetched.body;
      result.crawl[path]={status:fetched.res.status,found:fetched.res.ok,preview:txt.slice(0,1600)};
    } catch (e) { result.crawl[path] = { status: 0, found: false, preview: e.message }; }
  }
  // Crawl a small same-origin sample only. No login pages, forms, or non-HTML links are followed.
  const internal = [...new Set(result.links.map(l => { try { const u = new URL(l); return u.origin === origin ? u.href.split("#")[0] : null; } catch { return null; } }).filter(Boolean))].slice(0, 7);
  const pages = [];
  for (const link of internal) {
    if (link === result.url || link === finalUrl) continue;
    try {
      const fetched=await fetchPage(new URL(link));
      const ct=fetched.type;
      if(!fetched.res.ok||!ct.includes("html")) continue;
      const page=auditHtml(fetched.body,new URL(fetched.finalUrl),fetched.res.status,ct);
      pages.push({ url: page.url, status: page.status, title: page.title, description: page.description, h1: page.h1, score: page.score, wordCount: page.wordCount });
    } catch {}
  }
  result.pagesCrawled = 1 + pages.length;
  result.pages = pages;
  result.note = "This is a lightweight technical/content audit, not a Google ranking prediction. Crawl limited to the homepage and up to 7 same-origin links. Review robots.txt and site policies before expanding crawling.";
  if (env.DB) {
    try { await env.DB.prepare("INSERT INTO audits (website_url, score, result_json) VALUES (?, ?, ?)").bind(result.url, result.score, JSON.stringify(result)).run(); } catch {}
  }
  return result;
}
function campaignDraft(body) {
  const business = (body.business || "SouthyAI Technologies").slice(0, 120);
  const service = (body.service || "remote customer service and technical support").slice(0, 250);
  const audience = (body.audience || "international businesses needing reliable customer support").slice(0, 250);
  const tone = (body.tone || "professional and human").slice(0, 80);
  const offer = (body.offer || "Let's discuss a small pilot").slice(0, 180);
  return {
    linkedin: `Customer experience shouldn't stop at borders.\\n\\n${business} helps ${audience} with ${service}. We believe in responsive service, clear communication and a people-first approach.\\n\\n${offer}.\\n\\n#CustomerExperience #CustomerSupport #SouthyAI`,
    facebook: `Need a customer support partner that understands people, not just scripts?\\n\\n${business} offers ${service} for ${audience}. Our approach is ${tone}.\\n\\nMessage us to discuss a pilot and see whether we're a fit.`,
    videoScript: `VIDEO AD — 20–30 SECONDS\\n\\n[Scene 1: A busy support team / customer trying to get help]\\nVoiceover: “Every customer deserves support that listens.”\\n\\n[Scene 2: Remote agents at work, professional headset setup]\\nVoiceover: “${business} helps businesses with ${service}.”\\n\\n[Scene 3: Brand name and website on screen]\\nVoiceover: “Looking for a partner? ${offer}. Visit southyai.co.za.”\\n\\nProduction note: This is a script, not a rendered video. Use only footage, claims and capabilities you can verify.`,
    email: `Subject: A possible customer support partnership\\n\\nHello [Name],\\n\\nI’m reaching out from ${business}. We support businesses looking for ${service}.\\n\\nI thought this might be relevant to ${audience}. Would you be open to a short conversation about your current support needs and whether a small pilot could make sense?\\n\\nBest regards,\\nSouthyAI Technologies\\nsupport@southyai.co.za\\nhttps://southyai.co.za\\n\\nPlease personalise this message and confirm the recipient is an appropriate business contact before sending.`
  };
}
function constantTimeEqual(a,b) {
  if(a.length!==b.length) return false;
  let diff=0;
  for(let i=0;i<a.length;i++) diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}
async function handle(req, env) {
  const url = new URL(req.url);
  if(req.method==="GET"&&url.pathname==="/api/health") return json({ok:true,app:env.APP_NAME||"SouthyAI Growth Engine",version:"0.1.1",databaseConnected:!!env.DB,adminAuthConfigured:!!env.ADMIN_API_TOKEN});
  if(url.pathname.startsWith("/api/")) {
    const configured=String(env.ADMIN_API_TOKEN||"");
    if(configured.length<32) return json({error:"Admin API is locked. Configure ADMIN_API_TOKEN as a Worker secret with at least 32 characters."},503);
    const supplied=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
    if(!constantTimeEqual(supplied,configured)) return json({error:"Unauthorised. Enter the valid admin access token."},401);
  }
  if(req.method==="GET"&&url.pathname==="/api/auth/check") return json({ok:true,authenticated:true});
  if (req.method === "POST" && url.pathname === "/api/audit") {
    try {
      const body = await req.json();
      if (!body.url) return json({ error: "Website URL is required." }, 400);
      return json(await auditWebsite(body.url, env));
    } catch (e) { return json({ error: e.message || "Audit failed." }, 400); }
  }
  if (req.method === "POST" && url.pathname === "/api/content") {
    try { return json(campaignDraft(await req.json())); } catch (e) { return json({ error: e.message }, 400); }
  }
  if (req.method === "POST" && url.pathname === "/api/video/generate") {
    if (!env.FAL_KEY) return json({ error: "Video generation is not connected yet. Add FAL_KEY as a Cloudflare Worker secret first." }, 503);
    try {
      const b = await req.json();
      const userPrompt = String(b.prompt || "").trim();
      if (!userPrompt) return json({ error: "Describe the video you want first." }, 400);
      if (userPrompt.length > 3000) return json({ error: "Please keep the video description under 3,000 characters." }, 400);
      const duration = b.duration === "30" ? 30 : 60;
      const accent = ["South African English","British English (UK)","American English (US)","Neutral international English"].includes(b.accent) ? b.accent : "South African English";
      const orientation = b.orientation === "landscape" ? "landscape" : "portrait";
      const avatar = String(b.avatar || "auto").slice(0,100);
      let prompt = "Create a polished, cinematic business marketing video, target duration about " + duration + " seconds. Output orientation: " + orientation + ". Spoken narration should use a " + accent + " accent. Use a natural human-like AI presenter with realistic facial expressions and accurate lip sync. Include relevant cinematic B-roll, smooth scene transitions, readable on-screen captions, professional lighting, tasteful background music, and a clear closing call to action. The video should feel suitable for a professional Facebook or LinkedIn business advert. User brief: " + userPrompt;
      const input = { prompt, avatar, voice: "auto", orientation };
      if (typeof b.imageData === "string" && b.imageData.startsWith("data:image/")) {
        if (b.imageData.length > 7 * 1024 * 1024) return json({ error: "Please upload an image smaller than 5 MB." }, 413);
        input.file_urls = [b.imageData];
      }
      const r = await fetch("https://queue.fal.run/fal-ai/heygen/v3/video-agent", {
        method: "POST",
        headers: { "Authorization": "Key " + env.FAL_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(20000)
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) return json({ error: data.detail || data.message || "The video provider could not accept the request.", providerStatus: r.status }, 502);
      if (!data.request_id) return json({ error: "The video provider did not return a generation ID." }, 502);
      return json({ ok: true, requestId: data.request_id, status: "IN_QUEUE", message: "Your video is in the generation queue." }, 202);
    } catch (e) { return json({ error: e.name === "TimeoutError" ? "The video provider took too long to respond. Please try again." : (e.message || "Could not start video generation.") }, 502); }
  }
  if (req.method === "GET" && url.pathname === "/api/video/status") {
    if (!env.FAL_KEY) return json({ error: "Video generation is not connected. Add FAL_KEY as a Cloudflare Worker secret." }, 503);
    const requestId = url.searchParams.get("request_id") || "";
    if (!/^[a-zA-Z0-9-]{8,100}$/.test(requestId)) return json({ error: "A valid video request ID is required." }, 400);
    try {
      const base = "https://queue.fal.run/fal-ai/heygen/v3/video-agent/requests/" + encodeURIComponent(requestId);
      const s = await fetch(base + "/status", { headers: { "Authorization": "Key " + env.FAL_KEY }, signal: AbortSignal.timeout(12000) });
      const statusData = await s.json().catch(() => ({}));
      if (!s.ok) return json({ error: statusData.detail || "Could not check video status." }, 502);
      if (statusData.status !== "COMPLETED") return json({ status: statusData.status || "IN_PROGRESS", logs: statusData.logs || [] });
      const r = await fetch(base, { headers: { "Authorization": "Key " + env.FAL_KEY }, signal: AbortSignal.timeout(15000) });
      const result = await r.json().catch(() => ({}));
      if (!r.ok) return json({ error: result.detail || "Video finished but its download link could not be retrieved." }, 502);
      const videoUrl = result.video?.url || result.data?.video?.url;
      if (!videoUrl) return json({ error: "The provider completed the job but returned no video file." }, 502);
      return json({ status: "COMPLETED", videoUrl });
    } catch (e) { return json({ error: e.message || "Could not retrieve video status." }, 502); }
  }
  if (req.method === "GET" && url.pathname === "/api/audits") {
    if (!env.DB) return json({ error: "D1 is not connected yet. The dashboard works, but saving reports needs D1." }, 503);
    try {
      const { results } = await env.DB.prepare("SELECT id, website_url, created_at, score FROM audits ORDER BY id DESC LIMIT 25").all();
      return json({ audits: results || [] });
    } catch { return json({ error: "Database tables are not ready. Run schema.sql in your D1 database." }, 503); }
  }
  if (req.method === "POST" && url.pathname === "/api/leads") {
    if (!env.DB) return json({ error: "D1 is not connected yet. Connect D1 to save leads." }, 503);
    try {
      const b = await req.json();
      if (!b.company) return json({ error: "Company name is required." }, 400);
      await env.DB.prepare("INSERT INTO leads (company, website, contact_name, contact_email, source_url, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(String(b.company).slice(0,200), String(b.website||"").slice(0,500), String(b.contact_name||"").slice(0,200), String(b.contact_email||"").slice(0,250), String(b.source_url||"").slice(0,500), String(b.notes||"").slice(0,2000), String(b.status||"New").slice(0,60)).run();
      return json({ ok: true });
    } catch (e) { return json({ error: "Could not save lead. Check that schema.sql has been run." }, 500); }
  }
  if (req.method === "GET" && url.pathname === "/api/leads") {
    if (!env.DB) return json({ error: "Connect D1 and run schema.sql to use the lead database." }, 503);
    try { const { results } = await env.DB.prepare("SELECT * FROM leads ORDER BY id DESC LIMIT 200").all(); return json({ leads: results || [] }); }
    catch { return json({ error: "Lead table missing. Run schema.sql in D1." }, 503); }
  }
  if (req.method === "GET" && url.pathname === "/") return new Response(HTML, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "strict-origin-when-cross-origin", "x-frame-options": "DENY", "permissions-policy": "camera=(), microphone=(), geolocation=()" } });
  return json({ error: "Not found" }, 404);
}
export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "allow": "GET,POST,OPTIONS", "cache-control": "no-store" } });
    try { return await handle(request, env); }
    catch (e) { return json({ error: "Unexpected error", detail: e.message }, 500); }
  }
};
