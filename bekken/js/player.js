// Begeleide oefensessie: timers, herhalingen aftikken, rust, geluid en trillen.
import { dosering } from './data.js';

const OMTREK = 2 * Math.PI * 54;

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
    if (ei < exs.length - 1) {
      steps.push({ kind: 'rest', secs: Math.max(15, ex.rest), label: 'Maak je klaar' });
    }
  });
  // koppel elke rust-stap aan de eerstvolgende werk-stap
  steps.forEach((st, i) => {
    st.i = i;
    if (st.kind === 'rest') st.next = steps.slice(i + 1).find((x) => x.kind === 'work');
  });
  return steps;
}

export function startPlayer({ titel, oefeningen, instellingen, onOefeningKlaar, onKlaar, onSluit }) {
  const steps = bouwStappen(oefeningen);
  const t0 = Date.now();
  let idx = 0;
  let fase = 'ready'; // ready | countdown | running | paused | done
  let eindTijd = 0; // ms timestamp voor timers/rust
  let resterend = 0; // ms bij pauze
  let reps = 0;
  let autoTempo = false;
  let tempoVolgende = 0;
  let laatstePiep = -1;
  let toonInfo = false;
  let klaar = false;
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
    if (s.ex.type === 'timer') {
      eindTijd = Date.now() + s.ex.secs * 1000;
    } else if (autoTempo) {
      tempoVolgende = Date.now() + (s.ex.tempo || 4) * 1000;
    }
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
      if (nu >= eindTijd) startWerk();
      else update();
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

  function ringHtml(frac, tekst, sub) {
    return `<div class="ring">
      <svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="54"/><circle class="ring-fg" cx="60" cy="60" r="54"
        stroke-dasharray="${OMTREK}" stroke-dashoffset="${OMTREK * (1 - frac)}"/></svg>
      <div class="ring-t"><span id="pl-time">${tekst}</span><small id="pl-sub">${sub || ''}</small></div></div>`;
  }

  function tijdTekst() {
    const s = st();
    if (fase === 'countdown') return { t: String(Math.max(1, Math.ceil((eindTijd - Date.now()) / 1000))), frac: 1, sub: 'Maak je klaar' };
    const totaal = s.kind === 'rest' ? s.secs : s.ex.secs;
    const rest = fase === 'paused' ? resterend : Math.max(0, eindTijd - Date.now());
    const sec = Math.ceil(rest / 1000);
    const m = Math.floor(sec / 60);
    const t = m ? `${m}:${String(sec % 60).padStart(2, '0')}` : String(sec);
    return { t, frac: Math.min(1, rest / (totaal * 1000)), sub: fase === 'paused' ? 'Gepauzeerd' : fase === 'ready' ? 'Tik op start' : 'seconden' };
  }

  function update() {
    const s = st();
    if (!s) return;
    const timeEl = el.querySelector('#pl-time');
    if (s.kind === 'rest' || s.ex.type === 'timer') {
      if (!timeEl) return;
      const { t, frac, sub } = fase === 'ready' ? { t: String(s.ex?.secs ?? ''), frac: 1, sub: 'Tik op start' } : tijdTekst();
      timeEl.textContent = t;
      el.querySelector('#pl-sub').textContent = sub;
      el.querySelector('.ring-fg').setAttribute('stroke-dashoffset', OMTREK * (1 - frac));
    } else {
      const r = el.querySelector('#pl-reps');
      if (r) r.textContent = reps;
    }
  }

  function infoHtml(ex) {
    const lijst = (a) => a.map((x) => `<li>${x}</li>`).join('');
    return `<div class="sheet-bg" data-a="info-bg"><div class="sheet">
      <h3>${ex.emoji} ${ex.naam}</h3>
      <p class="muted">${dosering(ex)}</p>
      <p>${ex.doel}</p>
      <h4>Zo doe je het</h4><ol>${lijst(ex.stappen)}</ol>
      ${ex.tips?.length ? `<h4>Tips</h4><ul>${lijst(ex.tips)}</ul>` : ''}
      ${ex.fouten?.length ? `<h4>Veelgemaakte fouten</h4><ul>${lijst(ex.fouten)}</ul>` : ''}
      ${ex.makkelijker ? `<p><b>Makkelijker:</b> ${ex.makkelijker}</p>` : ''}
      ${ex.moeilijker ? `<p><b>Moeilijker:</b> ${ex.moeilijker}</p>` : ''}
      <button class="btn" data-a="info">Sluiten</button></div></div>`;
  }

  function render() {
    if (klaar) { renderKlaar(); return; }
    const s = st();
    const pct = Math.round((idx / steps.length) * 100);
    const top = `<header class="pl-top"><button class="ic" data-a="sluit" aria-label="Stoppen">✕</button>
      <div class="pl-prog"><span style="width:${pct}%"></span></div>
      <button class="ic" data-a="info" aria-label="Uitleg">ⓘ</button></header>`;
    let main = '';
    let foot = '';
    if (s.kind === 'rest') {
      const v = s.next;
      main = `<div class="pl-main"><div class="chip">${s.label}</div>
        ${ringHtml(1, '', 'seconden')}
        ${v ? `<div class="next"><small>Straks</small><b>${v.ex.emoji} ${v.ex.naam}</b>
          <span>${dosering(v.ex)}${v.kant ? ` · begin ${v.kant}` : ''}</span>
          <p>${v.ex.stappen[0]}</p></div>` : ''}</div>`;
      foot = `<div class="pl-foot"><button class="btn ghost" data-a="plus">+15 sec</button>
        <button class="btn" data-a="skip">Sla rust over ⏭</button></div>`;
      el.innerHTML = top + main + foot;
      if (toonInfo && v) el.insertAdjacentHTML('beforeend', infoHtml(v.ex));
      update();
      const t = tijdTekst();
      el.querySelector('#pl-time').textContent = t.t;
      el.querySelector('.ring-fg').setAttribute('stroke-dashoffset', OMTREK * (1 - t.frac));
      return;
    }
    const ex = s.ex;
    const kop = `<div class="chip">Oefening ${s.ei + 1}/${oefeningen.length} · Set ${s.set + 1}/${ex.sets}${s.kant ? ` · <b>${s.kant}</b>` : ''}</div>
      <div class="big-emoji">${ex.emoji}</div><h2>${ex.naam}</h2>`;
    const tip = `<p class="cue">${ex.tips?.[0] || ex.stappen[0]}</p>`;
    if (ex.type === 'timer') {
      const sub = fase === 'ready' ? 'Tik op start' : '';
      const { t, frac } = fase === 'ready' ? { t: String(ex.secs), frac: 1 } : tijdTekst();
      main = `<div class="pl-main">${kop}${ringHtml(frac, t, sub)}${tip}</div>`;
      let knop;
      if (fase === 'ready') knop = `<button class="btn big" data-a="start">▶ Start</button>`;
      else if (fase === 'running') knop = `<button class="btn big" data-a="pauze">⏸ Pauze</button>`;
      else if (fase === 'paused') knop = `<button class="btn big" data-a="hervat">▶ Verder</button>`;
      else if (fase === 'done') knop = `<button class="btn big" data-a="skip">Volgende ⏭</button>`;
      else knop = `<button class="btn big" disabled>…</button>`;
      foot = `<div class="pl-foot"><button class="ic" data-a="prev" aria-label="Vorige">⏮</button>${knop}<button class="ic" data-a="skip" aria-label="Overslaan">⏭</button></div>`;
    } else {
      const doel = ex.reps;
      main = `<div class="pl-main">${kop}
        <div class="counter" data-a="tel"><span id="pl-reps">${reps}</span><small>van ${doel}${ex.hold ? ` · ${ex.hold} sec vasthouden` : ''}</small></div>
        ${tip}
        <label class="switch"><input type="checkbox" data-a="auto-tempo" ${autoTempo ? 'checked' : ''}/> Automatisch tellen (${ex.tempo || 4} sec per herhaling)</label></div>`;
      const knop = fase === 'running' || fase === 'ready'
        ? `<button class="btn big" data-a="tel">+1</button>`
        : `<button class="btn big" data-a="skip">Volgende ⏭</button>`;
      foot = `<div class="pl-foot"><button class="ic" data-a="prev" aria-label="Vorige">⏮</button>${knop}
        <button class="ic" data-a="set-klaar" aria-label="Set klaar">✓</button></div>`;
    }
    el.innerHTML = top + main + foot;
    if (toonInfo) el.insertAdjacentHTML('beforeend', infoHtml(ex));
  }

  function renderKlaar() {
    const secs = Math.round((Date.now() - t0) / 1000);
    const min = Math.max(1, Math.round(secs / 60));
    el.innerHTML = `<div class="pl-main fin"><div class="big-emoji">🎉</div><h2>Goed gedaan!</h2>
      <p class="muted">${titel} afgerond in ${min} min.</p>
      <p>Hoe voelde dat?</p>
      <div class="moods">${['😣', '😕', '😐', '🙂', '😄'].map((e, i) => `<button class="mood" data-a="mood" data-v="${i + 1}">${e}</button>`).join('')}</div>
      <button class="btn big" data-a="fin">Opslaan & sluiten</button></div>`;
  }

  let gekozenMood = 0;

  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-a]');
    if (!t) return;
    const a = t.dataset.a;
    const s = st();
    if (a === 'auto-tempo') return; // afgehandeld door change
    if (a === 'info-bg' && e.target !== t) return; // klik binnen het blad
    switch (a) {
      case 'sluit': sluit(); break;
      case 'info-bg':
      case 'info': toonInfo = !toonInfo; render(); break;
      case 'start': starTelAf(); render(); break;
      case 'pauze': resterend = Math.max(0, eindTijd - Date.now()); fase = 'paused'; render(); break;
      case 'hervat': eindTijd = Date.now() + resterend; fase = 'running'; render(); break;
      case 'plus': eindTijd += 15000; render(); break;
      case 'skip': ga(idx + 1); break;
      case 'prev': {
        let i = idx - 1;
        while (i > 0 && steps[i].kind !== 'work') i--;
        ga(Math.max(0, i));
        break;
      }
      case 'tel':
        if (fase === 'ready') { fase = 'running'; }
        if (fase !== 'running') break;
        reps++;
        piep(800, 0.06); trilt(20);
        if (reps >= s.ex.reps) werkKlaar(); else update();
        break;
      case 'set-klaar': werkKlaar(); break;
      case 'mood':
        gekozenMood = Number(t.dataset.v);
        el.querySelectorAll('.mood').forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === gekozenMood));
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
