L.forEach((x,i) => x.id = "l" + i);
const KEY = "glaubenswissen-v2";
const INTERVAL = {1:1, 2:3, 3:7, 4:14, 5:30};
let S = { done:{}, day:"", today:{}, hist:{}, read:{}, notes:{}, drafts:{}, cards:{}, prefs:{} };
try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s && typeof s === "object") S = Object.assign(S, s); } catch(e) {}
["done","today","hist","read","notes","drafts","cards","prefs"].forEach(k => { if (!S[k] || typeof S[k] !== "object") S[k] = {}; });
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e) {} askPersist(); };
let persistAsked = false;
function askPersist(){ if (persistAsked) return; persistAsked = true; try { if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => p || navigator.storage.persist()).catch(() => {}); } catch(e) {} }
const ds = d => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0,10); };
const TODAY = ds(new Date());
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return ds(d); };
const dayAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
if (S.day !== TODAY) { S.day = TODAY; S.today = {}; }
L.forEach(x => { if (S.done[x.id] && !S.cards[x.id]) S.cards[x.id] = {b:1, due:TODAY}; });
save();

const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const strip = s => String(s).replace(/<[^>]+>/g, "");
const B = k => BLOCKS.find(b => b.k === k);
const GG = k => GROUPS.find(g => g.k === k);
const LS = id => L.find(x => x.id === id);
const SS = id => ST.find(x => x.id === id);
const hfa = s => BIBLE + s + ".HFA";
const DAYN = Math.floor(Date.parse(TODAY) / 864e5);
const storyOfDay = ST[DAYN % ST.length];
const lessonOfDay = L[(DAYN * 7) % L.length];
const syncHist = () => { S.hist[TODAY] = Object.keys(S.today).length; save(); };
const mark = k => { S.today[k] = 1; syncHist(); };
function streak(){ let n = 0, i = (S.hist[TODAY] || 0) > 0 ? 0 : 1; while ((S.hist[ds(dayAgo(i))] || 0) > 0) { n++; i++; } return n; }
const dueCards = () => Object.entries(S.cards).filter(([id,c]) => LS(id) && c.due <= TODAY).map(([id]) => id);
const nextLesson = () => L.find(x => !S.done[x.id]);
const nextStory = () => ST.find(x => !S.read[x.id]);

/* Icons */
const I = {
  share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v13"/><path d="M7 8l5-5 5 5"/><path d="M5 14v6h14v-6"/></svg>',
  ext:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v6H4V6h6"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>',
  pause:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
  mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v4"/></svg>',
  copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>'
};

/* Einstellungen anwenden */
function applyPrefs(){
  const r = document.documentElement, p = S.prefs;
  if (p.theme === "light" || p.theme === "dark") r.setAttribute("data-theme", p.theme); else if (p.themeSet) r.removeAttribute("data-theme");
  r.style.setProperty("--fs", (p.fs || 16) + "px");
}
applyPrefs();

/* Toast */
let toastT;
function toast(msg){ let t = document.getElementById("toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role","status"); document.body.appendChild(t); } t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600); }
async function copyText(text, okMsg){
  try { await navigator.clipboard.writeText(text); toast(okMsg || "Kopiert"); return true; }
  catch(e) { const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly",""); ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch(_) {} ta.remove(); toast(ok ? (okMsg || "Kopiert") : "Kopieren ging nicht. Bitte Text markieren und von Hand kopieren."); return ok; }
}
const pageUrl = h => location.href.split("#")[0] + "#" + h;
async function share(title, text, h){
  const url = pageUrl(h);
  if (navigator.share) { try { await navigator.share({title, text, url}); return; } catch(e) { if (e && e.name === "AbortError") return; } }
  copyText(title + "\n" + url, "Link kopiert");
}

/* Einleitungs-Vorlage */
const PARTS = [
 ["ein","Einstieg","Bild oder Frage aus dem Alltag","Z. B.: Kennt ihr das, wenn …"],
 ["spi","Spiegel","2–3 Fragen, dann Pause aushalten","Fragen an die Zuhörer. Nach jeder Frage 3–5 Sekunden still sein."],
 ["wen","Wendepunkt","Dich selbst einschließen","Ich stehe hier selbst mittendrin …"],
 ["hof","Hoffnung","Was Gott verspricht","Welche Zusage steckt in diesem Text?"],
 ["ueb","Überleitung","Hin zur Predigt","Lasst uns hören, was Gott uns sagen will."]
];
const tpl = x => x ? { ein:"", spi:x.q + "\n(Pause)\n", wen:"Ich stehe hier nicht als einer, der das alles schon kann. Ich stehe selbst mittendrin.", hof:x.k, ueb:"Lasst uns hören, was Gott uns in " + x.r + " sagen will." }
                   : { title:"", ein:"", spi:"", wen:"", hof:"", ueb:"Lasst uns hören, was Gott uns sagen will." };
const words = d => PARTS.reduce((n,p) => n + String(d[p[0]] || "").replace(/\(Pause\)/g,"").trim().split(/\s+/).filter(Boolean).length, 0);
const pauses = d => PARTS.reduce((n,p) => n + (String(d[p[0]] || "").match(/\(Pause\)/g) || []).length, 0);
const secs = d => Math.round(words(d) / 130 * 60 + pauses(d) * 4);
const mmss = s => Math.floor(s/60) + ":" + String(Math.floor(s%60)).padStart(2,"0");
const draftTitle = (id, d) => { const x = SS(id); return x ? x.t : (d.title || "Freie Einleitung"); };
const draftText = (id, d) => { const x = SS(id); return (x ? x.t + " (" + x.r + ")" : (d.title || "Einleitung")) + "\n\n" + PARTS.map(p => p[1].toUpperCase() + "\n" + String(d[p[0]] || "").trim()).join("\n\n"); };

/* Routing */
const app = document.getElementById("app");
let lastRoute = null, cleanup = [];
const route = () => decodeURIComponent((location.hash || "").slice(1)) || "start";
function go(h){ if (route() === h) render(true); else location.hash = h; }
function section(r){ if (/^(lernen|thema-|lektion-|ueben)/.test(r)) return "lernen"; if (/^geschichte/.test(r)) return "geschichten"; if (/^(einleitung|vortrag)/.test(r)) return "einleitungen"; if (r === "start") return "start"; return ""; }
window.addEventListener("hashchange", () => render(true));

/* Seiten */
const kpi = (l, v, sub, pct, cls, href) => `<a class="kpi ${cls||""}" href="#${href}"><span class="l">${l}</span><span class="v">${v}${sub ? `<small> ${sub}</small>` : ""}</span>${pct == null ? "" : `<span class="bar"><i style="width:${pct}%"></i></span>`}</a>`;

function pStart(){
  const n = L.filter(x => S.done[x.id]).length, rd = ST.filter(x => S.read[x.id]).length, dr = Object.keys(S.drafts).length, st = streak(), due = dueCards().length;
  const nx = nextLesson(), ns = nextStory(), g = GG(storyOfDay.g), td = Object.keys(S.today).length;
  const hr = new Date().getHours(), hi = hr < 11 ? "Guten Morgen" : hr < 18 ? "Schön, dass du da bist" : "Guten Abend";
  return `<div class="eyebrow">${new Date().toLocaleDateString("de-DE",{weekday:"long", day:"numeric", month:"long"})}</div>
  <h1>${hi}.</h1><p class="lead">Lernen, lesen, forschen und Einleitungen vorbereiten, an einem Ort.</p>
  <form class="qs" id="qs" role="search"><label class="sr" for="qsi">Was beschäftigt dich?</label><input class="input big" id="qsi" type="search" placeholder="Was beschäftigt dich? z. B. Angst, Zweifel, Geld" autocomplete="off" enterkeyhint="search"><button class="btn primary" type="submit">Suchen</button></form>
  <div class="tchips" style="margin:-4px 0 14px">${["angst","selbstwert","gebet","zweifel","geld","tod"].map(k => TP(k)).filter(Boolean).map(t => `<a class="chip" href="#frage-${t.k}">${esc(t.n)}</a>`).join("")}<a class="chip" href="#suche">Alle Themen ›</a></div>
  <div class="hero"><span class="lbl">Merksatz des Tages · ${esc(B(lessonOfDay.b).n)}</span><p class="quote">${esc(lessonOfDay.m)}</p><a class="src" href="#lektion-${lessonOfDay.id}">Lektion „${esc(lessonOfDay.t)}“ ›</a></div>
  <div class="kpis">${kpi("Lektionen", n, "/ " + L.length, Math.round(100*n/L.length), "", "lernen")}${kpi("Geschichten", rd, "/ " + ST.length, Math.round(100*rd/ST.length), "", "geschichten")}${kpi("Serie", st, st === 1 ? "Tag" : "Tage", null, "gold", "start")}${kpi("Einleitungen", dr, "", null, "", "einleitungen")}</div>
  <div class="grid" style="margin-top:10px">
    <div class="card"><div class="card-h"><span>Heute</span><span class="num">${td} / 3</span></div>
      <div class="routine">${ROUTINE.map(r => `<label class="${S.today[r.id] ? "on" : ""}"><input type="checkbox" id="r-${r.id}" data-r="${r.id}" ${S.today[r.id] ? "checked" : ""}><span class="ic">${S.today[r.id] ? "✅" : r.ic}</span>${esc(r.n)}</label>`).join("")}</div>
      ${nx ? `<a class="go" href="#lektion-${nx.id}"><span class="t"><small>Weiter lernen · ${esc(B(nx.b).n)}</small><b>${esc(nx.t)}</b></span><span aria-hidden="true">›</span></a>` : `<p style="color:var(--good);font-weight:700">Alle Lektionen geschafft. Jetzt wiederholen und weitergeben.</p>`}
      ${due ? `<a class="btn" href="#ueben">🔁 ${due} ${due === 1 ? "Karte" : "Karten"} wiederholen</a>` : ""}
    </div>
    <div class="card" style="--c:${g.c}"><div class="card-h"><span>Geschichte des Tages</span><span class="dot"></span></div>
      <div><div style="font-family:var(--f-head);font-weight:700;font-size:1.15rem">${esc(storyOfDay.t)}</div><div style="color:var(--quiet);font-size:.88rem">${esc(storyOfDay.r)}</div></div>
      <p>${esc(storyOfDay.k)}</p>
      <div class="row"><a class="btn sm" href="#geschichte-${storyOfDay.id}">Öffnen</a><a class="btn sm ghost" href="${hfa(storyOfDay.u[0])}" target="_blank" rel="noopener">Bibeltext ${I.ext}</a></div>
    </div>
    <div class="card"><div class="card-h"><span>Letzte 7 Tage</span><span>Routine</span></div>
      <div class="week" role="img" aria-label="Routine-Punkte der letzten 7 Tage">${[6,5,4,3,2,1,0].map(i => { const d = dayAgo(i), v = Math.min(3, S.hist[ds(d)] || 0); return `<div class="d ${i===0?"today":""}"><div class="col"><i style="height:${Math.round(100*v/3)}%"></i></div><span>${d.toLocaleDateString("de-DE",{weekday:"short"}).replace(".","")}</span></div>`; }).join("")}</div>
      ${ns ? `<a class="item" href="#geschichte-${ns.id}" style="--c:${GG(ns.g).c}"><span class="dot"></span><span class="tx"><span class="rf">Nächste Geschichte auf deiner Lesereise</span><span class="tt">${esc(ns.t)}</span></span><span class="chev">›</span></a>` : ""}
    </div>
  </div>`;
}

function pLernen(){
  const n = L.filter(x => S.done[x.id]).length, due = dueCards().length, total = Object.keys(S.cards).length;
  const bx = [1,2,3,4,5].map(b => Object.values(S.cards).filter(c => c.b === b).length);
  let h = `<h1>Lernen</h1><p class="lead">${L.length} Lektionen in ${BLOCKS.length} Themen. Was du verstanden hast, kommt in deine Karteikarten und wird zum richtigen Zeitpunkt wiederholt.</p>
  <div class="grid">
    <div class="card"><div class="card-h"><span>Fortschritt</span><span class="num">${Math.round(100*n/L.length)}%</span></div>
      <div style="font-size:1.6rem;font-weight:700" class="num">${n}<span style="color:var(--quiet);font-size:1rem"> / ${L.length} Lektionen</span></div><div class="bar"><i style="width:${Math.round(100*n/L.length)}%"></i></div>
      ${nextLesson() ? `<a class="go" href="#lektion-${nextLesson().id}"><span class="t"><small>Als Nächstes</small><b>${esc(nextLesson().t)}</b></span><span aria-hidden="true">›</span></a>` : ""}
    </div>
    <div class="card"><div class="card-h"><span>Karteikarten</span><span>${due} fällig</span></div>
      <div class="boxes">${bx.map((v,i) => `<div><b>${v}</b>Stufe ${i+1}</div>`).join("")}</div>
      ${total ? (due ? `<a class="btn primary" href="#ueben">Jetzt ${due} ${due === 1 ? "Karte" : "Karten"} üben</a>` : `<p style="color:var(--quiet)">Für heute alles wiederholt. Morgen geht es weiter.</p>`) : `<p style="color:var(--quiet)">Markiere eine Lektion als verstanden, dann landet ihre Frage hier.</p>`}
    </div>
  </div><h2>Themen</h2><div class="grid">`;
  BLOCKS.forEach(b => { const it = L.filter(x => x.b === b.k), d = it.filter(x => S.done[x.id]).length, p = Math.round(100*d/it.length);
    h += `<a class="card topic" href="#thema-${b.k}" style="--c:${b.c}"><span class="r1"><span class="ic">${b.ic}</span><span class="n">${esc(b.n)}</span><span class="pct">${p}%</span></span><span class="bar"><i style="width:${p}%"></i></span><span class="m">${d} von ${it.length} Lektionen${d === it.length ? " · fertig ✓" : ""}</span></a>`; });
  return h + `</div>`;
}

function pThema(k){
  const b = B(k); if (!b) return p404();
  const it = L.filter(x => x.b === k), d = it.filter(x => S.done[x.id]).length;
  return `<a class="back" href="#lernen">‹ Lernen</a><div style="--c:${b.c}"><div class="eyebrow"><span class="dot"></span>${d} von ${it.length} gelernt</div><h1>${b.ic} ${esc(b.n)}</h1></div>
  <div class="stack" style="margin-top:12px">${it.map((x,i) => `<a class="item ${S.done[x.id] ? "done" : ""}" href="#lektion-${x.id}"><span class="no">${S.done[x.id] ? "✓" : i+1}</span><span class="tx"><span class="tt">${esc(x.t)}</span><span class="rf">${esc(x.m)}</span></span><span class="chev">›</span></a>`).join("")}</div>`;
}

let showA = false;
function pLektion(id){
  const x = LS(id); if (!x) return p404();
  const b = B(x.b), it = L.filter(y => y.b === x.b), i = it.indexOf(x), gi = L.indexOf(x), nx = L[gi+1];
  return `<a class="back" href="#thema-${b.k}">‹ ${esc(b.n)}</a>
  <div class="stack" style="--c:${b.c}"><div><div class="eyebrow"><span class="dot"></span>${esc(b.n)} · Lektion ${i+1} von ${it.length}</div><h1>${esc(x.t)}</h1></div>
  <div class="merk"><span class="lbl">Merksatz</span><p>${esc(x.m)}</p></div>
  <ol class="points">${x.p.map(p => `<li>${p}</li>`).join("")}</ol>
  <div><span class="lbl r">Bibelstellen · Hoffnung für alle</span><div class="refs">${x.r.map(r => `<a href="${refUrl(r)}" target="_blank" rel="noopener">${esc(r)}</a>`).join("")}</div></div>
  <div class="test"><span class="lbl q">Selbsttest</span><p class="qq">${esc(x.q)}</p>${showA ? `<p class="ans">✅ ${esc(x.a)}</p>` : `<button class="btn sm" id="reveal">Antwort zeigen</button>`}</div>
  <div class="row">${S.done[x.id] ? `<button class="btn" id="undo">Nochmal lernen</button>` : `<button class="btn good" id="ok">✓ Verstanden</button>`}${nx ? `<a class="btn primary" href="#lektion-${nx.id}">Weiter ›</a>` : `<a class="btn primary" href="#lernen">Fertig</a>`}</div></div>`;
}

let Q = [], qi = 0, qShow = false, qDone = 0, qRetry = {};
function startQueue(){ Q = dueCards().sort(() => Math.random() - .5); qi = 0; qShow = false; qDone = 0; qRetry = {}; }
function pUeben(){
  if (lastRoute !== "ueben") startQueue();
  if (qi >= Q.length) {
    return `<a class="back" href="#lernen">‹ Lernen</a><h1>${qDone ? "Geschafft." : "Nichts fällig."}</h1>
    <p class="lead">${qDone ? `Du hast ${qDone} ${qDone === 1 ? "Karte" : "Karten"} wiederholt. Die nächsten kommen, wenn sie fällig sind.` : "Heute ist keine Karte fällig. Lerne eine neue Lektion oder schau morgen wieder vorbei."}</p>
    <div class="row"><a class="btn primary" href="#start">Zur Startseite</a><a class="btn" href="#lernen">Lernen</a></div>`;
  }
  const x = LS(Q[qi]), c = S.cards[x.id], b = B(x.b);
  return `<a class="back" href="#lernen">‹ Lernen</a>
  <div class="eyebrow">Karte ${qi+1} von ${Q.length} · Stufe ${c.b}</div><div class="bar" style="margin-bottom:14px"><i style="width:${Math.round(100*qi/Q.length)}%;background:var(--gold)"></i></div>
  <div class="flash" style="--c:${b.c}"><div class="eyebrow"><span class="dot"></span>${esc(b.n)} · ${esc(x.t)}</div><p class="q">${esc(x.q)}</p>
  ${qShow ? `<p class="a">${esc(x.a)}</p>` : ""}</div>
  <div class="row" style="margin-top:12px">${qShow ? `<button class="btn" id="qNo">Nochmal</button><button class="btn good" id="qYes">✓ Gewusst</button>` : `<button class="btn primary" id="qShow">Antwort zeigen</button>`}</div>
  <p style="color:var(--quiet);font-size:.85rem;margin-top:10px">Gewusst: Die Karte kommt später wieder (1, 3, 7, 14, dann 30 Tage). Nochmal: Sie kommt in dieser Runde noch einmal.</p>`;
}

let FG = "", FQ = "";
function pGeschichten(){
  const rd = ST.filter(x => S.read[x.id]).length, nn = Object.keys(S.notes).length, ns = nextStory();
  return `<h1>Bibelgeschichten</h1><p class="lead">${ST.length} Geschichten von der Schöpfung bis zur neuen Erde. Jede führt direkt zum Bibeltext in Hoffnung für alle.</p>
  <div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="kpi"><span class="l">Gelesen</span><span class="v">${rd}<small> / ${ST.length}</small></span><span class="bar"><i style="width:${Math.round(100*rd/ST.length)}%"></i></span></div>
  <div class="kpi"><span class="l">Notizen</span><span class="v">${nn}</span><span class="s">erforscht</span></div><div class="kpi gold"><span class="l">Gruppen</span><span class="v">${GROUPS.length}</span><span class="s">AT + NT</span></div></div>
  ${ns ? `<a class="go" style="margin-top:10px" href="#geschichte-${ns.id}"><span class="t"><small>Lesereise · weiter mit</small><b>${esc(ns.t)}</b></span><span aria-hidden="true">›</span></a>` : ""}
  <div style="margin-top:14px"><label class="sr" for="fq">Geschichten durchsuchen</label><input class="input" id="fq" type="search" placeholder="Person, Ort, Thema oder Bibelstelle" value="${esc(FQ)}" autocomplete="off"></div>
  <div class="chips" role="group" aria-label="Nach Gruppe filtern"><button class="chip ${FG===""?"on":""}" data-g="" aria-pressed="${FG===""}">Alle</button>${GROUPS.map(g => `<button class="chip ${FG===g.k?"on":""}" data-g="${g.k}" aria-pressed="${FG===g.k}" style="--c:${g.c}"><span class="dot"></span>${esc(g.n)}</button>`).join("")}</div>
  <div id="slist"></div>`;
}
const storyItem = x => `<a class="item" href="#geschichte-${x.id}" style="--c:${GG(x.g).c}"><span class="dot"></span><span class="tx"><span class="tt">${esc(x.t)}</span><span class="rf">${esc(x.r)}${S.notes[x.id] ? " · 📝" : ""}${S.drafts[x.id] ? " · 🎤" : ""}</span></span>${S.read[x.id] ? '<span class="ck" aria-label="gelesen">✓</span>' : '<span class="chev">›</span>'}</a>`;
function drawStories(){
  const el = document.getElementById("slist"); if (!el) return;
  const q = FQ.trim().toLowerCase();
  const it = ST.filter(x => (!FG || x.g === FG) && (!q || (x.t + " " + x.r + " " + x.s + " " + x.k).toLowerCase().includes(q)));
  if (!it.length) { el.innerHTML = `<p class="empty">Keine Geschichte gefunden. Versuch einen Namen wie „Petrus“ oder ein Buch wie „Daniel“.</p>`; return; }
  el.innerHTML = GROUPS.map(g => { const gi = it.filter(x => x.g === g.k); if (!gi.length) return ""; const r = gi.filter(x => S.read[x.id]).length;
    return `<h2><span class="dot" style="--c:${g.c}"></span>${esc(g.n)} <small>${r} von ${gi.length} gelesen</small></h2><div class="list">${gi.map(storyItem).join("")}</div>`; }).join("");
}

function pGeschichte(id){
  const x = SS(id); if (!x) return p404();
  const g = GG(x.g), i = ST.indexOf(x), pv = ST[i-1], nx = ST[i+1];
  return `<a class="back" href="#geschichten">‹ Alle Geschichten</a>
  <div class="stack" style="--c:${g.c}"><div><div class="eyebrow"><span class="dot"></span>${esc(g.n)} · ${i+1} von ${ST.length}</div><h1>${esc(x.t)}</h1></div>
  <div class="stack" style="gap:6px">${x.u.map((s,k) => `<a class="readlink" href="${hfa(s)}" target="_blank" rel="noopener"><span class="t">📖 ${x.u.length > 1 ? "Teil " + (k+1) + " lesen" : "Bibeltext lesen"}<small>${esc(segText(s, true))} · Hoffnung für alle</small></span>${I.ext}</a>`).join("")}</div>
  <div class="box"><span class="lbl q">Kurz erzählt</span><p>${esc(x.s)}</p></div>
  <div class="merk"><span class="lbl">Kernbotschaft</span><p>${esc(x.k)}</p></div>
  <div class="test"><span class="lbl q">Frage an uns heute</span><p class="qq" style="margin:0">${esc(x.q)}</p></div>
  <details class="research"><summary>Forschen: 6 Fragen an den Text</summary><ol><li>Was passiert direkt davor und danach?</li><li>Wer handelt, wer redet, wer schweigt?</li><li>Was wiederholt sich? Welche Wörter fallen auf?</li><li>Was zeigt der Text über Gott?</li><li>Was zeigt er über den Menschen, über mich?</li><li>Wo zeigt die Geschichte auf Jesus?</li></ol></details>
  <div class="field"><label for="note"><span>Meine Notizen</span><small id="noteSaved">${S.notes[x.id] ? "gespeichert" : "nur auf diesem Gerät"}</small></label><textarea id="note" placeholder="Was fällt dir auf? Personen, Orte, Querverweise, Fragen, Ideen für die Predigt …">${esc(S.notes[x.id] || "")}</textarea></div>
  <div class="row"><button class="btn ${S.read[x.id] ? "" : "good"}" id="readT">${S.read[x.id] ? "Als ungelesen markieren" : "✓ Gelesen"}</button><a class="btn primary" href="#einleitung-${x.id}">${I.mic}${S.drafts[x.id] ? "Einleitung öffnen" : "Einleitung bauen"}</a><button class="btn ghost" id="shareS">${I.share}Teilen</button></div>
  <div class="pager">${pv ? `<a class="btn sm" href="#geschichte-${pv.id}"><span>‹ ${esc(pv.t)}</span></a>` : "<span></span>"}${nx ? `<a class="btn sm" href="#geschichte-${nx.id}"><span>${esc(nx.t)} ›</span></a>` : ""}</div></div>`;
}

function pEinleitungen(){
  const list = Object.entries(S.drafts).sort((a,b) => (b[1].u||0) - (a[1].u||0));
  return `<h1>Einleitungen</h1><p class="lead">In fünf Teilen zu einer Einleitung von etwa fünf Minuten. Danach im Vortragsmodus mit Stoppuhr üben.</p>
  <div class="grid"><div class="card"><div class="card-h"><span>Neue Einleitung</span></div>
    <label for="pick" style="font-weight:700">Zu welcher Geschichte?</label>
    <select class="input" id="pick"><option value="">Geschichte wählen …</option>${GROUPS.map(g => `<optgroup label="${esc(g.n)}">${ST.filter(x => x.g === g.k).map(x => `<option value="${x.id}">${esc(x.t)} (${esc(x.r)})</option>`).join("")}</optgroup>`).join("")}</select>
    <div class="row"><button class="btn primary" id="startI">Starten</button><button class="btn" id="freeI">Ohne Geschichte</button></div></div>
    <div class="card"><div class="card-h"><span>Der Aufbau</span></div><ol class="points">${PARTS.map(p => `<li><b>${p[1]}:</b> ${esc(p[2])}.</li>`).join("")}</ol></div></div>
  <h2>Meine Einleitungen <small>${list.length}</small></h2>
  ${list.length ? `<div class="list">${list.map(([id,d]) => { const x = SS(id); return `<a class="item" href="#einleitung-${id}" style="--c:${x ? GG(x.g).c : "var(--gold)"}"><span class="dot"></span><span class="tx"><span class="tt">${esc(draftTitle(id,d))}</span><span class="rf">${words(d)} Wörter · ca. ${mmss(secs(d))} Min. · ${new Date(d.u || Date.now()).toLocaleDateString("de-DE")}</span></span><span class="chev">›</span></a>`; }).join("")}</div>`
  : `<p class="empty">Noch keine Einleitung. Wähl oben eine Geschichte und leg los. Alles wird automatisch auf diesem Gerät gespeichert.</p>`}`;
}

let armed = "";
function pEinleitung(id){
  const x = SS(id); if (!x && !S.drafts[id]) return p404();
  const d = S.drafts[id] || tpl(x);
  return `<a class="back" href="${x ? "#geschichte-" + x.id : "#einleitungen"}">‹ ${x ? esc(x.t) : "Einleitungen"}</a>
  <div class="stack"><div><div class="eyebrow">Einleitung zur Predigt${x ? " · " + esc(x.r) : ""}</div><h1>${x ? esc(x.t) : esc(d.title || "Freie Einleitung")}</h1></div>
  ${x ? `<div class="box"><span class="lbl q">Zur Erinnerung</span><p>${esc(x.s)}</p><p style="margin-top:8px"><b>Kern:</b> ${esc(x.k)}</p><p style="margin-top:8px"><a href="${hfa(x.u[0])}" target="_blank" rel="noopener">Bibeltext lesen ↗</a></p></div>`
      : `<div class="field"><label for="ititle"><span>Titel</span></label><input class="input" id="ititle" placeholder="Worum geht es?" value="${esc(d.title || "")}"></div>`}
  ${PARTS.map((p,i) => `<div class="field"><label for="p-${p[0]}"><span><span class="pn">${i+1}</span>${p[1]}</span><small>${esc(p[2])}</small></label><textarea id="p-${p[0]}" data-p="${p[0]}" placeholder="${esc(p[3])}">${esc(d[p[0]] || "")}</textarea></div>`).join("")}
  <p style="color:var(--quiet);font-size:.88rem;margin:0">Tipp: Schreib <b>(Pause)</b> in eine eigene Zeile. Im Vortragsmodus wird daraus ein Hinweis, kurz still zu sein.</p>
  <div class="status num" id="meta">${words(d)} Wörter · ca. ${mmss(secs(d))} Min. gesprochen</div>
  <div class="row"><a class="btn primary" href="#vortrag-${id}">${I.play}Vortragsmodus</a><button class="btn" id="copyI">${I.copy}Text kopieren</button><button class="btn ghost" id="shareI">${I.share}Teilen</button></div>
  <button class="btn ${armed === id ? "danger" : "ghost"}" id="delI">${armed === id ? "Wirklich löschen? Nochmal tippen" : (x ? "Auf Vorlage zurücksetzen" : "Einleitung löschen")}</button></div>`;
}

let T = {acc:0, start:0, run:false}, tInt = null, wake = null;
const tNow = () => T.acc + (T.run ? (Date.now() - T.start) / 1000 : 0);
function pVortrag(id){
  const x = SS(id), d = S.drafts[id] || (x ? tpl(x) : null); if (!d) return p404();
  if (lastRoute !== "vortrag-" + id) { T = {acc:0, start:0, run:false}; }
  const body = s => esc(String(s || "").trim()).split(/\n{2,}/).map(par => `<p>${par.replace(/\(Pause\)/g, '<span class="pause">Pause · 3–5 Sek.</span>')}</p>`).join("");
  const sc = S.prefs.talk || 1.3, target = Math.max(60, secs(d));
  return `<a class="back no-print" href="#einleitung-${id}">‹ Bearbeiten</a>
  <div class="timer no-print"><span class="clock" id="clock" aria-live="off">${mmss(tNow())}</span><span style="color:var(--quiet);font-size:.85rem" class="num">Ziel ${mmss(target)}</span>
  <button class="ibtn" id="tGo" aria-label="${T.run ? "Stoppuhr anhalten" : "Stoppuhr starten"}">${T.run ? I.pause : I.play}</button><button class="ibtn" id="tReset" aria-label="Stoppuhr zurücksetzen">↺</button>
  <button class="ibtn" id="aMinus" aria-label="Schrift kleiner">A-</button><button class="ibtn" id="aPlus" aria-label="Schrift größer">A+</button></div>
  <h1>${esc(draftTitle(id,d))}</h1>${x ? `<p style="color:var(--quiet);margin:0 0 14px">${esc(x.r)}</p>` : ""}
  <div class="talk" style="--talk:${sc}">${PARTS.map(p => `<section><div class="part">${p[1]}</div>${body(d[p[0]]) || '<p style="color:var(--quiet)">(leer)</p>'}</section>`).join("")}</div>`;
}

let SQ = "";
const norm = s => String(s).toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss").replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim();
function lev(a, b){ if (Math.abs(a.length - b.length) > 2) return 9; const m = a.length, n = b.length; let prev = Array.from({length:n+1}, (_,j) => j);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j-1] + 1, prev[j-1] + (a[i-1] === b[j-1] ? 0 : 1)); prev = cur; } return prev[n]; }
const TOPIC_KW = TOPICS.map(t => ({t, kw:[t.n, ...t.w.split("|")].map(norm)}));
TOPICS.forEach(t => { t.cat = TCATS.find(c => c.k === t.c); t.sid = t.s.map(n => (ST.find(x => x.t === n) || {}).id).filter(Boolean); t.lid = t.l.map(n => (L.find(x => x.t === n) || {}).id).filter(Boolean); });
const TP = k => TOPICS.find(t => t.k === k);
function topicHits(q){
  q = norm(q); if (q.length < 2) return [];
  const qw = q.split(" ");
  return TOPIC_KW.map(({t, kw}) => {
    let sc = 0;
    kw.forEach(k => {
      if (k === q) sc = Math.max(sc, 100);
      else if (q.length >= 3 && k.startsWith(q)) sc = Math.max(sc, 85);
      else if (k.length >= 4 && (" " + q + " ").includes(" " + k + " ")) sc = Math.max(sc, 75);
      else if (q.length >= 4 && k.includes(q)) sc = Math.max(sc, 60);
      else { const tol = q.length >= 8 ? 2 : q.length >= 5 ? 1 : 0; if (tol) { if (lev(q, k) <= tol) sc = Math.max(sc, 70); else qw.forEach(w => { if (w.length >= 5) k.split(" ").forEach(kk => { if (kk.length >= 5 && lev(w, kk) <= (w.length >= 8 ? 2 : 1)) sc = Math.max(sc, 55); }); }); } }
    });
    if (t.cat && t.cat.hidden && !(sc === 100 || sc === 75 || sc === 70 || (sc === 85 && q.length >= 7))) sc = 0;
    return {t, sc};
  }).filter(x => x.sc > 0).sort((a,b) => b.sc - a.sc).map(x => x.t);
}
const helpBox = h => { const x = HELP[h]; if (!x) return ""; return `<div class="help" role="note"><span class="lbl">${esc(x.t)}</span><p>${esc(x.p)}</p><div class="nums">${x.n.map(([n,nr]) => `<a class="numb" href="tel:${nr.replace(/\s/g,"")}"><span>${esc(n)}</span><b class="num">${esc(nr)}</b></a>`).join("")}</div><p class="f">${esc(x.f)}</p></div>`; };
const verseList = t => `<div class="stack" style="gap:6px">${t.v.map(([r, d]) => `<a class="readlink vl" href="${refUrl(r)}" target="_blank" rel="noopener"><span class="t">${esc(r)}<small>${esc(d)}</small></span>${I.ext}</a>`).join("")}</div>`;
function topicBody(t, full){
  return `${t.help && HELP[t.help] && (t.help === "krise" || t.help === "missbrauch") ? helpBox(t.help) : ""}
  <div class="merk"><span class="lbl">Was die Bibel dazu sagt</span><p style="font-family:var(--f-body);font-size:1rem;line-height:1.55">${esc(t.note)}</p></div>
  <div><span class="lbl r">Bibelstellen · Hoffnung für alle</span>${verseList(full ? t : Object.assign({}, t, {v:t.v.slice(0,4)}))}</div>
  ${t.sid.length ? `<div><span class="lbl q">Passende Geschichten</span><div class="list">${t.sid.map(id => storyItem(SS(id))).join("")}</div></div>` : ""}
  ${full && t.lid.length ? `<div><span class="lbl q">Passende Lektionen</span><div class="list">${t.lid.map(id => { const x = LS(id); return `<a class="item" href="#lektion-${id}" style="--c:${B(x.b).c}"><span class="dot"></span><span class="tx"><span class="tt">${esc(x.t)}</span><span class="rf">${esc(B(x.b).n)}</span></span><span class="chev">›</span></a>`; }).join("")}</div></div>` : ""}
  ${t.help && !(t.help === "krise" || t.help === "missbrauch") ? helpBox(t.help) : ""}`;
}
function pFrage(k){
  const t = TP(k); if (!t) return p404();
  return `<a class="back" href="#suche">‹ Themen</a><div class="stack" style="--c:${t.cat.c}"><div><div class="eyebrow"><span class="dot"></span>${esc(t.cat.n)}</div><h1>${esc(t.n)}</h1></div>
  ${topicBody(t, true)}
  <div class="row"><button class="btn ghost" id="shareT">${I.share}Thema teilen</button></div>
  <p style="color:var(--quiet);font-size:.85rem">Du willst mit jemandem darüber reden? Sprich deinen Jugendleiter, Pastor oder eine Person aus der Gemeinde an, der du vertraust.</p></div>`;
}
function pSuche(){
  return `<h1>Was beschäftigt dich?</h1><p class="lead">Gib ein Thema, eine Frage, eine Person oder eine Bibelstelle ein. Du bekommst sofort, was die Bibel dazu sagt.</p>
  <label class="sr" for="sq">Suchbegriff</label><input class="input big" id="sq" type="search" placeholder="z. B. Angst, Zweifel, Geld, Petrus, Römer 8" value="${esc(SQ)}" autocomplete="off" enterkeyhint="search"><div id="sres" style="margin-top:14px"></div>`;
}
function drawSearch(){
  const el = document.getElementById("sres"); if (!el) return;
  const raw = SQ.trim(), q = norm(raw);
  if (q.length < 2) {
    el.innerHTML = `<h2>Themen von A bis Z <small>${TOPICS.filter(t => !t.cat.hidden).length}</small></h2>` + TCATS.filter(c => !c.hidden).map(c => { const ts = TOPICS.filter(t => t.c === c.k).sort((a,b) => a.n.localeCompare(b.n, "de")); return ts.length ? `<div class="tcat"><div class="eyebrow" style="--c:${c.c}"><span class="dot"></span>${esc(c.n)}</div><div class="tchips">${ts.map(t => `<a class="chip" href="#frage-${t.k}">${esc(t.n)}</a>`).join("")}</div></div>` : ""; }).join("");
    return;
  }
  const th = topicHits(raw);
  const wq = " " + q;
  const ls = L.filter(x => (" " + norm(x.t + " " + x.m + " " + strip(x.p.join(" ")) + " " + x.r.join(" ") + " " + x.q + " " + x.a)).includes(wq));
  const ss = ST.filter(x => (" " + norm(x.t + " " + x.r + " " + x.s + " " + x.k + " " + x.q)).includes(wq));
  const thS = new Set(th.flatMap(t => t.sid));
  const ss2 = ss.filter(x => !thS.has(x.id));
  let h = "";
  if (th.length) {
    const t = th[0];
    h += `<div class="stack" style="--c:${t.cat.c}"><div class="eyebrow"><span class="dot"></span>Thema · ${esc(t.cat.n)}</div><h2 style="margin:0">${esc(t.n)}</h2>${topicBody(t, false)}<a class="btn primary" href="#frage-${t.k}">Alles zum Thema ${esc(t.n)} ›</a></div>`;
    const more = th.slice(1).filter(x => !x.cat.hidden || th[0].cat.hidden).slice(0,7);
    if (more.length) h += `<h2>Weitere Themen</h2><div class="tchips">${more.map(t => `<a class="chip" href="#frage-${t.k}"><span class="dot" style="--c:${t.cat.c}"></span>${esc(t.n)}</a>`).join("")}</div>`;
  }
  if (/\d/.test(q)) { const vs = []; TOPICS.forEach(t => t.v.forEach(([r,d]) => { if (norm(r).startsWith(q) || norm(r).includes(" " + q) || norm(r) === q) vs.push([r,d,t]); }));
    const seen = new Set(), vu = vs.filter(([r]) => !seen.has(r) && seen.add(r));
    if (vu.length) h += `<h2>Bibelstellen <small>${vu.length}</small></h2><div class="stack" style="gap:6px">${vu.slice(0,12).map(([r,d,t]) => `<a class="readlink vl" href="${refUrl(r)}" target="_blank" rel="noopener"><span class="t">${esc(r)}<small>${esc(d)} · Thema: ${esc(t.n)}</small></span>${I.ext}</a>`).join("")}</div>`; }
  if (ss2.length) h += `<h2>Geschichten <small>${ss2.length}</small></h2><div class="list">${ss2.map(storyItem).join("")}</div>`;
  if (ls.length) h += `<h2>Lektionen <small>${ls.length}</small></h2><div class="list">${ls.map(x => `<a class="item" href="#lektion-${x.id}" style="--c:${B(x.b).c}"><span class="dot"></span><span class="tx"><span class="tt">${esc(x.t)}</span><span class="rf">${esc(B(x.b).n)}</span></span><span class="chev">›</span></a>`).join("")}</div>`;
  if (!h) h = `<p class="empty">Zu „${esc(raw)}“ habe ich nichts gefunden. Versuch ein anderes Wort, zum Beispiel „Angst“, „Schuld“ oder einen Namen wie „Petrus“. Unten findest du alle Themen.</p>` + `<div class="tchips" style="margin-top:10px">${TOPICS.filter(t => !t.cat.hidden).map(t => `<a class="chip" href="#frage-${t.k}">${esc(t.n)}</a>`).join("")}</div>`;
  el.innerHTML = h;
}

function pEinstellungen(){
  const p = S.prefs, th = p.theme || "system", fs = p.fs || 16;
  const segB = (id, val, cur, label) => `<button data-${id}="${val}" aria-pressed="${cur == val}">${label}</button>`;
  return `<h1>Einstellungen</h1><p class="lead">Alles wird nur auf diesem Gerät gespeichert. Es gibt kein Konto und keinen Server.</p>
  <div class="grid">
    <div class="card"><div class="card-h"><span>Darstellung</span></div>
      <span style="font-weight:700">Farbschema</span><div class="seg">${segB("th","system",th,"Automatisch")}${segB("th","light",th,"Hell")}${segB("th","dark",th,"Dunkel")}</div>
      <span style="font-weight:700">Schriftgröße</span><div class="seg">${segB("fs",15,fs,"Klein")}${segB("fs",16,fs,"Normal")}${segB("fs",18,fs,"Groß")}${segB("fs",20,fs,"Sehr groß")}</div></div>
    <div class="card"><div class="card-h"><span>Sicherung</span></div>
      <p>Dein Fortschritt, deine Notizen und Einleitungen gehören nur dir. Sie bleiben in diesem Browser auf diesem Gerät gespeichert, niemand sonst sieht sie, und du siehst nicht die der anderen.</p>
      <p style="color:var(--quiet);font-size:.9rem">Tipp fürs iPhone: Hol dir die Seite über Teilen → „Zum Home-Bildschirm“. Sonst kann Safari die Daten löschen, wenn du die Seite mehrere Wochen nicht öffnest. Vor einem Gerätewechsel: Sicherung herunterladen.</p>
      <div class="row"><button class="btn primary" id="exp">Sicherung herunterladen</button><button class="btn" id="expC">${I.copy}Als Text kopieren</button></div>
      <label for="impF" style="font-weight:700">Sicherung wiederherstellen</label><input class="input" type="file" id="impF" accept=".json,application/json,text/plain">
      <textarea id="impT" placeholder="… oder kopierten Sicherungstext hier einfügen" style="min-height:80px"></textarea>
      <button class="btn ${armed === "imp" ? "danger" : ""}" id="impGo">${armed === "imp" ? "Ersetzt alles auf diesem Gerät. Nochmal tippen" : "Wiederherstellen"}</button></div>
    <div class="card"><div class="card-h"><span>Zurücksetzen</span></div>
      <p>Löscht Fortschritt, Karteikarten und Routine. Notizen und Einleitungen bleiben erhalten.</p>
      <button class="btn danger" id="rst">${armed === "rst" ? "Wirklich zurücksetzen? Nochmal tippen" : "Lern-Fortschritt zurücksetzen"}</button></div>
  </div>`;
}

const UEBER = `<h1>Über Glaubenswissen</h1><div class="prose">
<p>Glaubenswissen hilft dir, die Grundlagen des christlichen Glaubens zu lernen, die großen Geschichten der Bibel zu lesen und zu erforschen und daraus Einleitungen für Predigt und Jugendstunde vorzubereiten.</p>
<h2>Was du hier findest</h2><ul><li>${L.length} Lektionen in ${BLOCKS.length} Themen, mit Merksatz, Bibelstellen und Selbsttest</li><li>Karteikarten, die dich zum richtigen Zeitpunkt wiederholen lassen</li><li>${ST.length} Bibelgeschichten mit Kurzfassung, Kernbotschaft, Forscherfragen und Notizen</li><li>Einen Baukasten für Einleitungen mit Vortragsmodus und Stoppuhr</li></ul>
<h2>Deine Daten</h2><p>Die Seite nutzt keine Cookies, kein Tracking und keine Werbung. Fortschritt, Notizen und Einleitungen bleiben nur in deinem Browser auf deinem Gerät. Wenn du einen Bibeltext öffnest, wechselst du zu bible.com.</p>
<h2>Aufs Handy holen</h2><p>Öffne die Seite im Browser und wähle „Zum Startbildschirm hinzufügen“ oder „App installieren“. Dann startet sie wie eine App, auch ohne Internet.</p></div>`;
const p404 = () => `<h1>Seite nicht gefunden</h1><p class="lead">Diesen Inhalt gibt es nicht (mehr).</p><a class="btn primary" href="#start">Zur Startseite</a>`;

function render(nav){
  stopTimer();
  const r = route(), sec = section(r);
  document.querySelectorAll(".nav a").forEach(a => { if (a.dataset.s === sec) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current"); });
  if (r !== lastRoute) { showA = false; armed = ""; }
  let h, read = false, title = "";
  const [base, ...rest] = r.split("-"), arg = rest.join("-");
  if (r === "start") h = pStart();
  else if (r === "lernen") { h = pLernen(); title = "Lernen"; }
  else if (base === "thema") { h = pThema(arg); read = true; title = B(arg) ? B(arg).n : ""; }
  else if (base === "lektion") { h = pLektion(arg); read = true; title = LS(arg) ? LS(arg).t : ""; }
  else if (r === "ueben") { h = pUeben(); read = true; title = "Karteikarten"; }
  else if (r === "geschichten") { h = pGeschichten(); title = "Bibelgeschichten"; }
  else if (base === "geschichte") { h = pGeschichte(arg); read = true; title = SS(arg) ? SS(arg).t : ""; }
  else if (r === "einleitungen") { h = pEinleitungen(); title = "Einleitungen"; }
  else if (base === "einleitung") { h = pEinleitung(arg); read = true; title = "Einleitung"; }
  else if (base === "vortrag") { h = pVortrag(arg); read = true; title = "Vortrag"; }
  else if (r === "suche") { h = pSuche(); title = "Suche"; }
  else if (base === "frage") { h = pFrage(arg); read = true; title = TP(arg) ? TP(arg).n : ""; }
  else if (r === "einstellungen") { h = pEinstellungen(); title = "Einstellungen"; }
  else if (r === "ueber" || r === "impressum" || r === "datenschutz") { h = UEBER; read = true; title = "Über"; }
  else h = p404();
  app.className = read ? "read" : "";
  app.innerHTML = `<div class="page">${h}</div>`;
  document.title = title ? title + " · Glaubenswissen" : "Glaubenswissen";
  const isNew = r !== lastRoute;
  lastRoute = r;
  bind(r, base, arg);
  if (nav && isNew) window.scrollTo(0, 0);
  if (base === "vortrag") startWake(); else releaseWake();
}

function bind(r, base, arg){
  const $ = id => document.getElementById(id);
  document.querySelectorAll("[data-r]").forEach(c => c.onchange = () => { if (c.checked) S.today[c.dataset.r] = 1; else delete S.today[c.dataset.r]; syncHist(); render(); });
  if (base === "lektion") {
    const x = LS(arg); if (!x) return;
    if ($("reveal")) $("reveal").onclick = () => { showA = true; render(); };
    if ($("ok")) $("ok").onclick = () => { S.done[x.id] = 1; if (!S.cards[x.id]) S.cards[x.id] = {b:1, due:addDays(1)}; mark("lern"); render(); toast("In deine Karteikarten aufgenommen"); };
    if ($("undo")) $("undo").onclick = () => { delete S.done[x.id]; delete S.cards[x.id]; save(); render(); };
  }
  if (r === "ueben" && qi < Q.length) {
    const id = Q[qi];
    if ($("qShow")) $("qShow").onclick = () => { qShow = true; render(); };
    if ($("qYes")) $("qYes").onclick = () => { const c = S.cards[id]; c.b = Math.min(5, c.b + (qRetry[id] ? 0 : 1)); c.due = addDays(INTERVAL[c.b]); qDone++; qi++; qShow = false; mark("lern"); render(); };
    if ($("qNo")) $("qNo").onclick = () => { const c = S.cards[id]; c.b = 1; c.due = addDays(1); if (!qRetry[id]) { qRetry[id] = 1; Q.push(id); } else qDone++; qi++; qShow = false; save(); render(); };
  }
  if (r === "geschichten") {
    $("fq").oninput = e => { FQ = e.target.value; drawStories(); };
    document.querySelectorAll("[data-g]").forEach(c => c.onclick = () => { FG = c.dataset.g; document.querySelectorAll("[data-g]").forEach(o => { o.classList.toggle("on", o.dataset.g === FG); o.setAttribute("aria-pressed", o.dataset.g === FG); }); drawStories(); });
    drawStories();
  }
  if (base === "geschichte") {
    const x = SS(arg); if (!x) return;
    let nt; $("note").oninput = e => { const v = e.target.value; if (v.trim()) S.notes[x.id] = v; else delete S.notes[x.id]; clearTimeout(nt); nt = setTimeout(() => { save(); $("noteSaved").textContent = "gespeichert"; }, 300); };
    $("readT").onclick = () => { if (S.read[x.id]) delete S.read[x.id]; else { S.read[x.id] = 1; mark("still"); toast("Als gelesen markiert"); } save(); render(); };
    $("shareS").onclick = () => share(x.t + " (" + x.r + ")", x.k, "geschichte-" + x.id);
  }
  if (r === "einleitungen") {
    $("startI").onclick = () => { const v = $("pick").value; if (!v) { $("pick").focus(); toast("Bitte zuerst eine Geschichte wählen"); return; } go("einleitung-" + v); };
    $("freeI").onclick = () => { const id = "frei" + Date.now(); S.drafts[id] = Object.assign(tpl(null), {u:Date.now()}); save(); go("einleitung-" + id); };
  }
  if (base === "einleitung") {
    const id = arg, x = SS(id);
    if (!$("copyI")) return;
    const cur = () => S.drafts[id] || (S.drafts[id] = Object.assign(tpl(x), {u:Date.now()}));
    const upd = () => { const d = cur(); $("meta").textContent = `${words(d)} Wörter · ca. ${mmss(secs(d))} Min. gesprochen`; };
    let st; const later = () => { clearTimeout(st); st = setTimeout(save, 300); };
    document.querySelectorAll("[data-p]").forEach(t => t.oninput = () => { const d = cur(); d[t.dataset.p] = t.value; d.u = Date.now(); later(); upd(); });
    if ($("ititle")) $("ititle").oninput = e => { const d = cur(); d.title = e.target.value; d.u = Date.now(); later(); };
    $("copyI").onclick = () => copyText(draftText(id, S.drafts[id] || tpl(x)), "Einleitung kopiert");
    $("shareI").onclick = () => { const t = draftText(id, S.drafts[id] || tpl(x)); if (navigator.share) navigator.share({title:draftTitle(id, S.drafts[id] || tpl(x)), text:t}).catch(() => {}); else copyText(t, "Einleitung kopiert"); };
    $("delI").onclick = () => { if (armed !== id) { armed = id; render(); return; } armed = ""; delete S.drafts[id]; save(); toast(x ? "Auf Vorlage zurückgesetzt" : "Einleitung gelöscht"); if (x) render(); else go("einleitungen"); };
  }
  if (base === "vortrag" && $("tGo")) {
    const tick = () => { const c = $("clock"); if (!c) return; const d = S.drafts[arg] || tpl(SS(arg)); const s = tNow(); c.textContent = mmss(s); c.classList.toggle("over", s > Math.max(60, secs(d))); };
    $("tGo").onclick = () => { if (T.run) { T.acc = tNow(); T.run = false; } else { T.start = Date.now(); T.run = true; } render(); };
    $("tReset").onclick = () => { T = {acc:0, start:0, run:false}; render(); };
    const zoom = dlt => { S.prefs.talk = Math.min(2.2, Math.max(1, Math.round(((S.prefs.talk || 1.3) + dlt) * 10) / 10)); save(); document.querySelector(".talk").style.setProperty("--talk", S.prefs.talk); };
    $("aMinus").onclick = () => zoom(-.1); $("aPlus").onclick = () => zoom(.1);
    tick(); if (T.run) tInt = setInterval(tick, 250);
  }
  if (r === "suche") { let st; $("sq").oninput = e => { SQ = e.target.value; clearTimeout(st); st = setTimeout(drawSearch, 120); }; $("sq").onkeydown = e => { if (e.key === "Enter") e.target.blur(); }; drawSearch(); if (!SQ) setTimeout(() => $("sq").focus(), 50); }
  if (r === "start" && $("qs")) $("qs").onsubmit = e => { e.preventDefault(); SQ = $("qsi").value; go("suche"); };
  if (base === "frage" && $("shareT")) { const t = TP(arg); $("shareT").onclick = () => share(t.n + ": Was die Bibel dazu sagt", t.note, "frage-" + t.k); }
  if (r === "einstellungen") {
    document.querySelectorAll("[data-th]").forEach(b => b.onclick = () => { S.prefs.theme = b.dataset.th; S.prefs.themeSet = 1; save(); applyPrefs(); render(); });
    document.querySelectorAll("[data-fs]").forEach(b => b.onclick = () => { S.prefs.fs = +b.dataset.fs; save(); applyPrefs(); render(); });
    const dump = () => JSON.stringify({app:"glaubenswissen", v:2, datum:new Date().toISOString(), daten:S});
    $("exp").onclick = () => { try { const blob = new Blob([dump()], {type:"application/json"}), a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "glaubenswissen-sicherung-" + TODAY + ".json"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast("Sicherung wird heruntergeladen"); } catch(e) { copyText(dump(), "Download nicht möglich, Sicherung als Text kopiert"); } };
    $("expC").onclick = () => copyText(dump(), "Sicherung als Text kopiert");
    $("impF").onchange = e => { const f = e.target.files && e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { $("impT").value = rd.result; toast("Datei geladen, jetzt auf Wiederherstellen tippen"); }; rd.readAsText(f); };
    $("impGo").onclick = () => {
      let o; try { o = JSON.parse($("impT").value); } catch(e) { toast("Das ist keine gültige Sicherung"); return; }
      if (!o || o.app !== "glaubenswissen" || !o.daten) { toast("Das ist keine Glaubenswissen-Sicherung"); return; }
      if (armed !== "imp") { const keep = $("impT").value; armed = "imp"; render(); $("impT").value = keep; return; }
      S = Object.assign({ done:{}, today:{}, hist:{}, read:{}, notes:{}, drafts:{}, cards:{}, prefs:{} }, o.daten); S.day = TODAY; armed = ""; save(); applyPrefs(); toast("Sicherung wiederhergestellt"); go("start");
    };
    $("rst").onclick = () => { if (armed !== "rst") { armed = "rst"; render(); return; } S.done = {}; S.cards = {}; S.today = {}; S.hist = {}; armed = ""; save(); toast("Lern-Fortschritt zurückgesetzt"); render(); };
  }
}
function stopTimer(){ if (tInt) { clearInterval(tInt); tInt = null; } }
async function startWake(){ try { if (!wake && navigator.wakeLock) { wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => wake = null); } } catch(e) {} }
function releaseWake(){ try { if (wake) wake.release(); } catch(e) {} wake = null; }
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && route().startsWith("vortrag-")) startWake(); });
render(true);
