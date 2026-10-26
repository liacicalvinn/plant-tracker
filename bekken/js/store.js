// Opslag in localStorage + afgeleide voortgangsgegevens.
import { STANDAARD_SCHEMA, ROUTINES } from './data.js';

const KEY = 'bekken-v1';

const STANDAARD = {
  settings: {
    reminderOn: false,
    reminderTime: '19:00',
    sound: true,
    vibrate: true,
    auto: true, // automatisch doorgaan naar de volgende set/oefening
    schema: STANDAARD_SCHEMA,
  },
  log: {}, // { 'YYYY-MM-DD': { [routineId]: { exs: {exId:true}, done: bool, secs: n, mood: 1-5 } } }
  lastNotified: '',
};

let state = laad();

function laad() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw) {
      return {
        ...STANDAARD,
        ...raw,
        settings: { ...STANDAARD.settings, ...(raw.settings || {}) },
      };
    }
  } catch { /* beschadigde of geblokkeerde opslag */ }
  return structuredClone(STANDAARD);
}

function bewaar() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* vol of privé-modus */ }
}

export const get = () => state;
export const settings = () => state.settings;

export function setSetting(k, v) {
  state.settings[k] = v;
  bewaar();
}

export function setLastNotified(d) {
  state.lastNotified = d;
  bewaar();
}

export function importeer(json) {
  const raw = JSON.parse(json);
  if (!raw || typeof raw !== 'object' || !raw.log) throw new Error('Ongeldig bestand');
  state = { ...STANDAARD, ...raw, settings: { ...STANDAARD.settings, ...(raw.settings || {}) } };
  bewaar();
}

export const exporteer = () => JSON.stringify(state, null, 2);

// ---------- datums ----------

export function dagSleutel(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function dagVanSleutel(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function dagenGeleden(n, van = new Date()) {
  const d = new Date(van.getFullYear(), van.getMonth(), van.getDate() - n);
  return d;
}

// ---------- logboek ----------

function entry(dag, id) {
  state.log[dag] ||= {};
  state.log[dag][id] ||= { exs: {}, done: false, secs: 0 };
  return state.log[dag][id];
}

export function routineStatus(dag, id) {
  return state.log[dag]?.[id] || { exs: {}, done: false, secs: 0 };
}

export function toggleOefening(dag, id, exId, totaal) {
  const e = entry(dag, id);
  if (e.exs[exId]) delete e.exs[exId]; else e.exs[exId] = true;
  e.done = Object.keys(e.exs).length >= totaal;
  bewaar();
  return e;
}

export function markeerOefening(dag, id, exId, totaal) {
  const e = entry(dag, id);
  e.exs[exId] = true;
  e.done = Object.keys(e.exs).length >= totaal;
  bewaar();
}

export function rondRoutineAf(dag, id, secs, mood) {
  const e = entry(dag, id);
  e.done = true;
  e.secs = (e.secs || 0) + secs;
  if (mood) e.mood = mood;
  bewaar();
}

export function resetRoutine(dag, id) {
  if (state.log[dag]) delete state.log[dag][id];
  bewaar();
}

export function geplandVoor(dag = new Date()) {
  return (state.settings.schema[dag.getDay()] || []).filter((id) => ROUTINES[id]);
}

export function setSchema(dagIndex, ids) {
  state.settings.schema = { ...state.settings.schema, [dagIndex]: ids };
  bewaar();
}

export function dagKlaar(dag) {
  const gepland = geplandVoor(dag);
  if (!gepland.length) return false;
  return gepland.every((id) => routineStatus(dagSleutel(dag), id).done);
}

export function heeftIets(dagKey) {
  const e = state.log[dagKey];
  return !!e && Object.values(e).some((r) => r.done);
}

/** Aantal opeenvolgende dagen met minstens één afgeronde routine (vandaag mag nog open zijn). */
export function streak() {
  let n = 0;
  let d = new Date();
  if (!heeftIets(dagSleutel(d))) d = dagenGeleden(1);
  while (heeftIets(dagSleutel(d))) { n++; d = dagenGeleden(1, d); }
  return n;
}

export function totalen() {
  let sessies = 0;
  let secs = 0;
  for (const dag of Object.values(state.log)) {
    for (const r of Object.values(dag)) {
      if (r.done) { sessies++; secs += r.secs || 0; }
    }
  }
  return { sessies, minuten: Math.round(secs / 60) };
}
