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

async function toast(message, color = 'dark', duration = 2400) {
  const t = document.createElement('ion-toast');
  Object.assign(t, { message, color, duration, position: 'top', swipeGesture: 'vertical' });
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
    alert.addEventListener('didDismiss', () => alert.remove());
    document.body.appendChild(alert);
    alert.present();
  });
}

function createModal(innerHTML, opts = {}) {
  const modal = document.createElement('ion-modal');
  Object.assign(modal, opts);
  modal.innerHTML = innerHTML;
  modal.addEventListener('didDismiss', () => modal.remove());
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

function scoreRing(score, size = 116) {
  const stroke = 10;
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
      <text x="50%" y="50%" dy="0.1em" class="ring-score" text-anchor="middle" dominant-baseline="middle">${label}</text>
      <text x="50%" y="50%" dy="1.9em" class="ring-sub" text-anchor="middle">/ 100</text>
    </svg>`;
}

function animateRings(root) {
  requestAnimationFrame(() => {
    root.querySelectorAll('.ring-progress[data-off]').forEach((el) => {
      el.style.strokeDashoffset = el.dataset.off;
    });
  });
}

function sparkline(scores, width = 132, height = 40) {
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
      <polygon points="${pad},${height - pad} ${points.join(' ')} ${last[0]},${height - pad}" fill="${lastColor}" opacity="0.12" />
      <polyline points="${points.join(' ')}" fill="none" stroke="${lastColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="${last[0]}" cy="${last[1]}" r="3.5" fill="${lastColor}" />
    </svg>`;
}

function scoreBadge(analysis) {
  if (!analysis || analysis.gezondheidsscore == null) {
    return `<ion-badge color="medium" class="score-badge">geen analyse</ion-badge>`;
  }
  const { color } = statusOf(analysis);
  return `<ion-badge color="${color}" class="score-badge">♥ ${analysis.gezondheidsscore}</ion-badge>`;
}

/* ---------- views ---------- */

function renderLogin() {
  app.innerHTML = `
    <ion-content class="login-content" fullscreen>
      <div class="login-wrap">
        <div class="login-hero">
          <div class="login-leaf">🌿</div>
          <h1>Plantgezondheid</h1>
          <p>Jouw persoonlijke plantendokter</p>
        </div>
        <ion-card class="login-card">
          <ion-card-content>
            <ion-list lines="none">
              <ion-item>
                <ion-input id="login-user" label="Gebruikersnaam" label-placement="floating"
                  autocomplete="username" autocapitalize="off" enterkeyhint="next"></ion-input>
              </ion-item>
              <ion-item>
                <ion-input id="login-pass" label="Wachtwoord" label-placement="floating" type="password"
                  autocomplete="current-password" enterkeyhint="go"></ion-input>
              </ion-item>
            </ion-list>
            <ion-button id="login-btn" expand="block" size="large" class="ion-margin-top">
              <ion-icon slot="start" name="leaf-outline"></ion-icon>
              Inloggen
            </ion-button>
          </ion-card-content>
        </ion-card>
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
    <ion-header>
      <ion-toolbar>
        <ion-title>🌿 Mijn planten</ion-title>
        <ion-buttons slot="end">
          <ion-button id="btn-settings" aria-label="Instellingen">
            <ion-icon slot="icon-only" name="settings-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" id="refresher">
        <ion-refresher-content pulling-text="Trek om te verversen"></ion-refresher-content>
      </ion-refresher>
      <div id="plant-grid" class="plant-grid">
        ${'<div class="plant-card skeleton"><ion-skeleton-text animated class="skel-photo"></ion-skeleton-text><div class="skel-body"><ion-skeleton-text animated style="width:70%"></ion-skeleton-text><ion-skeleton-text animated style="width:40%"></ion-skeleton-text></div></div>'.repeat(4)}
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

  if (plants.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-emoji">🪴</div>
        <h2>Nog geen planten</h2>
        <p>Voeg je eerste plant toe met de <strong>+</strong> knop en maak een foto voor een AI-gezondheidscheck.</p>
      </div>`;
    return;
  }

  const cards = await Promise.all(plants.map(async (plant) => {
    const latest = await db.getLatestEntry(plant.id);
    const photo = latest ? `<img src="${photoUrl(latest.photo)}" alt="" loading="lazy" />` : `<div class="photo-placeholder">🌱</div>`;
    const meta = latest
      ? `<span class="card-date">${formatDate(latest.createdAt)}</span>`
      : `<span class="card-date">nog geen foto</span>`;
    return `
      <button class="plant-card" data-id="${plant.id}">
        <div class="card-photo">${photo}${scoreBadge(latest?.analysis)}</div>
        <div class="card-body">
          <span class="card-name">${esc(plant.name)}</span>
          ${meta}
        </div>
      </button>`;
  }));
  grid.innerHTML = cards.join('');
  grid.querySelectorAll('.plant-card').forEach((card) => {
    card.addEventListener('click', () => (location.hash = `#/plant/${card.dataset.id}`));
  });
}

function openAddPlant() {
  const alert = document.createElement('ion-alert');
  Object.assign(alert, {
    header: 'Nieuwe plant',
    inputs: [
      { name: 'name', type: 'text', placeholder: 'Naam, bijv. Monstera woonkamer', attributes: { autocapitalize: 'sentences', maxlength: 60 } },
      { name: 'species', type: 'text', placeholder: 'Soort (optioneel)', attributes: { maxlength: 60 } },
    ],
    buttons: [
      { text: 'Annuleer', role: 'cancel' },
      {
        text: 'Toevoegen',
        handler: async (values) => {
          const name = values.name?.trim();
          if (!name) {
            toast('Geef je plant een naam', 'warning');
            return false;
          }
          const plant = await db.addPlant({ name, species: values.species?.trim() ?? '' });
          toast(`🌱 ${name} toegevoegd`, 'success');
          location.hash = `#/plant/${plant.id}`;
          return true;
        },
      },
    ],
  });
  alert.addEventListener('didDismiss', () => alert.remove());
  document.body.appendChild(alert);
  alert.present();
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
  const status = latest?.analysis ? statusOf(latest.analysis) : null;

  app.innerHTML = `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button id="btn-back" aria-label="Terug">
            <ion-icon slot="icon-only" name="chevron-back"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>${esc(plant.name)}</ion-title>
        <ion-buttons slot="end">
          <ion-button id="btn-more" aria-label="Meer opties">
            <ion-icon slot="icon-only" name="ellipsis-horizontal"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="detail-hero">
        ${scoreRing(latest?.analysis?.gezondheidsscore ?? null)}
        <div class="detail-hero-info">
          ${status ? `<ion-badge color="${status.color}">${status.label}</ion-badge>` : '<ion-badge color="medium">Nog geen analyse</ion-badge>'}
          ${plant.species ? `<p class="species">${esc(plant.species)}</p>` : latest?.analysis?.plantsoort ? `<p class="species">${esc(latest.analysis.plantsoort)}</p>` : ''}
          ${sparkline(scoresChrono)}
        </div>
      </div>

      <div class="ion-padding-horizontal">
        <ion-button id="btn-analyse" expand="block" size="large">
          <ion-icon slot="start" name="camera-outline"></ion-icon>
          Nieuwe foto &amp; analyse
        </ion-button>
      </div>

      <ion-list id="timeline" inset>
        <ion-list-header><ion-label>Geschiedenis</ion-label></ion-list-header>
        ${entries.length === 0 ? `
          <div class="empty-state small">
            <div class="empty-emoji">📷</div>
            <p>Maak je eerste foto — de AI vertelt je direct hoe het met <strong>${esc(plant.name)}</strong> gaat.</p>
          </div>` : entries.map((e) => `
          <ion-item-sliding data-entry="${e.id}">
            <ion-item button detail="true" class="timeline-item" data-entry-open="${e.id}">
              <ion-thumbnail slot="start"><img src="${photoUrl(e.photo)}" alt="" loading="lazy" /></ion-thumbnail>
              <ion-label>
                <h3>${e.analysis?.diagnose ? esc(truncate(e.analysis.diagnose, 64)) : 'Geen analyse'}</h3>
                <p>${formatDate(e.createdAt)}</p>
              </ion-label>
              ${scoreBadge(e.analysis)}
            </ion-item>
            <ion-item-options side="end">
              <ion-item-option color="danger" data-entry-del="${e.id}">
                <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>`).join('')}
      </ion-list>
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
      const ok = await confirmAlert({ header: 'Foto verwijderen?', message: 'Deze foto en analyse worden definitief verwijderd.' });
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
  sheet.addEventListener('didDismiss', () => sheet.remove());
  document.body.appendChild(sheet);
  sheet.present();
}

/* ---------- analyse-flow ---------- */

const ANALYSE_TEXTS = [
  'Bladeren bekijken…',
  'Kleur en structuur beoordelen…',
  'Symptomen vergelijken…',
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
        <h2>Nieuwe analyse</h2>
        <p>Maak een duidelijke foto van de hele plant, met goed licht.</p>
      </div>
      <ion-button id="pick-camera" expand="block" size="large">
        <ion-icon slot="start" name="camera-outline"></ion-icon> Maak een foto
      </ion-button>
      <ion-button id="pick-gallery" expand="block" size="large" fill="outline">
        <ion-icon slot="start" name="images-outline"></ion-icon> Kies uit galerij
      </ion-button>`;
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
      <ion-button id="do-analyse" expand="block" size="large">
        <ion-icon slot="start" name="sparkles-outline"></ion-icon> Analyseer
      </ion-button>
      <ion-button id="re-pick" expand="block" fill="clear">Andere foto</ion-button>`;
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
        <div class="pulse-leaf">🌿</div>
        <h2>Analyseren…</h2>
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
      toast('✅ Analyse opgeslagen', 'success');
      renderPlantDetail(plant.id);
    } catch (err) {
      clearInterval(rotator);
      body.innerHTML = `
        <div class="analyse-state">
          <div class="error-emoji">⚠️</div>
          <h2>Analyse mislukt</h2>
          <p class="error-text">${esc(err.message)}</p>
          <ion-button id="retry" expand="block">Opnieuw proberen</ion-button>
          <ion-button id="save-anyway" expand="block" fill="outline">Foto opslaan zonder analyse</ion-button>
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
  const status = a ? statusOf(a) : null;
  const modal = createModal(`
    <ion-header>
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
      <p class="entry-date">${formatDate(entry.createdAt)}</p>
      ${a ? `
        <div class="entry-score">
          ${scoreRing(a.gezondheidsscore, 96)}
          <div>
            <ion-badge color="${status.color}">${status.label}</ion-badge>
            ${a.plantsoort ? `<p class="species">${esc(a.plantsoort)}</p>` : ''}
          </div>
        </div>
        ${a.diagnose ? `<h3 class="entry-h">Diagnose</h3><p class="entry-text">${esc(a.diagnose)}</p>` : ''}
        ${a.problemen.length ? `
          <h3 class="entry-h">Problemen</h3>
          <ul class="entry-list warn">${a.problemen.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
        ${a.advies.length ? `
          <h3 class="entry-h">Advies</h3>
          <ul class="entry-list ok">${a.advies.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
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
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button id="btn-back" aria-label="Terug">
            <ion-icon slot="icon-only" name="chevron-back"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Instellingen</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list inset>
        <ion-list-header><ion-label>Azure AI</ion-label></ion-list-header>
        <ion-item>
          <ion-input id="set-endpoint" label="Endpoint" label-placement="stacked" type="url" inputmode="url"
            placeholder="https://mijn-resource.openai.azure.com" value="${esc(s.endpoint)}" autocapitalize="off"></ion-input>
        </ion-item>
        <ion-item>
          <ion-input id="set-deployment" label="Deployment (model)" label-placement="stacked"
            placeholder="gpt-4.1-mini" value="${esc(s.deployment)}" autocapitalize="off"></ion-input>
        </ion-item>
        <ion-item>
          <ion-input id="set-key" label="API-sleutel" label-placement="stacked" type="password"
            placeholder="••••••••" value="${esc(s.apiKey)}" autocapitalize="off"></ion-input>
          <ion-button id="toggle-key" slot="end" fill="clear" aria-label="Toon sleutel">
            <ion-icon slot="icon-only" name="eye-outline"></ion-icon>
          </ion-button>
        </ion-item>
        <ion-item>
          <ion-input id="set-version" label="API-versie" label-placement="stacked"
            value="${esc(s.apiVersion)}" autocapitalize="off"></ion-input>
        </ion-item>
      </ion-list>

      <div class="ion-padding-horizontal">
        <ion-button id="btn-save" expand="block">
          <ion-icon slot="start" name="save-outline"></ion-icon> Opslaan
        </ion-button>
        <ion-button id="btn-test" expand="block" fill="outline">
          <ion-icon slot="start" name="pulse-outline"></ion-icon> Test verbinding
        </ion-button>
      </div>

      <ion-card class="info-card">
        <ion-card-content>
          <p><strong>🔒 Privé:</strong> je sleutel wordt alleen op dit toestel bewaard, nooit op GitHub.</p>
          <p><strong>💡 Zo kom je aan een sleutel:</strong> maak in de <a href="https://portal.azure.com" target="_blank" rel="noopener">Azure Portal</a> een <em>Azure OpenAI</em>-resource, deploy daar een goedkoop vision-model (bijv. <code>gpt-4.1-mini</code> of <code>gpt-4o-mini</code>) en kopieer het endpoint en sleutel 1 hierheen.</p>
        </ion-card-content>
      </ion-card>

      <div class="ion-padding-horizontal">
        <ion-button id="btn-logout" expand="block" fill="clear" color="danger">
          <ion-icon slot="start" name="log-out-outline"></ion-icon> Uitloggen
        </ion-button>
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
    apiVersion: (app.querySelector('#set-version').value ?? '').trim() || '2024-10-21',
  });

  app.querySelector('#btn-save').addEventListener('click', () => {
    saveSettings(readForm());
    toast('Instellingen opgeslagen', 'success');
  });

  app.querySelector('#btn-test').addEventListener('click', async () => {
    saveSettings(readForm());
    const btn = app.querySelector('#btn-test');
    btn.disabled = true;
    btn.innerHTML = '<ion-spinner name="dots"></ion-spinner>';
    try {
      await testConnection();
      toast('✅ Verbinding werkt!', 'success');
    } catch (err) {
      toast(err.message, 'danger', 5000);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<ion-icon slot="start" name="pulse-outline"></ion-icon> Test verbinding';
    }
  });

  app.querySelector('#btn-logout').addEventListener('click', () => {
    logout();
    toast('Uitgelogd', 'medium');
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
