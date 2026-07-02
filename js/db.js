// IndexedDB-opslag: alles blijft op het toestel, geen server of database nodig.
// stores: plants  {id, name, species, createdAt}
//         entries {id, plantId, createdAt, photo: Blob, analysis: object|null}

const DB_NAME = 'plantgezondheid';
const DB_VERSION = 1;

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('plants')) {
        db.createObjectStore('plants', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('entries')) {
        const store = db.createObjectStore('entries', { keyPath: 'id' });
        store.createIndex('byPlant', 'plantId');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(db, store, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const result = fn(t.objectStore(store));
    t.oncomplete = () => resolve(result?.result ?? result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function getAllPlants() {
  const db = await openDb();
  const plants = await tx(db, 'plants', 'readonly', (s) => s.getAll());
  return plants.sort((a, b) => a.name.localeCompare(b.name, 'nl'));
}

export async function getPlant(id) {
  const db = await openDb();
  return tx(db, 'plants', 'readonly', (s) => s.get(id));
}

export async function addPlant({ name, species = '' }) {
  const db = await openDb();
  const plant = { id: newId(), name, species, createdAt: Date.now() };
  await tx(db, 'plants', 'readwrite', (s) => s.put(plant));
  return plant;
}

export async function deletePlant(id) {
  const db = await openDb();
  const entries = await getEntries(id);
  await Promise.all(entries.map((e) => deleteEntry(e.id)));
  await tx(db, 'plants', 'readwrite', (s) => s.delete(id));
}

export async function addEntry({ plantId, photo, analysis = null }) {
  const db = await openDb();
  const entry = { id: newId(), plantId, createdAt: Date.now(), photo, analysis };
  await tx(db, 'entries', 'readwrite', (s) => s.put(entry));
  return entry;
}

export async function getEntries(plantId) {
  const db = await openDb();
  const entries = await new Promise((resolve, reject) => {
    const t = db.transaction('entries', 'readonly');
    const req = t.objectStore('entries').index('byPlant').getAll(plantId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return entries.sort((a, b) => b.createdAt - a.createdAt); // nieuwste eerst
}

export async function getLatestEntry(plantId) {
  const entries = await getEntries(plantId);
  return entries[0] ?? null;
}

export async function deleteEntry(id) {
  const db = await openDb();
  await tx(db, 'entries', 'readwrite', (s) => s.delete(id));
}
