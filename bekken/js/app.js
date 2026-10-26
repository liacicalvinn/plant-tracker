// Hoofdapp: tabbladen, routines, voortgang, instellingen en herinneringen.
import {
  ROUTINES, OEFENINGEN, GROEPEN, DAGEN, DAGEN_LANG, BRONNEN,
  oefening, routineOefeningen, routineMinuten, dosering,
} from './data.js';
import * as S from './store.js';
import { startPlayer } from './player.js';
import { figuurSvg, standLabels, startAnimaties } from './figuur.js';
import { IC } from './icons.js';

const root = document.getElementById('app');
let tab = 'vandaag';
let detail = null; // routine-id
let sheet = null; // oefening-id
let importFout = '';

const nu = () => new Date();
const vandaagKey = () => S.dagSleutel();
const lijst = (a, cls) => `<ul class="${cls}">${a.map((x) => `<li>${x}</li>`).join('')}</ul>`;
const MOOD = { 1: 'zwaar', 3: 'goed', 5: 'sterk' };

// ---------- weergaven ----------

function weekStrook() {
  const dagVanWeek = (nu().getDay() + 6) % 7; // ma = 0
  const maandag = S.dagenGeleden(dagVanWeek);
  const cellen = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(maandag.getFullYear(), maandag.getMonth(), maandag.getDate() + i);
    const key = S.dagSleutel(d);
    const klasse = [
      S.heeftIets(key) ? 'done' : '',
      S.geplandVoor(d).length ? 'plan' : '',
      key === vandaagKey() ? 'vandaag' : '',
    ].join(' ');
    cellen.push(`<div class="${klasse}">${DAGEN[d.getDay()]}<span class="d">${S.heeftIets(key) ? IC.check : d.getDate()}</span></div>`);
  }
  return `<div class="week">${cellen.join('')}</div>`;
}

function routineRij(id) {
  const r = ROUTINES[id];
  const status = S.routineStatus(vandaagKey(), id);
  const gedaan = Object.keys(status.exs).length;
  const totaal = r.items.length;
  return `<button class="row" data-a="open" data-id="${id}">
    <span class="grow"><span class="t">${r.naam}</span>
      <span class="s">${routineMinuten(id)} min · ${totaal} oefeningen${!status.done && gedaan ? ` · ${gedaan} gedaan` : ''}</span></span>
    ${status.done ? `<span class="circle on">${IC.check}</span>` : IC.chevron}</button>`;
}

function herinneringTekst() {
  const s = S.settings();
  if (!s.reminderOn || !S.geplandVoor().length || S.dagKlaar(nu())) return '';
  const [h, m] = s.reminderTime.split(':').map(Number);
  const tijd = new Date(); tijd.setHours(h, m, 0, 0);
  return nu() >= tijd ? `<div class="notice">Het is tijd om te oefenen.</div>` : '';
}

function viewVandaag() {
  const gepland = S.geplandVoor();
  const open = gepland.filter((id) => !S.routineStatus(vandaagKey(), id).done);
  const st = S.streak();
  const anderen = Object.keys(ROUTINES).filter((id) => !gepland.includes(id));
  const sub = `${DAGEN_LANG[nu().getDay()]} ${nu().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })}`
    + (st > 0 ? ` · ${st} ${st === 1 ? 'dag' : 'dagen'} op rij` : '');
  const cta = open.length
    ? `<div class="cta"><button class="btn" data-a="start" data-id="${open[0]}">Start ${ROUTINES[open[0]].naam}</button></div>`
    : gepland.length ? `<p class="muted cta">Alles gedaan voor vandaag.</p>` : `<p class="muted cta">Vandaag staat er niets gepland. Een mini-routine kan altijd.</p>`;
  return `<div class="page"><h1>Vandaag</h1><p class="sub">${sub}</p>
    ${weekStrook()}${herinneringTekst()}${cta}
    ${gepland.length ? `<h3 class="sect">Gepland</h3><div class="group">${gepland.map(routineRij).join('')}</div>` : ''}
    <h3 class="sect">${gepland.length ? 'Extra' : 'Routines'}</h3><div class="group">${anderen.map(routineRij).join('')}</div>
  </div>`;
}

function oefRij(ex, id, status) {
  const check = status
    ? `<button class="circle ${status.exs[ex.id] ? 'on' : ''}" data-a="tick" data-id="${id}" data-ex="${ex.id}" aria-label="Afvinken">${status.exs[ex.id] ? IC.check : ''}</button>` : '';
  return `<div class="row">${check}
    <button class="row grow" style="padding:0;min-height:0;gap:14px" data-a="ex" data-ex="${ex.id}">
      <span class="thumb">${figuurSvg(ex.id, { naam: ex.naam })}</span>
      <span class="grow"><span class="t">${ex.naam}</span><span class="s">${dosering(ex)}</span></span>${status ? '' : IC.chevron}</button></div>`;
}

function viewRoutine(id) {
  const r = ROUTINES[id];
  const exs = routineOefeningen(id);
  const status = S.routineStatus(vandaagKey(), id);
  return `<div class="page">
    <button class="back" data-a="back">${IC.back}Terug</button>
    <h1>${r.naam}</h1><p class="sub">${routineMinuten(id)} min · ${exs.length} oefeningen</p>
    <p style="margin-top:14px">${r.omschrijving}</p>
    <div class="cta"><button class="btn" data-a="start" data-id="${id}">${Object.keys(status.exs).length && !status.done ? 'Opnieuw beginnen' : 'Start'}</button></div>
    <p class="muted small" style="margin-top:10px">Of vink hieronder zelf per oefening af.</p>
    <h3 class="sect">Oefeningen</h3>
    <div class="group">${exs.map((ex) => oefRij(ex, id, status)).join('')}</div>
    ${status.done || Object.keys(status.exs).length ? `<button class="txt" style="margin-top:16px" data-a="reset" data-id="${id}">Vandaag opnieuw beginnen</button>` : ''}
  </div>`;
}

function viewOefeningen() {
  return `<div class="page"><h1>Oefeningen</h1><p class="sub">Tik voor uitleg en een voorbeeld.</p>
    ${Object.entries(GROEPEN).map(([g, naam]) => `<h3 class="sect">${naam}</h3><div class="group">
      ${Object.keys(OEFENINGEN).filter((id) => OEFENINGEN[id].groep === g).map((id) => oefRij(oefening({ id }), null, null)).join('')}</div>`).join('')}
  </div>`;
}

function sheetHtml(id) {
  const ex = oefening({ id });
  return `<div class="sheet-bg" data-a="sheet-bg"><div class="sheet">
    <div class="sheet-top"><button class="icbtn" data-a="sheet-close" aria-label="Sluiten">${IC.close}</button></div>
    <div class="sheet-body">
      <div class="fig-card">${figuurSvg(id, { live: true, naam: ex.naam })}${standLabels(id)}</div>
      <h2>${ex.naam}</h2><p class="muted">${dosering(ex)}</p>
      <p class="kort">${ex.kort}</p>
      <h4>Zo doe je het</h4><ol class="steps">${ex.stappen.map((x) => `<li><span>${x}</span></li>`).join('')}</ol>
      ${ex.tips?.length ? `<h4>Tips</h4>${lijst(ex.tips, 'bul')}` : ''}
      ${ex.fouten?.length ? `<h4>Let op</h4>${lijst(ex.fouten, 'bul')}` : ''}
      ${ex.makkelijker ? `<h4>Makkelijker</h4><p class="muted">${ex.makkelijker}</p>` : ''}
      ${ex.moeilijker ? `<h4>Moeilijker</h4><p class="muted">${ex.moeilijker}</p>` : ''}
      <h4>Waarom</h4><p class="muted">${ex.doel}</p>
    </div>
    <div class="sheet-foot"><button class="btn" data-a="try" data-ex="${id}">Probeer met timer</button></div>
  </div></div>`;
}

function viewVoortgang() {
  const tot = S.totalen();
  const st = S.streak();
  const vandaag = nu();
  const dagVanWeek = (vandaag.getDay() + 6) % 7;
  const einde = S.dagenGeleden(-(6 - dagVanWeek));
  const cellen = [];
  for (let i = 34; i >= 0; i--) {
    const d = S.dagenGeleden(i, einde);
    const key = S.dagSleutel(d);
    const n = Object.values(S.get().log[key] || {}).filter((r) => r.done).length;
    const toekomst = d > vandaag && key !== vandaagKey();
    cellen.push(`<i class="cell l${Math.min(n, 2)} ${toekomst ? 'future' : ''} ${key === vandaagKey() ? 'today' : ''}" title="${key}"></i>`);
  }
  const dagen = Object.keys(S.get().log).sort().reverse().filter(S.heeftIets).slice(0, 8);
  return `<div class="page"><h1>Voortgang</h1>
    <div class="stats"><div><b>${st}</b><span>dagen op rij</span></div><div><b>${tot.sessies}</b><span>routines</span></div><div><b>${tot.minuten}</b><span>minuten</span></div></div>
    <h3 class="sect">Laatste 5 weken</h3>
    <div class="heat">${['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map((d) => `<span class="h">${d}</span>`).join('')}${cellen.join('')}</div>
    <h3 class="sect">Recent</h3>
    ${dagen.length ? `<div class="group">${dagen.map((k) => {
      const rs = Object.entries(S.get().log[k]).filter(([, r]) => r.done);
      return `<div class="row"><span class="grow"><span class="t">${S.dagVanSleutel(k).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        <span class="s">${rs.map(([id, r]) => `${ROUTINES[id]?.naam || id}${r.secs ? ` · ${Math.max(1, Math.round(r.secs / 60))} min` : ''}${r.mood ? ` · ${MOOD[r.mood]}` : ''}`).join('<br>')}</span></span></div>`;
    }).join('')}</div>` : '<p class="muted">Nog geen afgeronde routines.</p>'}
    <p class="muted small" style="margin-top:20px">Tip: maak elke 4 weken een foto van opzij (zelfde kleding, zelfde plek) om verschil te zien.</p>
  </div>`;
}

function schemaEditor() {
  const s = S.settings().schema;
  return [1, 2, 3, 4, 5, 6, 0].map((d) => `<div class="schema"><b>${DAGEN_LANG[d][0].toUpperCase() + DAGEN_LANG[d].slice(1)}</b><div class="chips">${Object.entries(ROUTINES).map(([id, r]) =>
    `<button class="chip ${(s[d] || []).includes(id) ? 'on' : ''}" data-a="schema" data-dag="${d}" data-id="${id}">${r.naam}</button>`).join('')}</div></div>`).join('');
}

const INFO = [
  ['Wat is een anterieure bekkenkanteling?', `<p>Je bekken kantelt aan de voorkant naar beneden, waardoor je onderrug holler wordt en je buik naar voren komt. Vaak zie je een combinatie van <b>strakke heupbuigers en onderrugspieren</b> met <b>minder actieve bil- en buikspieren</b>.</p>
    <p>Een zekere kanteling is normaal. Het is geen ziekte, en zitgedrag, gewoontes en bouw spelen mee. Het doel is meer controle en een positie die je zonder moeite kunt aannemen.</p>`],
  ['Wat zegt het onderzoek?', `<ul><li>Een meta-analyse van 23 gecontroleerde studies (2024) vond dat <b>krachttraining</b> posturale verbetering geeft en <b>beter werkt dan alleen rekken</b>. Voor de lage rug en het bekken specifiek was het effect niet significant.</li>
    <li>Een review over bekkenkanteling suggereert dat <b>buikspierversterking</b> de kanteling kan verminderen, maar de resultaten zijn gemengd.</li>
    <li>Direct bewijs dat een vaste combinatie van oefeningen je bekkenhoek duurzaam verandert is <b>beperkt</b>. Oefenen helpt je wel sterker, soepeler en bewuster te bewegen.</li>
    <li>Voor flexibiliteit is <b>30–60 seconden</b> per rek goed onderbouwd.</li></ul>`],
  ['Hoe is dit programma opgebouwd?', `<ol><li><b>Bekkencontrole</b>: leer het bekken achterover te kantelen en aan te houden.</li>
    <li><b>Strekken waar het strak zit</b>: heupbuigers en voorkant bovenbeen, met het bekken achterover tijdens de rek.</li>
    <li><b>Versterken waar het zwak is</b>: billen, buikspieren, hamstrings en de zijkant van de heup.</li>
    <li><b>Overzetten naar staan</b>: muurhouding en kort herhalen over de dag.</li>
    <li><b>Heupmobiliteit</b>: in alle richtingen, zodat je heupen en niet je onderrug de beweging maken.</li></ol>
    <p>Hamstrings zijn bij een kanteling vaak lang en zwak, niet strak. Daarom staat er geen hamstringrek in, wel kracht.</p>`],
  ['Zelftests', `<ul><li><b>Muurtest</b>: sta met hielen, billen en schouders tegen de muur. Past er meer dan een hand tussen onderrug en muur? Dan staat je onderrug hol.</li>
    <li><b>Thomas-test</b>: zit op de rand van een bed, trek één knie naar je borst en ga achterover liggen. Hangt het andere been omhoog, dan zijn je heupbuigers strak.</li>
    <li><b>Foto van opzij</b>: kijk of je bekken voorover kantelt en ribben naar voren steken.</li></ul>`],
  ['Wanneer naar een arts of fysiotherapeut?', `<p>Bij pijn die uitstraalt naar been of billen, tintelingen of doof gevoel, krachtverlies, pijn die 's nachts erger wordt of na enkele weken niet beter wordt, of scherpe pijn in de lies tijdens heupbewegingen. Rek alleen tot <b>milde spanning</b>, nooit pijn.</p>
    <p>Deze app is een hulpmiddel en geen medisch advies.</p>`],
];

function viewMeer() {
  const s = S.settings();
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  return `<div class="page"><h1>Instellingen</h1>
    <h3 class="sect">Herinnering</h3>
    <div class="group">
      <label class="row"><span class="grow t">Dagelijkse herinnering</span><input type="checkbox" class="tgl" data-set="reminderOn" ${s.reminderOn ? 'checked' : ''}/></label>
      <label class="row"><span class="grow t">Tijdstip</span><input type="time" data-set="reminderTime" value="${s.reminderTime}"/></label>
      <button class="row" data-a="ics"><span class="grow"><span class="t">Zet in je agenda</span><span class="s">Betrouwbaarste optie: je agenda meldt elke dag, ook als de app dicht is.</span></span>${IC.chevron}</button>
      ${perm === 'default' ? `<button class="row" data-a="notif"><span class="grow t">Meldingen toestaan</span>${IC.chevron}</button>` : ''}
      ${perm === 'granted' ? `<button class="row" data-a="testnotif"><span class="grow t">Testmelding sturen</span>${IC.chevron}</button>` : ''}
    </div>
    <p class="muted small" style="margin:8px 4px 0">Een webapp kan zichzelf niet betrouwbaar op de achtergrond wekken. Opent de app na het ingestelde tijdstip en ben je nog niet klaar, dan krijg je een melding${perm === 'denied' ? ' (meldingen zijn nu geblokkeerd in je browser)' : ''}.</p>
    <h3 class="sect">Tijdens het oefenen</h3>
    <div class="group">
      <label class="row"><span class="grow t">Geluid</span><input type="checkbox" class="tgl" data-set="sound" ${s.sound ? 'checked' : ''}/></label>
      <label class="row"><span class="grow t">Trillen</span><input type="checkbox" class="tgl" data-set="vibrate" ${s.vibrate ? 'checked' : ''}/></label>
      <label class="row"><span class="grow t">Automatisch doorgaan</span><input type="checkbox" class="tgl" data-set="auto" ${s.auto ? 'checked' : ''}/></label>
    </div>
    <h3 class="sect">Weekschema</h3>
    <div class="group">${schemaEditor()}</div>
    <h3 class="sect">Achtergrond</h3>
    ${INFO.map(([t, h]) => `<details class="group"><summary>${t}</summary><div class="prose">${h}</div></details>`).join('')}
    <details class="group"><summary>Bronnen</summary><div class="prose"><ul>${BRONNEN.map((b) => `<li><a href="${b.u}" target="_blank" rel="noopener">${b.t}</a></li>`).join('')}</ul></div></details>
    <h3 class="sect">Gegevens</h3>
    <div class="group">
      <button class="row" data-a="export"><span class="grow t">Back-up downloaden</span>${IC.chevron}</button>
      <label class="row filebtn"><span class="grow t">Back-up terugzetten</span>${IC.chevron}<input type="file" accept="application/json" data-a="import" hidden/></label>
      ${importFout ? `<p class="err">${importFout}</p>` : ''}
    </div>
    <p class="muted small" style="margin:8px 4px 0">Alle gegevens staan alleen op dit toestel.</p>
  </div>`;
}

// ---------- render ----------

const TABS = [
  ['vandaag', 'Vandaag'],
  ['oefeningen', 'Oefeningen'],
  ['voortgang', 'Voortgang'],
  ['meer', 'Instellingen'],
];

function render() {
  let inhoud;
  if (detail) inhoud = viewRoutine(detail);
  else if (tab === 'vandaag') inhoud = viewVandaag();
  else if (tab === 'oefeningen') inhoud = viewOefeningen();
  else if (tab === 'voortgang') inhoud = viewVoortgang();
  else inhoud = viewMeer();
  const scroll = root.querySelector('.scroll')?.scrollTop || 0;
  const open = [...root.querySelectorAll('details[open] summary')].map((s) => s.textContent);
  root.innerHTML = `<main class="scroll">${inhoud}</main>
    <nav class="tabs">${TABS.map(([id, naam]) => `<button class="${!detail && tab === id ? 'on' : ''}" data-a="tab" data-id="${id}">${IC[id === 'meer' ? 'instellingen' : id]}${naam}</button>`).join('')}</nav>
    ${sheet ? sheetHtml(sheet) : ''}`;
  root.querySelectorAll('details').forEach((d) => { if (open.includes(d.querySelector('summary').textContent)) d.open = true; });
  root.querySelector('.scroll').scrollTop = scroll;
  startAnimaties(root);
}

// ---------- acties ----------

function startRoutine(id) {
  const dag = vandaagKey();
  const exs = routineOefeningen(id);
  startPlayer({
    titel: ROUTINES[id].naam,
    oefeningen: exs,
    instellingen: S.settings(),
    onOefeningKlaar: (ex) => S.markeerOefening(dag, id, ex.id, exs.length),
    onKlaar: ({ secs, mood }) => {
      exs.forEach((ex) => S.markeerOefening(dag, id, ex.id, exs.length)); // sessie afgerond = alles gedaan
      S.rondRoutineAf(dag, id, secs, mood);
      render();
    },
    onSluit: () => render(),
  });
}

function probeer(id) {
  sheet = null;
  render();
  startPlayer({ titel: OEFENINGEN[id].naam, oefeningen: [oefening({ id })], instellingen: S.settings(), onSluit: () => render() });
}

function download(naam, inhoud, type) {
  const url = URL.createObjectURL(new Blob([inhoud], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = naam;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function maakIcs() {
  const s = S.settings();
  const [h, m] = s.reminderTime.split(':');
  const morgen = S.dagenGeleden(-1);
  const p = (n) => String(n).padStart(2, '0');
  const datum = `${morgen.getFullYear()}${p(morgen.getMonth() + 1)}${p(morgen.getDate())}`;
  const stempel = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const link = new URL('./', location.href).href;
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bekken//NL', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', 'UID:bekken-dagelijks@bekken-app', `DTSTAMP:${stempel}`,
    `DTSTART:${datum}T${h}${m}00`, 'DURATION:PT20M', 'RRULE:FREQ=DAILY',
    'SUMMARY:Bekken- en heupoefeningen',
    `DESCRIPTION:Tijd voor je dagelijkse routine. Open de app: ${link}`,
    `URL:${link}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Tijd om te oefenen', 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

async function toonMelding(titel, tekst) {
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) { await reg.showNotification(titel, { body: tekst, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'bekken-herinnering' }); return; }
  } catch { /* val terug */ }
  try { new Notification(titel, { body: tekst, icon: 'icons/icon-192.png' }); } catch { /* niet ondersteund */ }
}

function controleerHerinnering() {
  const s = S.settings();
  if (!s.reminderOn || !('Notification' in window) || Notification.permission !== 'granted') return;
  if (S.get().lastNotified === vandaagKey() || S.dagKlaar(nu()) || !S.geplandVoor().length) return;
  const [h, m] = s.reminderTime.split(':').map(Number);
  const tijd = new Date(); tijd.setHours(h, m, 0, 0);
  if (nu() >= tijd) {
    S.setLastNotified(vandaagKey());
    toonMelding('Tijd om te oefenen', 'Je routine van vandaag wacht op je.');
  }
}

document.addEventListener('click', (e) => {
  if (e.target.closest('.pl')) return; // klikken in de oefensessie horen bij player.js
  const t = e.target.closest('[data-a]');
  if (!t || t.tagName === 'INPUT') return;
  const a = t.dataset.a;
  const id = t.dataset.id;
  switch (a) {
    case 'tab': tab = id; detail = null; render(); break;
    case 'open': detail = id; render(); break;
    case 'back': detail = null; render(); break;
    case 'start': startRoutine(id); break;
    case 'tick': S.toggleOefening(vandaagKey(), id, t.dataset.ex, ROUTINES[id].items.length); render(); break;
    case 'reset': S.resetRoutine(vandaagKey(), id); render(); break;
    case 'ex': sheet = t.dataset.ex; render(); break;
    case 'sheet-bg': if (e.target === t) { sheet = null; render(); } break;
    case 'sheet-close': sheet = null; render(); break;
    case 'try': probeer(t.dataset.ex); break;
    case 'schema': {
      const dag = Number(t.dataset.dag);
      const huidig = S.settings().schema[dag] || [];
      S.setSchema(dag, huidig.includes(id) ? huidig.filter((x) => x !== id) : [...huidig, id]);
      render();
      break;
    }
    case 'ics': download('bekken-herinnering.ics', maakIcs(), 'text/calendar'); break;
    case 'notif': Notification.requestPermission().then(render); break;
    case 'testnotif': toonMelding('Testmelding', 'Zo ziet je herinnering eruit.'); break;
    case 'export': download(`bekken-backup-${vandaagKey()}.json`, S.exporteer(), 'application/json'); break;
  }
});

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.set) {
    S.setSetting(t.dataset.set, t.type === 'checkbox' ? t.checked : t.value);
    if (t.dataset.set === 'reminderOn' && t.checked && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(render);
    }
    render();
  } else if (t.dataset.a === 'import' && t.files[0]) {
    t.files[0].text().then((txt) => { S.importeer(txt); importFout = ''; render(); })
      .catch(() => { importFout = 'Dit bestand kon niet worden ingelezen.'; render(); });
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { controleerHerinnering(); if (!detail && tab === 'vandaag') render(); }
});
setInterval(controleerHerinnering, 60000);

render();
controleerHerinnering();
