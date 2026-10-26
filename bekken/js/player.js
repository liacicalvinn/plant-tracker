// Begeleide oefensessie: timers, herhalingen aftikken, rust, geluid en trillen.
import { dosering } from './data.js';
import { figuurSvg, standLabels, startAnimaties } from './figuur.js';
import { IC } from './icons.js';

let ctx = null;
function beep(freq = 880, dur = 0.12, vol = 0.25) {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.stop(ctx.currentTime + dur + 0.02);
  } catch { /* geen audio beschikbaar */ }
}

function bouwStappen(exs) {
  const steps = [];
  exs.forEach((ex, ei) => {
    const kanten = ex.perSide ? ['links', 'rechts'] : [null];
    for (let s = 0; s < ex.sets; s++) {
      kanten.forEach((kant, ki) => {
        steps.push({ kind: 'work', ex, ei, set: s, kant });
        const laatsteKant = ki === kanten.length - 1;
        if (!laatsteKant) {
          if (ex.type === 'timer') steps.push({ kind: 'rest', secs: 5, label: 'Wissel van kant' });
        } else if (s < ex.sets - 1) {
          steps.push({ kind: 'rest', secs: ex.rest, label: 'Rust' });
        }
      });
    }
    if (ei < exs.length - 1) steps.push({ kind: 'rest', secs: Math.max(15, ex.rest), label: 'Maak je klaar' });
  });
  steps.forEach((st, i) => {
    st.i = i;
    if (st.kind === 'rest') st.next = steps.slice(i + 1).find((x) => x.kind === 'work');
  });
  return steps;
}

const tijdTekst = (sec) => {
  const m = Math.floor(sec / 60);
  return m ? `${m}:${String(sec % 60).padStart(2, '0')}` : String(sec);
};

export function startPlayer({ titel, oefeningen, instellingen, onOefeningKlaar, onKlaar, onSluit }) {
  const steps = bouwStappen(oefeningen);
  const t0 = Date.now();
  let idx = 0;
  let fase = 'ready'; // ready | countdown | running | paused | done
  let eindTijd = 0;
  let resterend = 0;
  let reps = 0;
  let autoTempo = false;
  let tempoVolgende = 0;
  let laatstePiep = -1;
  let toonInfo = false;
  let klaar = false;
  let gekozenMood = 0;
  let wake = null;
  let interval = null;

  const el = document.createElement('div');
  el.className = 'pl';
  document.body.appendChild(el);
  document.body.classList.add('no-scroll');

  const trilt = (p) => { if (instellingen.vibrate) navigator.vibrate?.(p); };
  const piep = (...a) => { if (instellingen.sound) beep(...a); };

  async function houdScherpAan() {
    try { wake = await navigator.wakeLock?.request('screen'); } catch { wake = null; }
  }
  const opZicht = () => { if (document.visibilityState === 'visible' && !klaar) houdScherpAan(); };
  document.addEventListener('visibilitychange', opZicht);
  houdScherpAan();

  const st = () => steps[idx];

  function ga(naar) {
    idx = naar;
    reps = 0;
    laatstePiep = -1;
    toonInfo = false;
    autoTempo = false;
    if (idx >= steps.length) { eindig(); return; }
    const s = st();
    if (s.kind === 'rest') {
      fase = 'running';
      eindTijd = Date.now() + s.secs * 1000;
    } else if (s.ex.type === 'timer' && instellingen.auto) {
      starTelAf();
    } else {
      fase = 'ready';
    }
    render();
  }

  function starTelAf() {
    fase = 'countdown';
    eindTijd = Date.now() + 3000;
    laatstePiep = -1;
  }

  function startWerk() {
    const s = st();
    fase = 'running';
    if (s.ex.type === 'timer') eindTijd = Date.now() + s.ex.secs * 1000;
    else if (autoTempo) tempoVolgende = Date.now() + (s.ex.tempo || 4) * 1000;
    laatstePiep = -1;
    piep(1040, 0.25);
    trilt(60);
    render();
  }

  function werkKlaar() {
    const s = st();
    piep(1040, 0.3);
    trilt([80, 60, 80]);
    const laatsteStap = !steps.slice(idx + 1).some((x) => x.kind === 'work' && x.ei === s.ei);
    if (laatsteStap) onOefeningKlaar?.(s.ex);
    if (instellingen.auto) ga(idx + 1);
    else { fase = 'done'; render(); }
  }

  function eindig() {
    klaar = true;
    clearInterval(interval);
    wake?.release?.().catch(() => {});
    trilt([100, 80, 100, 80, 200]);
    piep(660, 0.2); setTimeout(() => piep(880, 0.2), 200); setTimeout(() => piep(1100, 0.35), 400);
    render();
  }

  function sluit(zonderVraag) {
    if (!klaar && !zonderVraag && !confirm('Sessie stoppen? Voltooide oefeningen blijven afgevinkt.')) return;
    clearInterval(interval);
    wake?.release?.().catch(() => {});
    document.removeEventListener('visibilitychange', opZicht);
    document.body.classList.remove('no-scroll');
    el.remove();
    onSluit?.();
  }

  function tik() {
    if (klaar) return;
    const s = st();
    const nu = Date.now();
    if (fase === 'countdown') {
      const sec = Math.ceil((eindTijd - nu) / 1000);
      if (sec !== laatstePiep) { laatstePiep = sec; if (sec > 0) piep(660, 0.1); }
      if (nu >= eindTijd) startWerk(); else update();
      return;
    }
    if (fase !== 'running') return;
    if (s.kind === 'rest' || s.ex.type === 'timer') {
      const sec = Math.ceil((eindTijd - nu) / 1000);
      if (sec !== laatstePiep) {
        laatstePiep = sec;
        if (sec > 0 && sec <= 3) { piep(sec === 1 ? 880 : 660, 0.1); trilt(25); }
      }
      if (nu >= eindTijd) {
        if (s.kind === 'rest') { piep(1040, 0.2); ga(idx + 1); } else werkKlaar();
        return;
      }
    } else if (autoTempo && nu >= tempoVolgende) {
      reps++;
      tempoVolgende = nu + (s.ex.tempo || 4) * 1000;
      piep(800, 0.08);
      if (reps >= s.ex.reps) { werkKlaar(); return; }
    }
    update();
  }

  // ---------- weergave ----------

  /** Tekst, voortgang (0-1) en ondertitel van de klok in de huidige fase. */
  function klok() {
    const s = st();
    if (fase === 'countdown') return { t: String(Math.max(1, Math.ceil((eindTijd - Date.now()) / 1000))), frac: 1, sub: 'Maak je klaar' };
    const totaal = (s.kind === 'rest' ? s.secs : s.ex.secs) * 1000;
    if (fase === 'ready') return { t: tijdTekst(totaal / 1000), frac: 1, sub: 'Klaar om te starten' };
    const rest = fase === 'paused' ? resterend : Math.max(0, eindTijd - Date.now());
    return { t: tijdTekst(Math.ceil(rest / 1000)), frac: Math.min(1, rest / totaal), sub: fase === 'paused' ? 'Gepauzeerd' : s.kind === 'rest' ? 'seconden rust' : 'seconden' };
  }

  function update() {
    const s = st();
    if (!s) return;
    if (s.kind === 'rest' || s.ex.type === 'timer') {
      const { t, frac, sub } = klok();
      const tEl = el.querySelector('#pl-time');
      if (!tEl) return;
      tEl.textContent = t;
      el.querySelector('#pl-bar').style.width = `${frac * 100}%`;
      el.querySelector('#pl-sub').textContent = sub;
    } else {
      const r = el.querySelector('#pl-reps');
      if (r) r.textContent = reps;
    }
  }

  const lijst = (a, cls) => `<ul class="${cls}">${a.map((x) => `<li>${x}</li>`).join('')}</ul>`;

  function infoHtml(ex) {
    return `<div class="sheet-bg" data-a="info-bg"><div class="sheet">
      <div class="sheet-top"><button class="icbtn" data-a="info" aria-label="Sluiten">${IC.close}</button></div>
      <div class="sheet-body">
        <h2 style="margin-top:4px">${ex.naam}</h2><p class="muted">${dosering(ex)}</p>
        <p class="kort">${ex.kort}</p>
        <h4>Zo doe je het</h4><ol class="steps">${ex.stappen.map((x) => `<li><span>${x}</span></li>`).join('')}</ol>
        ${ex.fouten?.length ? `<h4>Let op</h4>${lijst(ex.fouten, 'bul')}` : ''}
      </div></div></div>`;
  }

  function figuurBlok(ex) {
    return `<div class="pl-fig">${figuurSvg(ex.id, { live: true, naam: ex.naam })}${standLabels(ex.id)}</div>`;
  }

  function render() {
    if (klaar) { renderKlaar(); return; }
    const s = st();
    const pct = Math.round((idx / steps.length) * 100);
    const top = `<header class="pl-top"><button class="icbtn" data-a="sluit" aria-label="Stoppen">${IC.close}</button>
      <div class="pl-prog"><i style="width:${pct}%"></i></div><button class="txt" data-a="info">Uitleg</button></header>`;

    if (s.kind === 'rest') {
      const v = s.next;
      el.innerHTML = `${top}<div class="pl-body">
        <div class="label2">${s.label}</div>
        <div class="clock"><div class="num" id="pl-time"></div><div class="tbar"><i id="pl-bar"></i></div><div class="meta" id="pl-sub" style="margin-top:8px"></div></div>
        ${v ? `<div class="nextup"><div class="label2">Straks</div>
          <div class="pl-fig" style="margin-top:8px">${figuurSvg(v.ex.id, { live: true, naam: v.ex.naam })}${standLabels(v.ex.id)}</div>
          <h2 style="margin-top:14px;font-size:22px">${v.ex.naam}</h2><div class="meta">${dosering(v.ex)}${v.kant ? ` · begin ${v.kant === 'links' ? 'links' : 'rechts'}` : ''}</div></div>` : ''}
      </div>
      <footer class="pl-foot"><button class="btn" data-a="skip">Rust overslaan</button>
        <div class="links"><button class="txt" data-a="plus">+15 seconden</button></div></footer>`;
      if (toonInfo && v) el.insertAdjacentHTML('beforeend', infoHtml(v.ex));
      startAnimaties(el);
      update();
      return;
    }

    const ex = s.ex;
    const meta = `Set ${s.set + 1} van ${ex.sets}${s.kant ? ` · ${s.kant === 'links' ? 'linkerkant' : 'rechterkant'}` : ''}`;
    let midden;
    let knop;
    if (ex.type === 'timer') {
      midden = `<div class="clock"><div class="num" id="pl-time"></div><div class="tbar"><i id="pl-bar"></i></div><div class="meta" id="pl-sub" style="margin-top:8px"></div></div>`;
      if (fase === 'ready') knop = `<button class="btn" data-a="start">Start</button>`;
      else if (fase === 'running') knop = `<button class="btn" data-a="pauze">Pauze</button>`;
      else if (fase === 'paused') knop = `<button class="btn" data-a="hervat">Verder</button>`;
      else if (fase === 'done') knop = `<button class="btn" data-a="skip">Volgende</button>`;
      else knop = `<button class="btn" disabled>Maak je klaar</button>`;
    } else {
      midden = `<div class="counter" data-a="tel"><span class="num" id="pl-reps">${reps}</span><span class="of">/ ${ex.reps}</span>
          ${ex.hold ? `<span class="hold">${ex.hold} sec vasthouden</span>` : ''}</div>
        <label class="switch"><input type="checkbox" class="tgl" data-a="auto-tempo" ${autoTempo ? 'checked' : ''}/> Automatisch tellen (${ex.tempo || 4} sec per herhaling)</label>`;
      knop = fase === 'done' ? `<button class="btn" data-a="skip">Volgende</button>` : `<button class="btn" data-a="tel">Tel een herhaling</button>`;
    }
    el.innerHTML = `${top}<div class="pl-body">
        ${figuurBlok(ex)}
        <h2>${ex.naam}</h2><div class="meta">${meta}</div>
        ${midden}
        <p class="cue">${ex.kort}</p>
      </div>
      <footer class="pl-foot">${knop}
        <div class="links"><button class="txt" data-a="prev">Vorige</button>
          ${ex.type === 'reps' ? '<button class="txt" data-a="set-klaar">Set klaar</button>' : ''}
          <button class="txt" data-a="skip">Overslaan</button></div></footer>`;
    if (toonInfo) el.insertAdjacentHTML('beforeend', infoHtml(ex));
    startAnimaties(el);
    update();
  }

  function renderKlaar() {
    const min = Math.max(1, Math.round((Date.now() - t0) / 60000));
    el.innerHTML = `<div class="pl-body fin">
      <div class="okcircle">${IC.check}</div>
      <h2 style="margin-top:20px">Klaar</h2>
      <p class="muted">${titel} · ${min} min</p>
      <div class="label2" style="margin-top:32px">Hoe voelde het?</div>
      <div class="seg">${[[1, 'Zwaar'], [3, 'Goed'], [5, 'Sterk']].map(([v, t]) => `<button data-a="mood" data-v="${v}" class="${gekozenMood === v ? 'on' : ''}">${t}</button>`).join('')}</div>
    </div><footer class="pl-foot"><button class="btn" data-a="fin">Opslaan</button></footer>`;
  }

  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-a]');
    if (!t) return;
    const a = t.dataset.a;
    const s = st();
    if (a === 'auto-tempo') return;
    if (a === 'info-bg' && e.target !== t) return;
    switch (a) {
      case 'sluit': sluit(); break;
      case 'info-bg':
      case 'info': toonInfo = !toonInfo; render(); break;
      case 'start': starTelAf(); render(); break;
      case 'pauze': resterend = Math.max(0, eindTijd - Date.now()); fase = 'paused'; render(); break;
      case 'hervat': eindTijd = Date.now() + resterend; fase = 'running'; render(); break;
      case 'plus': eindTijd += 15000; update(); break;
      case 'skip': ga(idx + 1); break;
      case 'prev': {
        let i = idx - 1;
        while (i > 0 && steps[i].kind !== 'work') i--;
        ga(Math.max(0, i));
        break;
      }
      case 'tel':
        if (fase === 'ready') fase = 'running';
        if (fase !== 'running') break;
        reps++;
        piep(800, 0.06); trilt(20);
        if (reps >= s.ex.reps) werkKlaar(); else update();
        break;
      case 'set-klaar': werkKlaar(); break;
      case 'mood':
        gekozenMood = gekozenMood === Number(t.dataset.v) ? 0 : Number(t.dataset.v);
        el.querySelectorAll('.seg button').forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === gekozenMood));
        break;
      case 'fin':
        sluit(true);
        onKlaar?.({ secs: Math.round((Date.now() - t0) / 1000), mood: gekozenMood });
        break;
    }
  });

  el.addEventListener('change', (e) => {
    if (e.target.dataset.a !== 'auto-tempo') return;
    autoTempo = e.target.checked;
    if (autoTempo) {
      fase = 'running';
      tempoVolgende = Date.now() + (st().ex.tempo || 4) * 1000;
    }
    render();
  });

  interval = setInterval(tik, 200);
  ga(0);
}
