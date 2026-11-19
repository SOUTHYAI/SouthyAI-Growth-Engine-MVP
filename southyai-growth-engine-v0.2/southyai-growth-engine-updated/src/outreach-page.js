// The /outreach page: approve drafts, send, and watch conversations.
export const OUTREACH_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SouthyAI Outreach</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;margin:0;background:#f4f5f8;color:#14213d}
main{max-width:860px;margin:0 auto;padding:16px}
h1{font-size:22px;margin:8px 0}h2{font-size:18px;margin:22px 0 8px}
.card{background:#fff;border-radius:12px;padding:14px;margin:12px 0;box-shadow:0 1px 3px rgba(0,0,0,.08)}
input,textarea{width:100%;box-sizing:border-box;padding:9px;border:1px solid #cbd2e0;border-radius:8px;font:inherit;margin:6px 0}
textarea{min-height:150px}
button{background:#14213d;color:#fff;border:0;border-radius:8px;padding:10px 14px;font:inherit;margin:4px 6px 4px 0;cursor:pointer}
button.alt{background:#e6e9f2;color:#14213d}
.muted{color:#5b6477;font-size:14px}.msg{white-space:pre-wrap;border-left:3px solid #cbd2e0;padding-left:10px;margin:8px 0}
.in{border-color:#2a9d8f}.tag{display:inline-block;background:#e6e9f2;border-radius:99px;padding:2px 10px;font-size:13px;margin-left:6px}
#status{position:sticky;top:0;background:#fff7d6;padding:8px 12px;border-radius:8px;display:none;margin:8px 0}
</style></head><body><main>
<h1>SouthyAI Outreach</h1>
<div id="status"></div>
<div class="card">
  <strong>Quick test</strong>
  <div class="muted">Send a test email to yourself, then reply to it and watch the AI answer below.</div>
  <input id="testTo" type="email" placeholder="your personal email address">
  <button id="testBtn">Send test email</button>
</div>
<h2>Drafts waiting for you</h2>
<div id="drafts" class="muted">Loading...</div>
<div class="card"><button id="sendBtn">Send all approved emails now</button>
<span class="muted">They also go out automatically each morning, up to the daily limit.</span></div>
<h2>Conversations</h2>
<div id="convs" class="muted">Loading...</div>
</main>
<script>
var token = sessionStorage.getItem("tok") || "";
function say(t){var s=document.getElementById("status");s.textContent=t;s.style.display=t?"block":"none";}
async function api(path,opts){
  if(!token){token=prompt("Enter your admin access token")||"";sessionStorage.setItem("tok",token);}
  opts=opts||{};opts.headers={"Authorization":"Bearer "+token,"content-type":"application/json"};
  var r=await fetch(path,opts);var d=await r.json().catch(function(){return{};});
  if(r.status===401){sessionStorage.removeItem("tok");token="";throw new Error("Wrong access token. Refresh the page and try again.");}
  if(!r.ok)throw new Error(d.error||"Something went wrong.");return d;
}
function el(tag,text,cls){var e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
async function loadDrafts(){
  var box=document.getElementById("drafts");
  try{var d=await api("/api/outreach/drafts");box.textContent="";
    if(!d.drafts.length){box.textContent="No drafts waiting. New ones appear after the morning search.";return;}
    d.drafts.forEach(function(x){
      var c=el("div","","card");
      var h=el("strong",x.company);c.appendChild(h);
      var a=el("a"," "+x.website);a.href=x.website;a.target="_blank";a.rel="noopener";c.appendChild(a);
      var em=el("input");em.type="email";em.placeholder="Contact email (leave blank and I'll try to find one)";em.value=x.email;c.appendChild(em);
      var ta=el("textarea");ta.value=x.text;c.appendChild(ta);
      var ok=el("button","Approve");var no=el("button","Skip","alt");
      ok.onclick=async function(){try{await api("/api/outreach/approve",{method:"POST",body:JSON.stringify({id:x.id,email:em.value,text:ta.value})});c.remove();say("Approved. Press Send when you're ready.");}catch(e){say(e.message);}};
      no.onclick=async function(){try{await api("/api/outreach/skip",{method:"POST",body:JSON.stringify({id:x.id})});c.remove();}catch(e){say(e.message);}};
      c.appendChild(ok);c.appendChild(no);box.appendChild(c);
    });
  }catch(e){box.textContent=e.message;}
}
async function loadConvs(){
  var box=document.getElementById("convs");
  try{var d=await api("/api/outreach/conversations");box.textContent="";
    if(!d.conversations.length){box.textContent="No conversations yet.";return;}
    d.conversations.forEach(function(c){
      var card=el("div","","card");
      var h=el("strong",c.email);card.appendChild(h);card.appendChild(el("span",c.status,"tag"));
      card.appendChild(el("div",c.subject||"","muted"));
      c.messages.forEach(function(m){card.appendChild(el("div",(m.direction==="in"?"Prospect: ":"AI: ")+m.body,"msg "+(m.direction==="in"?"in":"")));});
      if(c.status!=="Active"&&c.status!=="Opted out"){var b=el("button","Give back to the AI","alt");b.onclick=async function(){try{await api("/api/outreach/reopen",{method:"POST",body:JSON.stringify({id:c.id})});loadConvs();}catch(e){say(e.message);}};card.appendChild(b);}
      box.appendChild(card);
    });
  }catch(e){box.textContent=e.message;}
}
document.getElementById("testBtn").onclick=async function(){
  var to=document.getElementById("testTo").value;say("Sending test...");
  try{await api("/api/outreach/test-email",{method:"POST",body:JSON.stringify({to:to})});say("Test sent to "+to+". Check your inbox, reply to it, then refresh this page.");loadConvs();}catch(e){say(e.message);}
};
document.getElementById("sendBtn").onclick=async function(){
  say("Sending approved emails (this can take a minute)...");
  try{var d=await api("/api/outreach/send-now",{method:"POST",body:"{}"});
    say("Sent: "+d.sent.length+". Need an email address: "+d.needsEmail.length+". Skipped: "+d.skipped+(d.errors.length?". Errors: "+d.errors.join(" | "):"")+".");loadDrafts();loadConvs();}
  catch(e){say(e.message);}
};
loadDrafts();loadConvs();
</script></body></html>`;
