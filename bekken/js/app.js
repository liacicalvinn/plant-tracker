// Hoofdapp: tabbladen, routines, voortgang, instellingen en herinneringen.
import {
  ROUTINES, OEFENINGEN, GROEPEN, DAGEN, DAGEN_LANG, BRONNEN,
  oefening, routineOefeningen, routineMinuten, dosering,
} from './data.js';
import * as S from './store.js';
import { startPlayer } from './player.js';

const root = document.getElementById('app');
let tab = 'vandaag';
let detail = null; // routine-id
let sheet = null; // oefening-id
let importFout = '';

const nu = () => new Date();
const vandaagKey = () => S.dagSleutel();

// ---------- kleine hulpjes ----------

function ring(frac, binnen, klasse = '') {
  const C = 2 * Math.PI * 54;
  return `<div class="ring ${klasse}"><svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="54"/>
    <circle class="ring-fg" cx="60" cy="60" r="54" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - frac)}"/></svg>
    <div class="ring-t">${binnen}</div></div>`;
}

const lijst = (a, tag = 'ul') => `<${tag}>${a.map((x) => `<li>${x}</li>`).join('')}</${tag}>`;

function dagGroet() {
  const u = nu().getHours();
  const g = u < 6 ? 'Goedenacht' : u < 12 ? 'Goedemorgen' : u < 18 ? 'Goedemiddag' : 'Goedenavond';
  return g;
}

// ---------- weergaven ----------

function routineKaart(id, gepland) {
  const r = ROUTINES[id];
  const status = S.routineStatus(vandaagKey(), id);
  const totaal = r.items.length;
  const gedaan = Object.keys(status.exs).length;
  return `<button class="card routine ${status.done ? 'done' : ''}" data-a="open" data-id="${id}" style="--rc:${r.kleur}">
    <span class="r-emoji">${r.emoji}</span>
    <span class="r-body"><b>${r.naam}</b><small>${routineMinuten(id)} min · ${totaal} oefeningen</small>
      <span class="bar"><i style="width:${status.done ? 100 : (gedaan / totaal) * 100}%"></i></span></span>
    <span class="r-state">${status.done ? '✓' : gedaan ? `${gedaan}/${totaal}` : '›'}</span></button>`;
}

function bannerHtml() {
  const s = S.settings();
  if (!s.reminderOn) return '';
  const gepland = S.geplandVoor();
  if (!gepland.length || S.dagKlaar(nu())) return '';
  const [h, m] = s.reminderTime.split(':').map(Number);
  const tijd = new Date(); tijd.setHours(h, m, 0, 0);
  if (nu() < tijd) return '';
  return `<div class="banner">⏰ Tijd om te oefenen! Je hebt vandaag nog ${gepland.filter((id) => !S.routineStatus(vandaagKey(), id).done).length} routine(s) te gaan.</div>`;
}

function viewVandaag() {
  const gepland = S.geplandVoor();
  const klaar = gepland.filter((id) => S.routineStatus(vandaagKey(), id).done).length;
  const st = S.streak();
  const anderen = Object.keys(ROUTINES).filter((id) => !gepland.includes(id));
  const frac = gepland.length ? klaar / gepland.length : 0;
  return `<div class="view">
    <h1>${dagGroet()} 👋</h1>
    <p class="muted">${DAGEN_LANG[nu().getDay()]} ${nu().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })}</p>
    ${bannerHtml()}
    <div class="card hero">
      ${ring(frac, gepland.length ? `<span>${klaar}/${gepland.length}</span><small>vandaag</small>` : '<span>🛌</span><small>rust</small>', 'sm')}
      <div><b>${st > 0 ? `🔥 ${st} dag${st === 1 ? '' : 'en'} op rij` : 'Start vandaag je reeks'}</b>
        <p class="muted">${gepland.length ? (klaar === gepland.length ? 'Alles klaar voor vandaag. Top! 🎉' : 'Pak je routine en begin.') : 'Vandaag geen vast schema. Doe gerust een mini-routine.'}</p></div>
    </div>
    ${gepland.length ? `<h3>Gepland voor vandaag</h3>${gepland.map((id) => routineKaart(id, true)).join('')}` : ''}
    <h3>${gepland.length ? 'Extra' : 'Alle routines'}</h3>
    ${anderen.map((id) => routineKaart(id, false)).join('')}
  </div>`;
}

function viewRoutine(id) {
  const r = ROUTINES[id];
  const exs = routineOefeningen(id);
  const status = S.routineStatus(vandaagKey(), id);
  return `<div class="view">
    <button class="back" data-a="back">‹ Terug</button>
    <h1>${r.emoji} ${r.naam}</h1>
    <p class="muted">${routineMinuten(id)} min · ${exs.length} oefeningen</p>
    <p>${r.omschrijving}</p>
    <button class="btn big full" data-a="start" data-id="${id}">▶ Begeleid starten</button>
    <p class="muted center small">Met timer en herhalingsteller. Of vink hieronder zelf af.</p>
    <h3>Oefeningen</h3>
    <div class="exlist">${exs.map((ex) => `
      <div class="exrow ${status.exs[ex.id] ? 'ticked' : ''}">
        <button class="check" data-a="tick" data-id="${id}" data-ex="${ex.id}" aria-label="Afvinken">${status.exs[ex.id] ? '✓' : ''}</button>
        <button class="exinfo" data-a="ex" data-ex="${ex.id}"><b>${ex.emoji} ${ex.naam}</b><small>${dosering(ex)}</small></button>
      </div>`).join('')}</div>
    ${status.done || Object.keys(status.exs).length ? `<button class="link" data-a="reset" data-id="${id}">Vandaag opnieuw beginnen</button>` : ''}
  </div>`;
}

function viewOefeningen() {
  return `<div class="view"><h1>Oefeningen</h1><p class="muted">Tik voor uitleg of om een oefening los te proberen.</p>
    ${Object.entries(GROEPEN).map(([g, naam]) => `<h3>${naam}</h3><div class="exlist">
      ${Object.entries(OEFENINGEN).filter(([, ex]) => ex.groep === g).map(([id, ex]) => `
        <button class="card exlib" data-a="ex" data-ex="${id}"><span class="r-emoji">${ex.emoji}</span>
        <span class="r-body"><b>${ex.naam}</b><small>${dosering(ex)}</small></span><span class="r-state">›</span></button>`).join('')}</div>`).join('')}
  </div>`;
}

function sheetHtml(id) {
  const ex = oefening({ id });
  return `<div class="sheet-bg" data-a="sheet-bg"><div class="sheet">
    <h3>${ex.emoji} ${ex.naam}</h3><p class="muted">${dosering(ex)}</p><p>${ex.doel}</p>
    <h4>Zo doe je het</h4>${lijst(ex.stappen, 'ol')}
    ${ex.tips?.length ? `<h4>Tips</h4>${lijst(ex.tips)}` : ''}
    ${ex.fouten?.length ? `<h4>Veelgemaakte fouten</h4>${lijst(ex.fouten)}` : ''}
    ${ex.makkelijker ? `<p><b>Makkelijker:</b> ${ex.makkelijker}</p>` : ''}
    ${ex.moeilijker ? `<p><b>Moeilijker:</b> ${ex.moeilijker}</p>` : ''}
    <button class="btn full" data-a="try" data-ex="${id}">▶ Probeer met timer</button>
    <button class="btn ghost full" data-a="sheet-close">Sluiten</button></div></div>`;
}

function viewVoortgang() {
  const tot = S.totalen();
  const st = S.streak();
  // laatste 5 weken, maandag t/m zondag
  const vandaag = nu();
  const dagVanWeek = (vandaag.getDay() + 6) % 7; // ma = 0
  const einde = S.dagenGeleden(-(6 - dagVanWeek));
  const cellen = [];
  for (let i = 34; i >= 0; i--) {
    const d = S.dagenGeleden(i, einde);
    const key = S.dagSleutel(d);
    const n = Object.values(S.get().log[key] || {}).filter((r) => r.done).length;
    const toekomst = d > vandaag && key !== vandaagKey();
    cellen.push(`<i class="cell l${Math.min(n, 3)} ${toekomst ? 'future' : ''} ${key === vandaagKey() ? 'today' : ''}" title="${key}"></i>`);
  }
  const dagen = Object.keys(S.get().log).sort().reverse().filter(S.heeftIets).slice(0, 8);
  const smiley = ['', '😣', '😕', '😐', '🙂', '😄'];
  return `<div class="view"><h1>Voortgang</h1>
    <div class="stats">
      <div class="stat"><b>${st}</b><small>dagen op rij</small></div>
      <div class="stat"><b>${tot.sessies}</b><small>routines</small></div>
      <div class="stat"><b>${tot.minuten}</b><small>minuten</small></div>
    </div>
    <h3>Laatste 5 weken</h3>
    <div class="heat-days">${['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map((d) => `<span>${d}</span>`).join('')}</div>
    <div class="heat">${cellen.join('')}</div>
    <h3>Recent</h3>
    ${dagen.length ? dagen.map((k) => {
      const rs = Object.entries(S.get().log[k]).filter(([, r]) => r.done);
      return `<div class="card hist"><b>${S.dagVanSleutel(k).toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' })}</b>
        <span>${rs.map(([id, r]) => `${ROUTINES[id]?.emoji || ''} ${ROUTINES[id]?.naam || id}${r.secs ? ` · ${Math.max(1, Math.round(r.secs / 60))} min` : ''}${r.mood ? ` ${smiley[r.mood]}` : ''}`).join('<br>')}</span></div>`;
    }).join('') : '<p class="muted">Nog geen afgeronde routines. Begin vandaag! 💪</p>'}
    <p class="muted small">Tip: maak elke 4 weken een foto van opzij (zelfde kleding, zelfde plek) om verschil te zien.</p>
  </div>`;
}

function schemaEditor() {
  const s = S.settings().schema;
  const volgorde = [1, 2, 3, 4, 5, 6, 0];
  return volgorde.map((d) => `<div class="schemarij"><b>${DAGEN[d]}</b><div>${Object.entries(ROUTINES).map(([id, r]) =>
    `<button class="pill ${(s[d] || []).includes(id) ? 'on' : ''}" data-a="schema" data-dag="${d}" data-id="${id}">${r.emoji} ${r.naam}</button>`).join('')}</div></div>`).join('');
}

const INFO = [
  ['Wat is een anterieure bekkenkanteling?', `<p>Je bekken kantelt aan de voorkant naar beneden, waardoor je onderrug holler wordt en je buik naar voren komt. Vaak zie je een combinatie van <b>strakke heupbuigers en onderrugspieren</b> met <b>minder actieve bil- en buikspieren</b> (het "lower crossed syndrome"-idee).</p>
    <p>Een zekere kanteling is normaal. Het is geen ziekte, en zitgedrag, gewoontes en bouw spelen mee. Het doel is meer controle en een positie die je zonder moeite kunt aannemen.</p>`],
  ['Wat zegt het onderzoek (eerlijk)', `<ul><li>Een meta-analyse van 23 gecontroleerde studies (2024) vond dat <b>krachttraining</b> posturale verbetering geeft en <b>beter werkt dan alleen rekken</b>. Rekken veranderde de houding niet. Voor de lage rug/het bekken specifiek was het effect niet significant.</li>
    <li>Een review over bekkenkanteling suggereert dat <b>buikspierversterking</b> de kanteling kan verminderen, maar de resultaten zijn gemengd.</li>
    <li>Direct bewijs dat een bepaalde combinatie van oefeningen je bekkenhoek duurzaam verandert is <b>beperkt</b> (veel case reports en kleine studies). Oefenen helpt je wel sterker, soepeler en bewuster te bewegen.</li>
    <li>Voor flexibiliteit: <b>30–60 seconden</b> per rek is goed onderbouwd; langer geeft meestal geen extra winst.</li></ul>`],
  ['Zo is dit programma opgebouwd', `<ol><li><b>Ademhaling & ribben omlaag</b>: wie de ribben controleert, controleert de onderrug.</li>
    <li><b>Strekken waar het strak zit</b>: heupbuigers, voorkant bovenbeen, met het bekken achterover tijdens de rek.</li>
    <li><b>Versterken waar het zwak is</b>: billen, buikspieren (vooral onderste), hamstrings en zijkant van de heup.</li>
    <li><b>Overzetten naar staan</b>: muurhouding en kort herhalen over de dag.</li>
    <li><b>Heupmobiliteit</b>: in alle richtingen, zodat je heupen en niet je onderrug de beweging maken.</li></ol>
    <p>Hamstrings zijn bij een kanteling vaak <b>lang en zwak</b>, niet strak. Daarom staat er hier geen hamstringrek, maar wel kracht (heupscharnier).</p>`],
  ['Zelftests (2 minuten)', `<ul><li><b>Muurtest</b>: sta met hielen, billen en schouders tegen de muur. Past er meer dan een hand tussen onderrug en muur? Dan staat je onderrug hol.</li>
    <li><b>Thomas-test</b>: zit op de rand van een bed, trek één knie naar je borst en ga achterover liggen. Hangt het andere been boven het bed omhoog, dan zijn je heupbuigers strak.</li>
    <li><b>Foto van opzij</b>: kijk of je bekken voorover kantelt en ribben naar voren steken.</li></ul>`],
  ['Wanneer naar een arts of fysiotherapeut?', `<p>Raadpleeg een professional bij pijn die uitstraalt naar been of billen, tintelingen/doof gevoel, krachtverlies, pijn die 's nachts erger wordt of na enkele weken niet beter wordt, of scherpe pijn in de lies tijdens heupbewegingen. Rek alleen tot <b>milde spanning</b>, nooit pijn.</p>
    <p class="muted small">Deze app is een hulpmiddel en geen medisch advies.</p>`],
  ['Verwachtingen', `<p>Kracht en bewustzijn merk je na enkele weken van regelmatig oefenen. Zichtbare of voelbare verandering in je houding duurt vaak maanden. Dagelijks kort oefenen werkt beter dan af en toe lang.</p>`],
];

function viewMeer() {
  const s = S.settings();
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  return `<div class="view"><h1>Meer</h1>
    <h3>Herinnering</h3>
    <div class="card form">
      <label class="rij"><span>Dagelijkse herinnering</span><input type="checkbox" class="tgl" data-set="reminderOn" ${s.reminderOn ? 'checked' : ''}/></label>
      <label class="rij"><span>Tijdstip</span><input type="time" data-set="reminderTime" value="${s.reminderTime}"/></label>
      <button class="btn full" data-a="ics">📅 Dagelijkse melding in je agenda zetten</button>
      <p class="muted small">Dit is de <b>betrouwbaarste</b> manier: je agenda stuurt elke dag een melding, ook als de app dicht is. Open het gedownloade .ics-bestand en voeg toe aan je agenda.</p>
      ${perm === 'default' ? `<button class="btn ghost full" data-a="notif">🔔 Meldingen in de app toestaan</button>` : ''}
      ${perm === 'granted' ? `<button class="btn ghost full" data-a="testnotif">🔔 Testmelding sturen</button>` : ''}
      ${perm === 'denied' ? '<p class="muted small">Meldingen zijn geblokkeerd in je browserinstellingen.</p>' : ''}
      <p class="muted small">Een webapp kan zichzelf niet betrouwbaar op de achtergrond wekken. Als de app opent na het ingestelde tijdstip en je nog niet klaar bent, krijg je een melding en een banner.</p>
    </div>
    <h3>Tijdens het oefenen</h3>
    <div class="card form">
      <label class="rij"><span>Geluid (pieptonen)</span><input type="checkbox" class="tgl" data-set="sound" ${s.sound ? 'checked' : ''}/></label>
      <label class="rij"><span>Trillen</span><input type="checkbox" class="tgl" data-set="vibrate" ${s.vibrate ? 'checked' : ''}/></label>
      <label class="rij"><span>Automatisch doorgaan</span><input type="checkbox" class="tgl" data-set="auto" ${s.auto ? 'checked' : ''}/></label>
    </div>
    <h3>Weekschema</h3>
    <div class="card form">${schemaEditor()}</div>
    <h3>Over bekkenkanteling</h3>
    ${INFO.map(([t, h]) => `<details class="card"><summary>${t}</summary>${h}</details>`).join('')}
    <details class="card"><summary>Bronnen</summary><ul>${BRONNEN.map((b) => `<li><a href="${b.u}" target="_blank" rel="noopener">${b.t}</a></li>`).join('')}</ul></details>
    <h3>Gegevens</h3>
    <div class="card form">
      <p class="muted small">Alles staat alleen op dit toestel. Maak af en toe een back-up.</p>
      <button class="btn ghost full" data-a="export">⬇️ Back-up downloaden</button>
      <label class="btn ghost full filebtn">⬆️ Back-up terugzetten<input type="file" accept="application/json" data-a="import" hidden/></label>
      ${importFout ? `<p class="err">${importFout}</p>` : ''}
    </div>
  </div>`;
}

// ---------- render ----------

const TABS = [
  ['vandaag', '🏠', 'Vandaag'],
  ['oefeningen', '📚', 'Oefeningen'],
  ['voortgang', '📈', 'Voortgang'],
  ['meer', '⚙️', 'Meer'],
];

function render() {
  let inhoud;
  if (detail) inhoud = viewRoutine(detail);
  else if (tab === 'vandaag') inhoud = viewVandaag();
  else if (tab === 'oefeningen') inhoud = viewOefeningen();
  else if (tab === 'voortgang') inhoud = viewVoortgang();
  else inhoud = viewMeer();
  const scroll = root.querySelector('.scroll')?.scrollTop || 0;
  root.innerHTML = `<main class="scroll">${inhoud}</main>
    <nav class="tabs">${TABS.map(([id, ic, naam]) => `<button class="${!detail && tab === id ? 'on' : ''}" data-a="tab" data-id="${id}"><span>${ic}</span>${naam}</button>`).join('')}</nav>
    ${sheet ? sheetHtml(sheet) : ''}`;
  root.querySelector('.scroll').scrollTop = scroll;
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
    'SUMMARY:🧘 Bekken- en heupoefeningen',
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
    toonMelding('Tijd om te oefenen 🧘', 'Je routine van vandaag wacht op je.');
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
    case 'testnotif': toonMelding('Testmelding 🔔', 'Zo ziet je herinnering eruit.'); break;
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
