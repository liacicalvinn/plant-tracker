// Azure OpenAI-integratie. De instellingen (endpoint, deployment, sleutel) worden
// uitsluitend in localStorage van dit toestel bewaard — nooit in de publieke repo.

const SETTINGS_KEY = 'pg_azure';

export const DEFAULT_SETTINGS = {
  endpoint: '',
  deployment: 'gpt-4.1-mini',
  apiVersion: '2024-10-21',
  apiKey: '',
};

export function getSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
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

function buildUrl(s) {
  const endpoint = s.endpoint.trim().replace(/\/+$/, '');
  return `${endpoint}/openai/deployments/${encodeURIComponent(s.deployment.trim())}/chat/completions?api-version=${encodeURIComponent(s.apiVersion.trim())}`;
}

const SYSTEM_PROMPT = `Je bent een ervaren botanist en plantendokter. Je analyseert een foto van een kamerplant of tuinplant en beoordeelt de gezondheid.
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

  const body = {
    messages,
    max_tokens: maxTokens,
    temperature: 0.2,
  };

  let response = await postJson(buildUrl(s), s.apiKey, body);

  // Nieuwere modellen (o.a. gpt-5-serie) accepteren alleen max_completion_tokens.
  if (!response.ok) {
    const errText = await response.text();
    if (/max_tokens|max_completion_tokens|temperature/i.test(errText)) {
      const retryBody = { messages, max_completion_tokens: maxTokens };
      response = await postJson(buildUrl(s), s.apiKey, retryBody);
      if (!response.ok) throw await httpError(response);
    } else {
      throw httpErrorFromText(response.status, errText);
    }
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Het AI-model gaf een leeg antwoord terug.');
  return content;
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

  const content = await chat(
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
    900,
  );
  return parseAnalysis(content);
}

export async function testConnection() {
  const content = await chat(
    [{ role: 'user', content: 'Antwoord met precies één woord: OK' }],
    20,
  );
  return content.trim();
}
