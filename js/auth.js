// Eenvoudige client-side login. Let op: op een statische site is dit alleen een
// drempel tegen toevallige bezoekers — de echt gevoelige data (API-sleutel)
// staat uitsluitend in de browseropslag van het eigen toestel.

const AUTH_HASH = '6277d67ed5ecb9f0f80d7b64aa95a087ad038349681a45ff5e22625ba8550796';
const SESSION_KEY = 'pg_session';

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function login(username, password) {
  const hash = await sha256(`${username.trim().toLowerCase()}:${password}`);
  if (hash !== AUTH_HASH) return false;
  sessionStorage.setItem(SESSION_KEY, '1');
  return true;
}

export function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}
