/* =====================================================================
   LÓGICA
   ===================================================================== */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
let lang = "pt";
try { const s = localStorage.getItem("fm-lang"); if (s === "pt" || s === "en") lang = s; } catch(e){}

const t = k => (T[lang] && T[lang][k]) || T.pt[k] || k;
const waLink = text => "https://wa.me/" + CONFIG.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");

function applyLang(l){
  lang = l;
  document.documentElement.lang = l;
  $$("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$("[data-i18n-attr]").forEach(el => {
    el.dataset.i18nAttr.split(";").forEach(pair => {
      const i = pair.indexOf(":"); const attr = pair.slice(0,i).trim(); const key = pair.slice(i+1).trim();
      el.setAttribute(attr, t(key));
    });
  });
  $$("[data-lang]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === l)));
  document.title = t("meta.title");
  const md = $('meta[name="description"]'); if (md) md.setAttribute("content", t("meta.desc"));
  const ot = $('meta[property="og:title"]'); if (ot) ot.setAttribute("content", t("meta.title"));
  const od = $('meta[property="og:description"]'); if (od) od.setAttribute("content", t("meta.desc"));
  const ol = $('meta[property="og:locale"]'); if (ol) ol.setAttribute("content", l === "pt" ? "pt_AO" : "en_US");
  const wa = waLink(t("wa.general"));
  ["wa-link","foot-wa","fab-wa"].forEach(id => { const a = document.getElementById(id); if (a) a.href = wa; });
  const ta = $("#f-msg");
  if (ta && ta.dataset.auto) ta.value = t("pre." + ta.dataset.auto);
  if (lastStatus) renderStatus(lastStatus.kind, lastStatus.type);
  $$(".field .err").forEach(e => { if (e.dataset.key) e.textContent = t(e.dataset.key); });
  try { localStorage.setItem("fm-lang", l); } catch(e){}
}
$$("[data-lang]").forEach(b => b.addEventListener("click", () => applyLang(b.dataset.lang)));

/* Socials: só aparecem perfis confirmados em CONFIG.socials */
(function renderSocials(){
  if (!CONFIG.socials.length) return;
  ["socials","foot-socials"].forEach(id => {
    const box = document.getElementById(id); if (!box) return;
    CONFIG.socials.forEach(s => {
      const a = document.createElement("a"); a.href = s.url; a.target = "_blank"; a.rel = "noopener"; a.textContent = s.label; box.appendChild(a);
    });
    box.hidden = false;
  });
})();

/* Mobile menu */
const burger = $("#burger"), mnav = $("#mnav"), burgerI = $("#burger-i use");
function setMenu(open){
  burger.setAttribute("aria-expanded", String(open));
  mnav.hidden = !open;
  burgerI.setAttribute("href", open ? "#i-x" : "#i-menu");
}
burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
$$("#mnav a").forEach(a => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", e => { if (e.key === "Escape" && !mnav.hidden) { setMenu(false); burger.focus(); } });
matchMedia("(min-width:960px)").addEventListener("change", e => { if (e.matches) setMenu(false); });

/* Active nav link */
(function(){
  const links = $$("#nav a");
  const map = new Map(links.map(a => [a.getAttribute("href").slice(1), a]));
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { links.forEach(l => l.removeAttribute("aria-current")); const a = map.get(en.target.id); if (a) a.setAttribute("aria-current","true"); }
    });
  }, { rootMargin:"-45% 0px -50% 0px" });
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
})();

/* Process reveal */
(function(){
  const tl = $("#timeline"); if (!tl) return;
  const steps = $$(".step", tl);
  if (!("IntersectionObserver" in window)) { tl.classList.add("in"); steps.forEach(s => s.classList.add("in")); return; }
  const io = new IntersectionObserver(es => {
    if (es.some(e => e.isIntersecting)) { tl.classList.add("in"); steps.forEach(s => s.classList.add("in")); io.disconnect(); }
  }, { threshold:.25 });
  io.observe(tl);
})();

/* CTAs que escolhem o serviço (e preparam a mensagem nos conceitos) */
const fService = $("#f-service"), fMsg = $("#f-msg");
$$("a[data-service]").forEach(a => a.addEventListener("click", () => {
  fService.value = a.dataset.service;
  clearErr("service");
  if (a.dataset.project && (!fMsg.value.trim() || fMsg.dataset.auto)) {
    fMsg.dataset.auto = a.dataset.project; fMsg.value = t("pre." + a.dataset.project); clearErr("msg");
  }
}));
fMsg.addEventListener("input", () => { delete fMsg.dataset.auto; });

/* Formulário */
const form = $("#form"), statusEl = $("#status");
const fields = {
  name:    { el:$("#f-name"),    err:$("#e-name"),    ok:v => v.trim().length >= 2 },
  email:   { el:$("#f-email"),   err:$("#e-email"),   ok:v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) },
  service: { el:$("#f-service"), err:$("#e-service"), ok:v => !!v },
  msg:     { el:$("#f-msg"),     err:$("#e-msg"),     ok:v => v.trim().length >= 10 },
  consent: { el:$("#f-consent"), err:$("#e-consent"), ok:(v, el) => el.checked }
};
function setErr(k, bad){
  const f = fields[k];
  f.el.setAttribute("aria-invalid", bad ? "true" : "false");
  f.err.dataset.key = bad ? "e." + k : "";
  f.err.textContent = bad ? t("e." + k) : "";
}
function clearErr(k){ setErr(k, false); }
function validate(){
  let first = null;
  Object.keys(fields).forEach(k => {
    const f = fields[k]; const bad = !f.ok(f.el.value, f.el);
    setErr(k, bad); if (bad && !first) first = f.el;
  });
  if (first) first.focus();
  return !first;
}
Object.keys(fields).forEach(k => {
  const f = fields[k];
  /* Os erros só aparecem ao enviar (evita saltos de layout durante o clique); depois, limpam-se assim que o campo fica válido. */
  const clearIfValid = () => { if (f.el.getAttribute("aria-invalid") === "true" && f.ok(f.el.value, f.el)) setErr(k, false); };
  f.el.addEventListener("input", clearIfValid);
  f.el.addEventListener("change", clearIfValid);
});

let lastStatus = null;
function renderStatus(kind, type){
  lastStatus = { kind, type };
  statusEl.hidden = false;
  statusEl.className = "status " + (type || "");
  let msg = t(kind);
  if (kind === "s.mail" || kind === "s.fail") msg += CONFIG.email + ".";
  statusEl.textContent = msg;
}
function buildText(){
  const svcEl = fService; const svcLabel = svcEl.options[svcEl.selectedIndex].textContent;
  const b = $("#f-budget").value.trim();
  return [
    t("mail.name") + ": " + $("#f-name").value.trim(),
    t("mail.email") + ": " + $("#f-email").value.trim(),
    t("mail.service") + ": " + svcLabel,
    t("mail.budget") + ": " + (b || t("mail.none")),
    "", fMsg.value.trim()
  ].join("\n");
}
async function submitMail(){
  if ($("#f-hp").value) return;                 // honeypot anti-spam
  const svcLabel = fService.options[fService.selectedIndex].textContent;
  const subject = t("mail.subject") + " — " + svcLabel;
  const body = buildText();
  if (CONFIG.formEndpoint) {
    renderStatus("s.sending");
    try {
      const r = await fetch(CONFIG.formEndpoint, { method:"POST", headers:{ "Content-Type":"application/json", "Accept":"application/json" }, body:JSON.stringify({ subject, message:body, email:$("#f-email").value.trim(), name:$("#f-name").value.trim() }) });
      if (!r.ok) throw new Error(r.status);
      renderStatus("s.ok","ok"); form.reset(); delete fMsg.dataset.auto;
    } catch(e) { renderStatus("s.fail","bad"); }
    return;
  }
  window.location.href = "mailto:" + CONFIG.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  renderStatus("s.mail","ok");
}
form.addEventListener("submit", e => {
  e.preventDefault();
  if (!validate()) { renderStatus("s.invalid","bad"); return; }
  submitMail();
});
$("#send-wa").addEventListener("click", () => {
  if (!validate()) { renderStatus("s.invalid","bad"); return; }
  if ($("#f-hp").value) return;
  window.open(waLink(buildText()), "_blank", "noopener");
  renderStatus("s.wa","ok");
});

$("#year").textContent = new Date().getFullYear();
applyLang(lang);

/* Botão flutuante (telemóvel): aparece depois do hero, esconde-se no contacto */
(function(){
  const fab = $("#fab-wa"), hero = $("#home"), ct = $("#contact");
  if (!fab || !hero || !ct || !("IntersectionObserver" in window)) return;
  const vis = { home:true, contact:false };
  const io = new IntersectionObserver(es => {
    es.forEach(e => { vis[e.target.id] = e.isIntersecting; });
    fab.classList.toggle("show", !vis.home && !vis.contact);
  }, { rootMargin:"0px 0px -20% 0px" });
  io.observe(hero); io.observe(ct);
})();
