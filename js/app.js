import { login, isLoggedIn, logout } from './auth.js';
import * as db from './db.js';
import { pickImage, compressImage, blobToDataUrl } from './camera.js';
import { analyzePlant, testConnection, getSettings, saveSettings, isConfigured } from './azure.js';

const app = document.getElementById('app');

/* ---------- helpers ---------- */

function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

const dateFmt = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit' });

function formatDate(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return `Vandaag ${timeFmt.format(d)}`;
  if (d.toDateString() === yesterday.toDateString()) return `Gisteren ${timeFmt.format(d)}`;
  return dateFmt.format(d);
}

let objectUrls = [];
function photoUrl(blob) {
  const url = URL.createObjectURL(blob);
  objectUrls.push(url);
  return url;
}
function revokeUrls() {
  objectUrls.forEach((u) => URL.revokeObjectURL(u));
  objectUrls = [];
}

// Ionic verplaatst overlays tijdens presenteren/sluiten; direct verwijderen bij
// didDismiss mist het element soms — daarom met een kleine vertraging opruimen.
function cleanupOnDismiss(overlay) {
  overlay.addEventListener('didDismiss', () => setTimeout(() => overlay.remove(), 150));
}

async function toast(message, color = 'dark', duration = 2400) {
  const t = document.createElement('ion-toast');
  Object.assign(t, { message, color, duration, position: 'top', swipeGesture: 'vertical' });
  cleanupOnDismiss(t);
  document.body.appendChild(t);
  await t.present();
}

function confirmAlert({ header, message, confirmText = 'Verwijderen', color = 'danger' }) {
  return new Promise((resolve) => {
    const alert = document.createElement('ion-alert');
    Object.assign(alert, {
      header,
      message,
      buttons: [
        { text: 'Annuleer', role: 'cancel', handler: () => resolve(false) },
        { text: confirmText, role: color === 'danger' ? 'destructive' : 'confirm', handler: () => resolve(true) },
      ],
    });
    cleanupOnDismiss(alert);
    document.body.appendChild(alert);
    alert.present();
  });
}

function createModal(innerHTML, opts = {}) {
  const modal = document.createElement('ion-modal');
  Object.assign(modal, opts);
  modal.innerHTML = innerHTML;
  cleanupOnDismiss(modal);
  document.body.appendChild(modal);
  return modal;
}

/* ---------- status & visualisaties ---------- */

const STATUS = {
  gezond: { label: 'Gezond', color: 'success' },
  aandacht: { label: 'Aandacht nodig', color: 'warning' },
  ziek: { label: 'Ziek', color: 'danger' },
};

function statusOf(analysis) {
  return STATUS[analysis?.status] ?? STATUS.aandacht;
}

function scoreColorVar(score) {
  if (score == null) return 'var(--ion-color-medium)';
  if (score >= 75) return 'var(--ion-color-success)';
  if (score >= 45) return 'var(--ion-color-warning)';
  return 'var(--ion-color-danger)';
}

function scoreRing(score, size = 108) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = score == null ? c : c * (1 - score / 100);
  const color = scoreColorVar(score);
  const label = score == null ? '–' : score;
  return `
    <svg class="score-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Gezondheidsscore ${label}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--pg-ring-track)" stroke-width="${stroke}" />
      <circle class="ring-progress" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none"
        stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c}" data-off="${off}"
        transform="rotate(-90 ${size / 2} ${size / 2})" />
      <text x="50%" y="50%" dy="0.08em" class="ring-score" text-anchor="middle" dominant-baseline="middle">${label}</text>
      <text x="50%" y="50%" dy="2.1em" class="ring-sub" text-anchor="middle">/ 100</text>
    </svg>`;
}

function animateRings(root) {
  requestAnimationFrame(() => {
    root.querySelectorAll('.ring-progress[data-off]').forEach((el) => {
      el.style.strokeDashoffset = el.dataset.off;
    });
  });
}

function sparkline(scores, width = 148, height = 36) {
  const valid = scores.filter((s) => s != null);
  if (valid.length < 2) return '';
  const pad = 5;
  const step = (width - pad * 2) / (valid.length - 1);
  const y = (s) => pad + (height - pad * 2) * (1 - s / 100);
  const points = valid.map((s, i) => `${(pad + i * step).toFixed(1)},${y(s).toFixed(1)}`);
  const last = points[points.length - 1].split(',');
  const lastColor = scoreColorVar(valid[valid.length - 1]);
  return `
    <svg class="sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-label="Scoreverloop">
      <polyline points="${points.join(' ')}" fill="none" stroke="${lastColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" />
      <circle cx="${last[0]}" cy="${last[1]}" r="3" fill="${lastColor}" />
    </svg>`;
}

function scorePill(analysis, onPhoto = false) {
  const score = analysis?.gezondheidsscore;
  if (score == null) return '';
  const { color } = statusOf(analysis);
  return `<span class="score-pill${onPhoto ? ' on-photo' : ''}"><span class="dot" style="background: var(--ion-color-${color})"></span>${score}</span>`;
}

function statusLine(analysis) {
  if (!analysis) {
    return `<span class="status-line" style="color: var(--ion-color-medium)"><span class="dot" style="background: var(--ion-color-medium)"></span>Nog geen check</span>`;
  }
  const { label, color } = statusOf(analysis);
  return `<span class="status-line" style="color: var(--ion-color-${color})"><span class="dot" style="background: var(--ion-color-${color})"></span>${label}</span>`;
}

// Compacte statistieken per plant: aantal checks, gemiddelde score en trend
function statRow(entries) {
  if (entries.length === 0) return '';
  const scores = entries.map((e) => e.analysis?.gezondheidsscore).filter((s) => s != null);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const delta = scores.length >= 2 ? scores[0] - scores[1] : null;
  const trendValue = delta == null
    ? '<span class="stat-value">–</span>'
    : delta === 0
      ? '<span class="stat-value trend neutral">±0</span>'
      : `<span class="stat-value trend ${delta > 0 ? 'up' : 'down'}">${delta > 0 ? '+' : ''}${delta}</span>`;
  return `
    <div class="stat-row">
      <div class="surface-card stat-tile"><span class="stat-value">${entries.length}</span><span class="stat-label">Checks</span></div>
      <div class="surface-card stat-tile"><span class="stat-value">${avg ?? '–'}</span><span class="stat-label">Gem. score</span></div>
      <div class="surface-card stat-tile">${trendValue}<span class="stat-label">Trend</span></div>
    </div>`;
}

/* ---------- views ---------- */

function renderLogin() {
  app.innerHTML = `
    <ion-content class="login-content" fullscreen>
      <div class="login-wrap">
        <div class="login-hero">
          <img class="login-logo" src="icons/icon-192.png" alt="" width="84" height="84" />
          <h1>Plantgezondheid</h1>
          <p>Volg de gezondheid van je planten</p>
        </div>
        <div class="form-stack">
          <ion-input id="login-user" class="modern" label="Gebruikersnaam" label-placement="floating" fill="outline"
            autocomplete="username" autocapitalize="off" enterkeyhint="next"></ion-input>
          <ion-input id="login-pass" class="modern" label="Wachtwoord" label-placement="floating" fill="outline" type="password"
            autocomplete="current-password" enterkeyhint="go"></ion-input>
          <ion-button id="login-btn" expand="block" size="large">Inloggen</ion-button>
        </div>
      </div>
    </ion-content>`;

  const doLogin = async () => {
    const user = app.querySelector('#login-user').value ?? '';
    const pass = app.querySelector('#login-pass').value ?? '';
    const btn = app.querySelector('#login-btn');
    btn.disabled = true;
    const ok = await login(user, pass);
    btn.disabled = false;
    if (ok) {
      location.hash = '#/planten';
    } else {
      toast('Onjuiste gebruikersnaam of wachtwoord', 'danger');
    }
  };
  app.querySelector('#login-btn').addEventListener('click', doLogin);
  app.querySelector('#login-pass').addEventListener('keydown', (e) => e.key === 'Enter' && doLogin());
}

async function renderPlants() {
  app.innerHTML = `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="end">
          <ion-button id="btn-settings" aria-label="Instellingen">
            <ion-icon slot="icon-only" name="settings-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page-title">
        <h1>Planten</h1>
        <p id="plant-count" class="page-sub"></p>
      </div>
      <ion-refresher slot="fixed" id="refresher">
        <ion-refresher-content pulling-text="Trek om te verversen"></ion-refresher-content>
      </ion-refresher>
      <div id="plant-grid" class="plant-grid">
        ${'<div class="plant-card skeleton"><ion-skeleton-text animated class="skel-photo"></ion-skeleton-text></div>'.repeat(4)}
      </div>
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button id="btn-add" aria-label="Plant toevoegen">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>`;

  app.querySelector('#btn-settings').addEventListener('click', () => (location.hash = '#/instellingen'));
  app.querySelector('#btn-add').addEventListener('click', openAddPlant);
  app.querySelector('#refresher').addEventListener('ionRefresh', async (e) => {
    await fillPlantGrid();
    e.target.complete();
  });

  await fillPlantGrid();
}

async function fillPlantGrid() {
  const grid = app.querySelector('#plant-grid');
  if (!grid) return;
  const plants = await db.getAllPlants();

  const count = app.querySelector('#plant-count');
  if (count) count.textContent = plants.length === 0 ? '' : plants.length === 1 ? '1 plant' : `${plants.length} planten`;

  if (plants.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="icon-circle"><ion-icon name="leaf-outline"></ion-icon></div>
        <h2>Nog geen planten</h2>
        <p>Voeg een plant toe en maak een foto — je krijgt direct een gezondheidsanalyse.</p>
        <ion-button id="empty-add">
          <ion-icon slot="start" name="add"></ion-icon>Plant toevoegen
        </ion-button>
      </div>`;
    grid.querySelector('#empty-add').addEventListener('click', openAddPlant);
    return;
  }

  const cards = await Promise.all(plants.map(async (plant) => {
    const latest = await db.getLatestEntry(plant.id);
    const photo = latest
      ? `<img src="${photoUrl(latest.photo)}" alt="" loading="lazy" />`
      : `<div class="photo-placeholder"><ion-icon name="leaf-outline"></ion-icon></div>`;
    return `
      <button class="plant-card" data-id="${plant.id}">
        ${photo}
        ${scorePill(latest?.analysis, true)}
        <div class="card-overlay">
          <span class="card-name">${esc(plant.name)}</span>
          <span class="card-date">${latest ? formatDate(latest.createdAt) : 'Nog geen check'}</span>
        </div>
      </button>`;
  }));
  grid.innerHTML = cards.join('');
  grid.querySelectorAll('.plant-card').forEach((card) => {
    card.addEventListener('click', () => (location.hash = `#/plant/${card.dataset.id}`));
  });
}

// "Monstera deliciosa (gatenplant)" → "Monstera deliciosa" als naamsuggestie
function suggestPlantName(species) {
  if (!species) return '';
  return species.split('(')[0].trim() || species.trim();
}

// Plant toevoegen begint met een foto: de AI herkent de soort, stelt een
// naam voor en de eerste gezondheidscheck wordt meteen opgeslagen.
function openAddPlant() {
  const modal = createModal(
    `<ion-content class="ion-padding sheet-content"><div id="add-body"></div></ion-content>`,
    { initialBreakpoint: 0.9, breakpoints: [0, 0.9], handle: true },
  );
  modal.present();
  const body = modal.querySelector('#add-body');
  let photoBlob = null;
  let analysis = null;
  let rotator = null;
  modal.addEventListener('didDismiss', () => clearInterval(rotator));

  const showPicker = () => {
    clearInterval(rotator);
    body.innerHTML = `
      <div class="sheet-header">
        <h2>Nieuwe plant</h2>
        <p>Begin met een foto — de AI herkent de soort en stelt een naam voor.</p>
      </div>
      <button class="pick-option" id="pick-camera">
        <span class="pick-icon"><ion-icon name="camera-outline"></ion-icon></span>
        <span class="pick-text"><strong>Maak een foto</strong><small>Gebruik de camera</small></span>
        <ion-icon class="pick-chevron" name="chevron-forward"></ion-icon>
      </button>
      <button class="pick-option" id="pick-gallery">
        <span class="pick-icon"><ion-icon name="images-outline"></ion-icon></span>
        <span class="pick-text"><strong>Kies uit galerij</strong><small>Bestaande foto gebruiken</small></span>
        <ion-icon class="pick-chevron" name="chevron-forward"></ion-icon>
      </button>`;
    body.querySelector('#pick-camera').addEventListener('click', () => pick(true));
    body.querySelector('#pick-gallery').addEventListener('click', () => pick(false));
  };

  const pick = async (fromCamera) => {
    const file = await pickImage({ fromCamera });
    if (!file) return;
    photoBlob = await compressImage(file);
    showPreview();
  };

  const showPreview = () => {
    const url = URL.createObjectURL(photoBlob);
    body.innerHTML = `
      <div class="sheet-header">
        <h2>Nieuwe plant</h2>
        <p>De AI herkent de soort en beoordeelt direct de gezondheid.</p>
      </div>
      <img class="preview-img" src="${url}" alt="Voorbeeld van de foto" />
      <ion-button id="np-analyse" expand="block" size="large">Herken &amp; analyseer</ion-button>
      <ion-button id="np-repick" expand="block" fill="clear" color="medium">Andere foto</ion-button>`;
    body.querySelector('#np-analyse').addEventListener('click', analyse);
    body.querySelector('#np-repick').addEventListener('click', () => {
      URL.revokeObjectURL(url);
      showPicker();
    });
  };

  const analyse = async () => {
    if (!isConfigured()) {
      modal.dismiss();
      const ok = await confirmAlert({
        header: 'Azure AI nog niet ingesteld',
        message: 'Vul eerst je Azure-endpoint en API-sleutel in bij Instellingen.',
        confirmText: 'Naar instellingen',
        color: 'primary',
      });
      if (ok) location.hash = '#/instellingen';
      return;
    }

    body.innerHTML = `
      <div class="analyse-state">
        <ion-spinner name="crescent" class="analyse-spinner"></ion-spinner>
        <h2>Herkennen</h2>
        <p id="analyse-text">${ANALYSE_TEXTS[0]}</p>
      </div>`;
    let i = 0;
    rotator = setInterval(() => {
      const el = body.querySelector('#analyse-text');
      if (el) el.textContent = ANALYSE_TEXTS[++i % ANALYSE_TEXTS.length];
    }, 2200);

    try {
      const dataUrl = await blobToDataUrl(photoBlob);
      analysis = await analyzePlant(dataUrl);
      clearInterval(rotator);
      showResult();
    } catch (err) {
      clearInterval(rotator);
      showError(err);
    }
  };

  const showResult = () => {
    const url = URL.createObjectURL(photoBlob);
    body.innerHTML = `
      <div class="sheet-header"><h2>Herkend</h2></div>
      <div class="surface-card identify-card">
        <img src="${url}" alt="" />
        <div class="identify-info">
          <span class="identify-label">Soort</span>
          <strong>${esc(analysis.plantsoort || 'Niet herkend')}</strong>
          ${statusLine(analysis)}
        </div>
        ${scorePill(analysis)}
      </div>
      <ion-input id="np-name" class="modern" label="Naam" label-placement="floating" fill="outline"
        value="${esc(suggestPlantName(analysis.plantsoort))}" maxlength="60" autocapitalize="sentences"></ion-input>
      <ion-button id="np-save" expand="block" size="large">Plant opslaan</ion-button>
      <ion-button id="np-repick" expand="block" fill="clear" color="medium">Andere foto</ion-button>`;
    body.querySelector('#np-save').addEventListener('click', () => save(analysis));
    body.querySelector('#np-repick').addEventListener('click', () => {
      URL.revokeObjectURL(url);
      showPicker();
    });
  };

  const showError = (err) => {
    body.innerHTML = `
      <div class="analyse-state">
        <div class="icon-circle danger"><ion-icon name="alert-circle-outline"></ion-icon></div>
        <h2>Herkennen mislukt</h2>
        <p class="error-text">${esc(err.message)}</p>
      </div>
      <ion-input id="np-name" class="modern" label="Naam" label-placement="floating" fill="outline"
        placeholder="Geef zelf een naam" maxlength="60" autocapitalize="sentences"></ion-input>
      <ion-button id="np-retry" expand="block">Opnieuw proberen</ion-button>
      <ion-button id="np-save-manual" expand="block" fill="outline">Opslaan zonder analyse</ion-button>`;
    body.querySelector('#np-retry').addEventListener('click', analyse);
    body.querySelector('#np-save-manual').addEventListener('click', () => save(null));
  };

  const save = async (withAnalysis) => {
    const name = (body.querySelector('#np-name')?.value ?? '').trim();
    if (!name) {
      toast('Geef je plant een naam', 'warning');
      return;
    }
    const plant = await db.addPlant({ name, species: withAnalysis?.plantsoort ?? '' });
    await db.addEntry({ plantId: plant.id, photo: photoBlob, analysis: withAnalysis });
    await modal.dismiss();
    toast('Plant toegevoegd', 'success');
    location.hash = `#/plant/${plant.id}`;
  };

  showPicker();
}

async function renderPlantDetail(id) {
  const plant = await db.getPlant(id);
  if (!plant) {
    location.hash = '#/planten';
    return;
  }
  const entries = await db.getEntries(id);
  const latest = entries[0] ?? null;
  const scoresChrono = [...entries].reverse().map((e) => e.analysis?.gezondheidsscore ?? null);
  const species = plant.species || latest?.analysis?.plantsoort || '';

  app.innerHTML = `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button id="btn-back" aria-label="Terug">
            <ion-icon slot="icon-only" name="chevron-back"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button id="btn-more" aria-label="Meer opties">
            <ion-icon slot="icon-only" name="ellipsis-horizontal"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page-title">
        <h1>${esc(plant.name)}</h1>
        ${species ? `<p class="page-sub">${esc(species)}</p>` : ''}
      </div>

      <div class="surface-card hero-card">
        ${scoreRing(latest?.analysis?.gezondheidsscore ?? null)}
        <div class="hero-info">
          ${statusLine(latest?.analysis)}
          ${sparkline(scoresChrono)}
          ${latest ? `<span class="hero-date">Laatste check: ${formatDate(latest.createdAt)}</span>` : ''}
        </div>
      </div>
      ${statRow(entries)}

      <div class="ion-padding-horizontal">
        <ion-button id="btn-analyse" expand="block" size="large">
          <ion-icon slot="start" name="camera-outline"></ion-icon>
          Nieuwe check
        </ion-button>
      </div>

      ${entries.length === 0 ? `
        <div class="empty-state small">
          <div class="icon-circle"><ion-icon name="camera-outline"></ion-icon></div>
          <p>Maak de eerste foto — je ziet hier daarna het verloop van <strong>${esc(plant.name)}</strong>.</p>
        </div>` : `
      <ion-list id="timeline" inset lines="full">
        <ion-list-header><ion-label>Verloop</ion-label></ion-list-header>
        ${entries.map((e) => `
          <ion-item-sliding data-entry="${e.id}">
            <ion-item button detail="true" class="timeline-item" data-entry-open="${e.id}">
              <ion-thumbnail slot="start"><img src="${photoUrl(e.photo)}" alt="" loading="lazy" /></ion-thumbnail>
              <ion-label>
                <h3>${e.analysis?.diagnose ? esc(truncate(e.analysis.diagnose, 64)) : 'Geen analyse'}</h3>
                <p>${formatDate(e.createdAt)}</p>
              </ion-label>
              ${scorePill(e.analysis)}
            </ion-item>
            <ion-item-options side="end">
              <ion-item-option color="danger" data-entry-del="${e.id}">
                <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>`).join('')}
      </ion-list>`}
      <div class="bottom-spacer"></div>
    </ion-content>`;

  animateRings(app);
  app.querySelector('#btn-back').addEventListener('click', () => (location.hash = '#/planten'));
  app.querySelector('#btn-analyse').addEventListener('click', () => openAnalyseSheet(plant));
  app.querySelector('#btn-more').addEventListener('click', () => openPlantOptions(plant));

  app.querySelectorAll('[data-entry-open]').forEach((item) => {
    item.addEventListener('click', () => {
      const entry = entries.find((e) => e.id === item.dataset.entryOpen);
      if (entry) openEntryDetail(entry, plant);
    });
  });
  app.querySelectorAll('[data-entry-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await confirmAlert({ header: 'Check verwijderen?', message: 'Deze foto en analyse worden definitief verwijderd.' });
      if (ok) {
        await db.deleteEntry(btn.dataset.entryDel);
        toast('Verwijderd', 'medium');
        renderPlantDetail(id);
      } else {
        btn.closest('ion-item-sliding')?.close();
      }
    });
  });
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function openPlantOptions(plant) {
  const sheet = document.createElement('ion-action-sheet');
  Object.assign(sheet, {
    header: plant.name,
    buttons: [
      {
        text: 'Plant verwijderen',
        role: 'destructive',
        icon: 'trash-outline',
        handler: async () => {
          const ok = await confirmAlert({
            header: `${plant.name} verwijderen?`,
            message: 'Alle foto’s en analyses van deze plant worden definitief verwijderd.',
          });
          if (ok) {
            await db.deletePlant(plant.id);
            toast('Plant verwijderd', 'medium');
            location.hash = '#/planten';
          }
        },
      },
      { text: 'Annuleer', role: 'cancel' },
    ],
  });
  cleanupOnDismiss(sheet);
  document.body.appendChild(sheet);
  sheet.present();
}

/* ---------- analyse-flow ---------- */

const ANALYSE_TEXTS = [
  'Soort herkennen…',
  'Bladeren bekijken…',
  'Diep nadenken over de symptomen…',
  'Kleur en structuur beoordelen…',
  'Mogelijke oorzaken afwegen…',
  'Verzorgingsadvies opstellen…',
  'Bijna klaar…',
];

async function openAnalyseSheet(plant) {
  const modal = createModal(
    `<ion-content class="ion-padding sheet-content"><div id="sheet-body"></div></ion-content>`,
    { initialBreakpoint: 0.9, breakpoints: [0, 0.9], handle: true },
  );
  await modal.present();
  const body = modal.querySelector('#sheet-body');
  let photoBlob = null;
  let rotator = null;
  modal.addEventListener('didDismiss', () => clearInterval(rotator));

  const showPicker = () => {
    clearInterval(rotator);
    body.innerHTML = `
      <div class="sheet-header">
        <h2>Nieuwe check</h2>
        <p>Maak een duidelijke foto van de hele plant, met goed licht.</p>
      </div>
      <button class="pick-option" id="pick-camera">
        <span class="pick-icon"><ion-icon name="camera-outline"></ion-icon></span>
        <span class="pick-text"><strong>Maak een foto</strong><small>Gebruik de camera</small></span>
        <ion-icon class="pick-chevron" name="chevron-forward"></ion-icon>
      </button>
      <button class="pick-option" id="pick-gallery">
        <span class="pick-icon"><ion-icon name="images-outline"></ion-icon></span>
        <span class="pick-text"><strong>Kies uit galerij</strong><small>Bestaande foto gebruiken</small></span>
        <ion-icon class="pick-chevron" name="chevron-forward"></ion-icon>
      </button>`;
    body.querySelector('#pick-camera').addEventListener('click', () => pick(true));
    body.querySelector('#pick-gallery').addEventListener('click', () => pick(false));
  };

  const pick = async (fromCamera) => {
    const file = await pickImage({ fromCamera });
    if (!file) return;
    photoBlob = await compressImage(file);
    showPreview();
  };

  const showPreview = () => {
    const url = URL.createObjectURL(photoBlob);
    body.innerHTML = `
      <div class="sheet-header"><h2>Klaar voor analyse?</h2></div>
      <img class="preview-img" src="${url}" alt="Voorbeeld van de foto" />
      <ion-button id="do-analyse" expand="block" size="large">Analyseer</ion-button>
      <ion-button id="re-pick" expand="block" fill="clear" color="medium">Andere foto</ion-button>`;
    body.querySelector('#do-analyse').addEventListener('click', analyse);
    body.querySelector('#re-pick').addEventListener('click', () => {
      URL.revokeObjectURL(url);
      showPicker();
    });
  };

  const analyse = async () => {
    if (!isConfigured()) {
      modal.dismiss();
      const ok = await confirmAlert({
        header: 'Azure AI nog niet ingesteld',
        message: 'Vul eerst je Azure-endpoint en API-sleutel in bij Instellingen.',
        confirmText: 'Naar instellingen',
        color: 'primary',
      });
      if (ok) location.hash = '#/instellingen';
      return;
    }

    body.innerHTML = `
      <div class="analyse-state">
        <ion-spinner name="crescent" class="analyse-spinner"></ion-spinner>
        <h2>Analyseren</h2>
        <p id="analyse-text">${ANALYSE_TEXTS[0]}</p>
      </div>`;
    let i = 0;
    rotator = setInterval(() => {
      const el = body.querySelector('#analyse-text');
      if (el) el.textContent = ANALYSE_TEXTS[++i % ANALYSE_TEXTS.length];
    }, 2200);

    try {
      const dataUrl = await blobToDataUrl(photoBlob);
      const analysis = await analyzePlant(dataUrl, plant.name);
      clearInterval(rotator);
      await db.addEntry({ plantId: plant.id, photo: photoBlob, analysis });
      await modal.dismiss();
      toast('Analyse opgeslagen', 'success');
      renderPlantDetail(plant.id);
    } catch (err) {
      clearInterval(rotator);
      body.innerHTML = `
        <div class="analyse-state">
          <div class="icon-circle danger"><ion-icon name="alert-circle-outline"></ion-icon></div>
          <h2>Analyse mislukt</h2>
          <p class="error-text">${esc(err.message)}</p>
          <ion-button id="retry" expand="block">Opnieuw proberen</ion-button>
          <ion-button id="save-anyway" expand="block" fill="clear" color="medium">Foto opslaan zonder analyse</ion-button>
        </div>`;
      body.querySelector('#retry').addEventListener('click', analyse);
      body.querySelector('#save-anyway').addEventListener('click', async () => {
        await db.addEntry({ plantId: plant.id, photo: photoBlob, analysis: null });
        await modal.dismiss();
        toast('Foto opgeslagen', 'medium');
        renderPlantDetail(plant.id);
      });
    }
  };

  showPicker();
}

function openEntryDetail(entry, plant) {
  const a = entry.analysis;
  const modal = createModal(`
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>${esc(plant.name)}</ion-title>
        <ion-buttons slot="end">
          <ion-button id="close-entry" aria-label="Sluiten">
            <ion-icon slot="icon-only" name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <img class="entry-photo" src="${photoUrl(entry.photo)}" alt="Foto van ${esc(plant.name)}" />
      <p class="entry-date">${formatDate(entry.createdAt)}${a?.plantsoort ? ` · ${esc(a.plantsoort)}` : ''}</p>
      ${a ? `
        <div class="surface-card hero-card compact">
          ${scoreRing(a.gezondheidsscore, 92)}
          <div class="hero-info">
            ${statusLine(a)}
            ${a.denktokens ? `<span class="think-note"><ion-icon name="bulb-outline"></ion-icon>AI redeneerde ${a.denktokens.toLocaleString('nl-NL')} denktokens${a.denkniveau ? ` (niveau: ${esc(a.denkniveau)})` : ''}</span>` : ''}
          </div>
        </div>
        ${a.diagnose ? `<h3 class="entry-h">Diagnose</h3><p class="entry-text">${esc(a.diagnose)}</p>` : ''}
        ${a.problemen.length ? `
          <h3 class="entry-h">Problemen</h3>
          <ul class="entry-list">${a.problemen.map((p) => `<li><ion-icon name="alert-circle" class="li-warn"></ion-icon><span>${esc(p)}</span></li>`).join('')}</ul>` : ''}
        ${a.advies.length ? `
          <h3 class="entry-h">Advies</h3>
          <ul class="entry-list">${a.advies.map((t) => `<li><ion-icon name="checkmark-circle" class="li-ok"></ion-icon><span>${esc(t)}</span></li>`).join('')}</ul>` : ''}
      ` : '<p class="entry-text">Voor deze foto is geen analyse beschikbaar.</p>'}
      <div class="bottom-spacer"></div>
    </ion-content>`);
  modal.present().then(() => animateRings(modal));
  modal.querySelector('#close-entry').addEventListener('click', () => modal.dismiss());
}

/* ---------- instellingen ---------- */

function renderSettings() {
  const s = getSettings();
  app.innerHTML = `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button id="btn-back" aria-label="Terug">
            <ion-icon slot="icon-only" name="chevron-back"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page-title"><h1>Instellingen</h1></div>
      <ion-list inset>
        <ion-list-header><ion-label>Azure AI</ion-label></ion-list-header>
        <ion-item>
          <ion-icon slot="start" name="globe-outline" aria-hidden="true"></ion-icon>
          <ion-input id="set-endpoint" label="Endpoint" label-placement="stacked" type="url" inputmode="url"
            placeholder="https://mijn-resource.openai.azure.com" value="${esc(s.endpoint)}" autocapitalize="off"></ion-input>
        </ion-item>
        <ion-item>
          <ion-icon slot="start" name="cube-outline" aria-hidden="true"></ion-icon>
          <ion-input id="set-deployment" label="Deployment (model)" label-placement="stacked"
            placeholder="gpt-5.4-mini" value="${esc(s.deployment)}" autocapitalize="off"></ion-input>
        </ion-item>
        <ion-item>
          <ion-icon slot="start" name="bulb-outline" aria-hidden="true"></ion-icon>
          <ion-select id="set-reasoning" label="Denk-niveau (AI-redenering)" label-placement="stacked"
            interface="popover" value="${esc(s.reasoning)}">
            <ion-select-option value="minimal">Minimaal — snelst</ion-select-option>
            <ion-select-option value="low">Laag</ion-select-option>
            <ion-select-option value="medium">Gemiddeld — aanbevolen</ion-select-option>
            <ion-select-option value="high">Hoog — grondigst</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-icon slot="start" name="key-outline" aria-hidden="true"></ion-icon>
          <ion-input id="set-key" label="API-sleutel" label-placement="stacked" type="password"
            placeholder="••••••••" value="${esc(s.apiKey)}" autocapitalize="off"></ion-input>
          <ion-button id="toggle-key" slot="end" fill="clear" aria-label="Toon sleutel">
            <ion-icon slot="icon-only" name="eye-outline"></ion-icon>
          </ion-button>
        </ion-item>
        <ion-item>
          <ion-icon slot="start" name="options-outline" aria-hidden="true"></ion-icon>
          <ion-input id="set-version" label="API-versie" label-placement="stacked"
            placeholder="v1" value="${esc(s.apiVersion)}" autocapitalize="off"></ion-input>
        </ion-item>
      </ion-list>

      <div class="ion-padding-horizontal">
        <ion-button id="btn-save" expand="block">Opslaan</ion-button>
        <ion-button id="btn-test" expand="block" fill="outline">Test verbinding</ion-button>
      </div>

      <div class="surface-card info-card">
        <div class="info-row">
          <ion-icon name="lock-closed-outline"></ion-icon>
          <p>Je sleutel wordt alleen op dit toestel bewaard, nooit op GitHub.</p>
        </div>
        <div class="info-row">
          <ion-icon name="information-circle-outline"></ion-icon>
          <p>Maak in de <a href="https://portal.azure.com" target="_blank" rel="noopener">Azure Portal</a> een <em>Azure OpenAI</em>-resource, deploy een goedkoop vision-model (bijv. <code>gpt-5.4-mini</code>) en kopieer endpoint en sleutel hierheen. Bij gpt-5/o-modellen denkt de AI eerst na; het denk-niveau bepaalt hoe grondig.</p>
        </div>
      </div>

      <div class="ion-padding-horizontal">
        <ion-button id="btn-logout" expand="block" fill="clear" color="danger">Uitloggen</ion-button>
      </div>
      <p class="version-footer">Plantgezondheid · draait volledig op je eigen toestel</p>
      <div class="bottom-spacer"></div>
    </ion-content>`;

  app.querySelector('#btn-back').addEventListener('click', () => (location.hash = '#/planten'));

  app.querySelector('#toggle-key').addEventListener('click', () => {
    const input = app.querySelector('#set-key');
    const icon = app.querySelector('#toggle-key ion-icon');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    icon.name = show ? 'eye-off-outline' : 'eye-outline';
  });

  const readForm = () => ({
    endpoint: (app.querySelector('#set-endpoint').value ?? '').trim(),
    deployment: (app.querySelector('#set-deployment').value ?? '').trim(),
    apiKey: (app.querySelector('#set-key').value ?? '').trim(),
    apiVersion: (app.querySelector('#set-version').value ?? '').trim() || 'v1',
    reasoning: app.querySelector('#set-reasoning').value || 'medium',
  });

  // Toon na het opslaan de genormaliseerde waarden (bijv. een geplakte
  // "Target URI" wordt uitgesplitst in endpoint + deployment + api-versie).
  const syncForm = () => {
    const saved = getSettings();
    app.querySelector('#set-endpoint').value = saved.endpoint;
    app.querySelector('#set-deployment').value = saved.deployment;
    app.querySelector('#set-version').value = saved.apiVersion;
  };

  app.querySelector('#btn-save').addEventListener('click', () => {
    saveSettings(readForm());
    syncForm();
    toast('Instellingen opgeslagen', 'success');
  });

  app.querySelector('#btn-test').addEventListener('click', async () => {
    saveSettings(readForm());
    syncForm();
    const btn = app.querySelector('#btn-test');
    btn.disabled = true;
    btn.innerHTML = '<ion-spinner name="dots"></ion-spinner>';
    try {
      await testConnection();
      toast('Verbinding werkt', 'success');
    } catch (err) {
      toast(err.message, 'danger', 5000);
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Test verbinding';
    }
  });

  app.querySelector('#btn-logout').addEventListener('click', () => {
    logout();
    location.hash = '#/login';
  });
}

/* ---------- router ---------- */

async function render() {
  revokeUrls();
  const hash = location.hash || '#/planten';

  if (!isLoggedIn()) {
    if (hash !== '#/login') {
      location.hash = '#/login';
      return;
    }
    renderLogin();
    return;
  }
  if (hash === '#/login') {
    location.hash = '#/planten';
    return;
  }

  const plantMatch = hash.match(/^#\/plant\/(.+)$/);
  if (plantMatch) {
    await renderPlantDetail(decodeURIComponent(plantMatch[1]));
  } else if (hash === '#/instellingen') {
    renderSettings();
  } else {
    await renderPlants();
  }
}

window.addEventListener('hashchange', render);
customElements.whenDefined('ion-app').then(render);
