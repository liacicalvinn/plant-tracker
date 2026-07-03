// Azure OpenAI-integratie. De instellingen (endpoint, deployment, sleutel) worden
// uitsluitend in localStorage van dit toestel bewaard — nooit in de publieke repo.
//
// Ondersteunt reasoning-modellen (gpt-5-serie, o-serie): die "denken" eerst na
// (reasoning_effort) en hebben daarvoor een ruim max_completion_tokens-budget
// nodig, omdat denktokens meetellen in dat budget.

const SETTINGS_KEY = 'pg_azure';

export const DEFAULT_SETTINGS = {
  endpoint: '',
  deployment: 'gpt-5.4-mini',
  apiVersion: 'v1',
  apiKey: '',
  reasoning: 'medium',
};

// Oudere installaties hadden deze api-versie als standaard; de v1-API is nodig
// voor de nieuwste (reasoning-)modellen, dus migreren we die stilzwijgend.
const LEGACY_DEFAULT_API_VERSION = '2024-10-21';

export function getSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    if (stored.apiVersion === LEGACY_DEFAULT_API_VERSION) delete stored.apiVersion;
    return { ...DEFAULT_SETTINGS, ...stored };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function isConfigured() {
  const s = getSettings();
  return Boolean(s.endpoint && s.deployment && s.apiKey);
}

export function isReasoningModel(deployment = getSettings().deployment) {
  return /(gpt-5|(^|[^a-z0-9])o\d)/i.test(deployment);
}

function usesV1Api(s) {
  return (s.apiVersion || 'v1').trim() === 'v1';
}

function buildUrl(s) {
  const endpoint = s.endpoint.trim().replace(/\/+$/, '');
  if (usesV1Api(s)) {
    return `${endpoint}/openai/v1/chat/completions`;
  }
  return `${endpoint}/openai/deployments/${encodeURIComponent(s.deployment.trim())}/chat/completions?api-version=${encodeURIComponent(s.apiVersion.trim())}`;
}

const SYSTEM_PROMPT = `Je bent een ervaren botanist en plantendokter. Je analyseert een foto van een kamerplant of tuinplant en beoordeelt de gezondheid.
Denk eerst zorgvuldig na over alles wat er op de foto te zien is (soortkenmerken, bladkleur, vlekken, structuur, potgrond, standplaats) voordat je oordeelt.
Antwoord UITSLUITEND met geldige JSON (geen markdown, geen toelichting) in exact deze structuur:
{
  "plantsoort": "vermoedelijke soort (Nederlandse naam, evt. Latijnse naam erbij)",
  "gezondheidsscore": <geheel getal 0-100>,
  "status": "gezond" | "aandacht" | "ziek",
  "diagnose": "korte diagnose in 2-3 zinnen, in het Nederlands",
  "problemen": ["waargenomen probleem", ...] ,
  "advies": ["concreet verzorgingsadvies", ...]
}
Richtlijn voor status: 75-100 = "gezond", 45-74 = "aandacht", 0-44 = "ziek".
Geef 3 tot 5 concrete adviezen. Als er geen problemen zijn, geef een lege lijst bij "problemen".
Als de foto geen plant bevat, geef dan gezondheidsscore 0, status "ziek" en leg dit uit in de diagnose.`;

async function chat(messages, maxTokens) {
  const s = getSettings();
  if (!isConfigured()) {
    throw new Error('Azure AI is nog niet ingesteld. Ga naar Instellingen.');
  }

  const base = usesV1Api(s) ? { model: s.deployment.trim(), messages } : { messages };
  const reasoning = isReasoningModel(s.deployment);

  // Modern verzoek: max_completion_tokens + denk-niveau voor reasoning-modellen.
  // Reasoning-modellen accepteren alleen de standaardtemperatuur.
  const modern = { ...base, max_completion_tokens: maxTokens };
  if (reasoning) {
    if (s.reasoning) modern.reasoning_effort = s.reasoning;
  } else {
    modern.temperature = 0.2;
  }

  let response = await postJson(buildUrl(s), s.apiKey, modern);

  if (!response.ok) {
    const errText = await response.text();
    // Oudere api-versies/modellen kennen max_completion_tokens of reasoning_effort niet
    if (/max_completion_tokens|reasoning_effort|unrecognized|unsupported|unknown parameter/i.test(errText)) {
      const legacy = { ...base, max_tokens: maxTokens, temperature: 0.2 };
      response = await postJson(buildUrl(s), s.apiKey, legacy);
      if (!response.ok) throw await httpError(response);
    } else {
      throw httpErrorFromText(response.status, errText);
    }
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    const finish = data?.choices?.[0]?.finish_reason;
    throw new Error(finish === 'length'
      ? 'Het denkbudget raakte op voordat er een antwoord kwam. Zet het denk-niveau lager in Instellingen en probeer opnieuw.'
      : 'Het AI-model gaf een leeg antwoord terug.');
  }
  return { content, usage: data?.usage ?? null };
}

function postJson(url, apiKey, body) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(body),
  });
}

async function httpError(response) {
  return httpErrorFromText(response.status, await response.text());
}

function httpErrorFromText(status, text) {
  let detail = '';
  try {
    detail = JSON.parse(text)?.error?.message ?? '';
  } catch {
    detail = text?.slice(0, 200) ?? '';
  }
  const hints = {
    401: 'Controleer je API-sleutel in Instellingen.',
    403: 'Geen toegang — controleer je API-sleutel en Azure-resource.',
    404: 'Deployment niet gevonden — controleer endpoint en deploymentnaam in Instellingen.',
    429: 'Limiet bereikt — probeer het zo weer.',
  };
  const hint = hints[status] ?? '';
  return new Error(`Azure-fout (${status}). ${hint} ${detail}`.trim());
}

function parseAnalysis(content) {
  let text = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) text = text.slice(start, end + 1);

  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    // Model hield zich niet aan JSON: toon de tekst dan als diagnose.
    return {
      plantsoort: '',
      gezondheidsscore: null,
      status: 'aandacht',
      diagnose: content.trim(),
      problemen: [],
      advies: [],
    };
  }

  const score = Number(raw.gezondheidsscore);
  const validScore = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null;
  const status = ['gezond', 'aandacht', 'ziek'].includes(raw.status)
    ? raw.status
    : validScore == null ? 'aandacht' : validScore >= 75 ? 'gezond' : validScore >= 45 ? 'aandacht' : 'ziek';

  return {
    plantsoort: typeof raw.plantsoort === 'string' ? raw.plantsoort : '',
    gezondheidsscore: validScore,
    status,
    diagnose: typeof raw.diagnose === 'string' ? raw.diagnose : '',
    problemen: Array.isArray(raw.problemen) ? raw.problemen.filter((p) => typeof p === 'string') : [],
    advies: Array.isArray(raw.advies) ? raw.advies.filter((a) => typeof a === 'string') : [],
  };
}

export async function analyzePlant(photoDataUrl, plantName = '') {
  const userText = plantName
    ? `Analyseer de gezondheid van deze plant. De eigenaar noemt hem "${plantName}".`
    : 'Analyseer de gezondheid van deze plant.';

  // Ruim budget: bij reasoning-modellen tellen de denktokens hierin mee.
  const { content, usage } = await chat(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: userText },
          { type: 'image_url', image_url: { url: photoDataUrl, detail: 'auto' } },
        ],
      },
    ],
    5000,
  );

  const analysis = parseAnalysis(content);
  const denktokens = usage?.completion_tokens_details?.reasoning_tokens;
  if (Number.isFinite(denktokens) && denktokens > 0) {
    analysis.denktokens = denktokens;
    analysis.denkniveau = getSettings().reasoning;
  }
  return analysis;
}

export async function testConnection() {
  const { content } = await chat(
    [{ role: 'user', content: 'Antwoord met precies één woord: OK' }],
    1000,
  );
  return content.trim();
}
