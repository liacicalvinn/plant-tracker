// Minimalistische bewegingsillustraties: een mannequin in zijaanzicht (of voorkant) met 1–2 standen.
// Hoeken in graden, scherm-coördinaten (0 = rechts, 90 = omlaag). Ledematen via hoeken (th/sh, ua/fa)
// of via een doelpunt met tweedelige IK (a = enkel, w = pols, d = buigrichting van de knie/elleboog).

const L = { torso: 38, neck: 4, head: 7.5, ua: 20, fa: 18, th: 28, sh: 27, ft: 10 };
const FLOOR = 122;
const rad = (d) => (d * Math.PI) / 180;
const add = (o, a, l) => [o[0] + Math.cos(rad(a)) * l, o[1] + Math.sin(rad(a)) * l];

function ik(o, tgt, l1, l2, dir) {
  const dx = tgt[0] - o[0];
  const dy = tgt[1] - o[1];
  const base = Math.atan2(dy, dx);
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
  const A = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const mid = [o[0] + Math.cos(base + dir * A) * l1, o[1] + Math.sin(base + dir * A) * l1];
  const a2 = Math.atan2(tgt[1] - mid[1], tgt[0] - mid[0]);
  return [mid, [mid[0] + Math.cos(a2) * l2, mid[1] + Math.sin(a2) * l2]];
}

function solve(o, s, l1, l2, k1, k2, kt) {
  if (s[kt]) return ik(o, s[kt], l1, l2, s.d ?? -1);
  const mid = add(o, s[k1], l1);
  return [mid, add(mid, s[k2], l2)];
}

const p2 = (q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
const path = (pts) => 'M' + pts.map(p2).join('L');

function pose(p, acc) {
  const hip = p.hip;
  const sho = add(hip, p.t, L.torso);
  const mid = [(hip[0] + sho[0]) / 2, (hip[1] + sho[1]) / 2];
  const nrm = add([0, 0], p.t - 90, (p.bow || 0) * 2);
  const ctrl = [mid[0] + nrm[0], mid[1] + nrm[1]];
  const head = add(sho, p.t + (p.hd || 0), L.neck + L.head);

  acc?.push(hip, sho, [head[0] - L.head, head[1] - L.head], [head[0] + L.head, head[1] + L.head]);
  const leg = (s, far) => {
    const [k, a] = solve(hip, s, L.th, L.sh, 'th', 'sh', 'a');
    acc?.push(k, a, add(a, s.ft || 0, L.ft));
    return `<path class="${far ? 'f-far' : 'f-limb'}" d="${path([hip, k, a, add(a, s.ft || 0, L.ft)])}"/>`;
  };
  const arm = (s, far) => {
    const [e, w] = solve(sho, s, L.ua, L.fa, 'ua', 'fa', 'w');
    acc?.push(e, w);
    return `<path class="${far ? 'f-far' : 'f-limb'}" d="${path([sho, e, w])}"/>`;
  };

  return [
    p.leg2 ? leg(p.leg2, true) : '',
    p.arm2 ? arm(p.arm2, true) : '',
    `<path class="f-torso" d="M${p2(hip)}Q${p2(ctrl)} ${p2(sho)}"/>`,
    `<circle class="f-head" cx="${head[0].toFixed(1)}" cy="${head[1].toFixed(1)}" r="${L.head}"/>`,
    p.leg ? leg(p.leg, false) : '',
    p.arm ? arm(p.arm, false) : '',
  ].join('');
}

function lerp(a, b, t) {
  if (typeof a === 'number') return a + (b - a) * t;
  if (Array.isArray(a)) return a.map((v, i) => lerp(v, b[i], t));
  if (a && typeof a === 'object') {
    const o = {};
    for (const k of Object.keys(a)) o[k] = k === 'd' ? a[k] : lerp(a[k], b[k] ?? a[k], t);
    return o;
  }
  return a;
}

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function props(pr) {
  let s = '';
  if (pr.floor !== false) s += `<line class="f-prop" x1="8" y1="${FLOOR + 3}" x2="232" y2="${FLOOR + 3}"/>`;
  if (pr.wall) s += `<line class="f-prop wall" x1="${pr.wall}" y1="4" x2="${pr.wall}" y2="${FLOOR + 3}"/>`;
  return s;
}

// ---------- standen per oefening ----------
// Alle figuren kijken naar rechts. Liggende oefeningen: hoofd links.

const RUG = { hip: [105, 119], t: 180 }; // rugligging
const ENKEL = [141, 119]; // voeten bij gebogen knieën
const OP_ALLE_VIEREN = { t: 0, hip: [66, 80] };

export const FIGUREN = {
  bekkenkanteling: {
    labels: ['Onderrug licht hol', 'Staartbeen omhoog, onderrug naar de grond'],
    poses: [
      { hip: [105, 116], t: 178, bow: -4, leg: { a: ENKEL } },
      { hip: [105, 119], t: 180, bow: 0, leg: { a: ENKEL } },
    ],
  },
  heupflexor: {
    labels: ['Start in lunge', 'Bekken achterover, kort naar voren schuiven'],
    poses: [
      { hip: [98, 92], t: -90, leg: { a: [128, 119] }, leg2: { a: [72, 119] }, arm: { w: [112, 84], d: 1 } },
      { hip: [105, 92], t: -92, leg: { a: [128, 119] }, leg2: { a: [72, 119] }, arm: { w: [114, 84], d: 1 } },
    ],
  },
  deadbug: {
    labels: ['Armen en knieën omhoog', 'Tegenovergestelde arm en been zakken'],
    poses: [
      { ...RUG, arm: { ua: -90, fa: -90 }, arm2: { ua: -90, fa: -90 }, leg: { th: -90, sh: 0, ft: -90 }, leg2: { th: -90, sh: 0, ft: -90 } },
      { ...RUG, arm: { ua: -172, fa: -176 }, arm2: { ua: -90, fa: -90 }, leg: { th: -90, sh: 0, ft: -90 }, leg2: { th: -4, sh: -4, ft: -70 } },
    ],
  },
  bridge: {
    labels: ['Voeten dichtbij je billen', 'Heupen omhoog, rechte lijn knie-schouder'],
    poses: [
      { hip: [104, 118], t: 180, leg: { a: ENKEL } },
      { hip: [100, 102], t: 153.4, leg: { a: ENKEL } },
    ],
  },
  plank: {
    labels: ['Rechte lijn, bekken licht achterover'],
    poses: [{ hip: [118.3, 107.2], t: 192.4, leg: { a: [172, 119], ft: -70 }, arm: { ua: 90, fa: 0 } }],
  },
  muurhouding: {
    props: { wall: 71 },
    labels: ['Hielen, billen, schouders en hoofd tegen de muur'],
    poses: [{ hip: [80, 64], t: -90, leg: { a: [80, 119] }, arm: { w: [83, 62], d: 1 } }],
  },
  birddog: {
    labels: ['Handen onder schouders, knieën onder heupen', 'Strek arm en tegenovergesteld been'],
    poses: [
      { ...OP_ALLE_VIEREN, arm: { w: [105, 117], d: 1 }, arm2: { w: [105, 117], d: 1 }, leg: { a: [42, 118] }, leg2: { a: [42, 118] } },
      { ...OP_ALLE_VIEREN, arm: { w: [141.5, 78], d: 1 }, arm2: { w: [105, 117], d: 1 }, leg: { a: [42, 118] }, leg2: { a: [12, 80] } },
    ],
  },
  bridgemarch: {
    labels: ['Bridge-positie vasthouden', 'Til één knie op, heupen blijven hoog'],
    poses: [
      { hip: [100, 102], t: 153.4, leg: { th: -12.9, sh: 60, ft: 0 }, leg2: { th: -12.9, sh: 60, ft: 0 } },
      { hip: [100, 102], t: 153.4, leg: { th: -75, sh: 15, ft: 40 }, leg2: { th: -12.9, sh: 60, ft: 0 } },
    ],
  },
  rdl: {
    labels: ['Sta rechtop, knieën licht gebogen', 'Billen naar achter, lange rug'],
    poses: [
      { hip: [100, 64], t: -90, leg: { a: [100, 119] }, arm: { w: [101, 62], d: 1 } },
      { hip: [84, 70], t: -20, hd: 8, leg: { a: [100, 119] }, arm: { w: [121, 94], d: 1 } },
    ],
  },
  zijplank: {
    labels: ['Op je zij, heupen laag', 'Heupen omhoog, rechte lijn'],
    poses: [
      { hip: [116, 116], t: 205.9, leg: { a: [172, 119], ft: -70 }, arm: { ua: 90, fa: 0 }, arm2: { ua: -90, fa: -90 } },
      { hip: [118.3, 107.2], t: 192.4, leg: { a: [172, 119], ft: -70 }, arm: { ua: 90, fa: 0 }, arm2: { ua: -90, fa: -90 } },
    ],
  },
  reversecrunch: {
    labels: ['Knieën 90° boven je heupen', 'Rol je bekken van de grond'],
    poses: [
      { ...RUG, leg: { th: -90, sh: 0, ft: -90 } },
      { hip: [106, 113], t: 170, leg: { th: -105, sh: -15, ft: -100 } },
    ],
  },
  hollow: {
    labels: ['Liggen, knieën boven heupen', 'Schouders omhoog, onderrug plat'],
    poses: [
      { ...RUG, leg: { th: -90, sh: 0, ft: -90 } },
      { hip: [105, 119], t: 193, bow: 3, hd: -6, leg: { th: -90, sh: 0, ft: -90 } },
    ],
  },
  beenlift: {
    labels: ['Op je zij, benen gestrekt', 'Bovenste been omhoog, bekken stil'],
    poses: [
      { hip: [105, 115], t: 180, leg: { th: 3, sh: 3, ft: -90 }, leg2: { th: 4, sh: 4, ft: -90 } },
      { hip: [105, 115], t: 180, leg: { th: -40, sh: -40, ft: -130 }, leg2: { th: 4, sh: 4, ft: -90 } },
    ],
  },
  katkoe: {
    labels: ['Kat: rug rond, bekken achterover', 'Koe: rug zacht hol'],
    poses: [
      { ...OP_ALLE_VIEREN, bow: 9, hd: 40, arm: { w: [105, 117], d: 1 }, leg: { a: [42, 118] } },
      { ...OP_ALLE_VIEREN, bow: -6, hd: -22, arm: { w: [105, 117], d: 1 }, leg: { a: [42, 118] } },
    ],
  },
  couch: {
    props: { wall: 56 },
    labels: ['Knie op de grond, voet tegen de muur', 'Bekken achterover, langzaam rechtop komen'],
    poses: [
      { hip: [100, 98], t: -75, leg: { a: [140, 119] }, leg2: { a: [66, 96], ft: 180 }, arm: { w: [118, 100], d: 1 } },
      { hip: [94, 100], t: -92, leg: { a: [140, 119] }, leg2: { a: [66, 96], ft: 180 }, arm: { w: [112, 100], d: 1 } },
    ],
  },
  thomas: {
    labels: ['Liggen, voeten op de grond', 'Eén knie naar je borst, ander been laten zakken'],
    poses: [
      { ...RUG, leg: { a: ENKEL }, leg2: { a: ENKEL } },
      { ...RUG, leg: { a: [117, 109] }, leg2: { a: [160, 119] } },
    ],
  },
  cossack: {
    labels: ['Breed staan', 'Zak naar één kant, ander been gestrekt'],
    poses: [
      { hip: [120, 72], t: -90, leg: { a: [92, 119] }, leg2: { a: [148, 119], d: 1 }, arm: { w: [123, 52], d: 1 } },
      { hip: [140, 92], t: -90, leg: { a: [86, 119], ft: -90 }, leg2: { a: [158, 119], d: -1 }, arm: { w: [143, 72], d: 1 } },
    ],
  },
  squat: {
    labels: ['Sta rechtop', 'Diepe hurk, hielen op de grond'],
    poses: [
      { hip: [100, 64], t: -90, leg: { a: [100, 119] }, arm: { w: [103, 62], d: 1 } },
      { hip: [76, 106], t: -68, leg: { a: [100, 119] }, arm: { w: [116, 86], d: 1 } },
    ],
  },
  wgs: {
    labels: ['Diepe lunge, hand op de grond', 'Draai je arm naar het plafond'],
    poses: [
      { hip: [95, 98], t: -35, leg: { a: [140, 119] }, leg2: { a: [42, 119] }, arm: { w: [132, 112], d: 1 }, arm2: { w: [132, 112], d: 1 } },
      { hip: [95, 98], t: -55, leg: { a: [140, 119] }, leg2: { a: [42, 119] }, arm: { w: [118, 38], d: 1 }, arm2: { w: [132, 112], d: 1 } },
    ],
  },
};

// ---------- weergave ----------

const BREEDTE = 240;
const HOOGTE = 124;
const viewCache = {};

/** Zoomt in op de bewegingsruimte van de oefening (maximaal 1,6×), vloer onderaan. */
function viewBox(id) {
  if (viewCache[id]) return viewCache[id];
  const f = FIGUREN[id];
  const pts = [];
  f.poses.forEach((p) => pose(p, pts));
  const xs = pts.map((q) => q[0]);
  const ys = pts.map((q) => q[1]);
  if (f.props?.wall) xs.push(f.props.wall);
  const x0 = Math.min(...xs) - 10;
  const x1 = Math.max(...xs) + 10;
  const y0 = Math.min(...ys) - 8;
  const y1 = Math.max(Math.max(...ys) + 6, FLOOR + 5);
  const zoom = Math.max(1, Math.min(1.7, BREEDTE / (x1 - x0), HOOGTE / (y1 - y0)));
  const w = BREEDTE / zoom;
  const h = Math.min(HOOGTE / zoom, Math.max(y1 - y0, w / 2.4)); // liggende oefeningen krijgen een lager vak
  const cx = (x0 + x1) / 2;
  const vb = { box: `${(cx - w / 2).toFixed(1)} ${(y1 - h).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`, ratio: (w / h).toFixed(3) };
  viewCache[id] = vb;
  return vb;
}

const svgOpen = (id, naam, live) => `<svg class="fig${live ? ' live' : ''}" viewBox="${viewBox(id).box}" style="aspect-ratio:${viewBox(id).ratio}" role="img" aria-label="${naam || ''}" data-fig="${id}">`;

/** Statische afbeelding van één stand. `stand`: index of 'laatste'. */
export function figuurSvg(id, { stand = 'laatste', naam = '', live = false } = {}) {
  const f = FIGUREN[id];
  if (!f) return '';
  const p = stand === 'laatste' ? f.poses[f.poses.length - 1] : f.poses[stand] || f.poses[0];
  return `${svgOpen(id, naam, live)}<g class="f-props">${props(f.props || {})}</g><g class="f-g">${pose(p)}</g></svg>`;
}

/** Laat de figuur heen en weer bewegen tussen de standen; stopt vanzelf als het element verdwijnt. */
export function animeer(svg, onFase) {
  const f = FIGUREN[svg.dataset.fig];
  const g = svg.querySelector('.f-g');
  if (!f || !g || f.poses.length < 2) { onFase?.(0); return; }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const [A, B] = f.poses;
  const HOUD = 700;
  const BEWEEG = 1300;
  const CYCLUS = 2 * (HOUD + BEWEEG);
  const t0 = performance.now();
  let fase = -1;
  const frame = (nu) => {
    if (!svg.isConnected) return;
    const t = (nu - t0) % CYCLUS;
    let x;
    let nieuweFase;
    if (t < HOUD) { x = 0; nieuweFase = 0; }
    else if (t < HOUD + BEWEEG) { x = ease((t - HOUD) / BEWEEG); nieuweFase = x > 0.5 ? 1 : 0; }
    else if (t < 2 * HOUD + BEWEEG) { x = 1; nieuweFase = 1; }
    else { x = 1 - ease((t - 2 * HOUD - BEWEEG) / BEWEEG); nieuweFase = x < 0.5 ? 0 : 1; }
    g.innerHTML = pose(lerp(A, B, x));
    if (nieuweFase !== fase) { fase = nieuweFase; onFase?.(fase); }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** Onderschrift bij de standen; de actieve stand krijgt class "on" via animeer(). */
export function standLabels(id) {
  const f = FIGUREN[id];
  if (!f) return '';
  return `<ol class="pose-labels">${f.labels.map((l, i) => `<li${i === 0 ? ' class="on"' : ''}><b>${f.labels.length > 1 ? i + 1 : ''}</b>${l}</li>`).join('')}</ol>`;
}

/** Start alle animaties binnen `root` en koppel de onderschriften. */
export function startAnimaties(root) {
  root.querySelectorAll('svg.fig.live').forEach((svg) => {
    const lijst = svg.parentElement.querySelectorAll('.pose-labels li');
    animeer(svg, (i) => lijst.forEach((li, j) => li.classList.toggle('on', j === i)));
  });
}
