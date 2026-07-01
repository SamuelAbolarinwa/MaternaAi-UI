/**
 * MaternaAI — IndexedDB Offline Storage Module
 * -----------------------------------------------
 * Handles everything that needs to survive without internet:
 *
 *   1. Patient records (created locally, synced to server)
 *   2. Visit records (stored locally immediately, synced when online)
 *   3. Offline submission queue (failed API calls waiting to retry)
 *
 * Why IndexedDB and not localStorage?
 *   localStorage is synchronous and limited to ~5MB of strings.
 *   IndexedDB is async, supports structured data, and can hold much more.
 *   For a clinical app that could accumulate months of visit records, this matters.
 *
 * Usage (import in your React app):
 *   import db from './db';
 *   await db.init();
 *   const patient = await db.upsertPatient('ANC-00123');
 *   await db.saveVisit({ patientId: 'ANC-00123', ... });
 *   const visits = await db.getVisitsForPatient('ANC-00123');
 *   await db.enqueue({ type: 'visit', payload: { ... } });
 *   await db.flushQueue(apiBaseUrl);
 */

const DB_NAME    = 'maternaai_db';
const DB_VERSION = 1;

let _db = null;

/** Opens the IndexedDB database and creates object stores on first run. */
function init() {
  return new Promise((resolve, reject) => {
    if (_db) { resolve(_db); return; }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // onupgradeneeded fires when the DB is created for the first time,
    // or when DB_VERSION is bumped. This is where we define the schema.
    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // patients store: keyed by patient_id (the clinic-generated ID like "ANC-00123")
      if (!db.objectStoreNames.contains('patients')) {
        const patientStore = db.createObjectStore('patients', { keyPath: 'patientId' });
        patientStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // visits store: keyed by a client-generated UUID
      // Each visit links to a patient via patientId (indexed for fast lookup)
      if (!db.objectStoreNames.contains('visits')) {
        const visitStore = db.createObjectStore('visits', { keyPath: 'visitId' });
        visitStore.createIndex('patientId', 'patientId', { unique: false });
        visitStore.createIndex('timestamp', 'timestamp', { unique: false });
        // synced: false means the record is local-only and needs to be POSTed to the server
        visitStore.createIndex('synced', 'synced', { unique: false });
      }

      // queue store: offline API calls waiting to be retried when connection returns
      if (!db.objectStoreNames.contains('queue')) {
        const queueStore = db.createObjectStore('queue', {
          keyPath: 'queueId',
          autoIncrement: true,  // auto-incrementing integer key
        });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess  = (e) => { _db = e.target.result; resolve(_db); };
    request.onerror    = (e) => reject(e.target.error);
  });
}

/** Helper: runs a transaction and returns a promise. */
function tx(storeName, mode, fn) {
  return init().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store       = transaction.objectStore(storeName);
      const request     = fn(store);

      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror   = (e) => reject(e.target.error);
    });
  });
}

// ── Patient operations ────────────────────────────────────────────────────────

/**
 * Creates a patient if they don't exist, or returns existing record.
 * @param {string} patientId - clinic-generated ID, e.g. "ANC-00123"
 * @returns {Promise<{ patientId, createdAt, isNew }>}
 */
async function upsertPatient(patientId, patientName = null) {
  const db  = await init();
  const existing = await tx('patients', 'readonly', (store) => store.get(patientId));

  if (existing) {
    if (patientName && existing.patientName !== patientName) {
      const updated = { ...existing, patientName };
      await tx('patients', 'readwrite', (store) => store.put(updated));
      return { ...updated, isNew: false };
    }
    return { ...existing, isNew: false };
  }

  const record = { patientId, patientName, createdAt: new Date().toISOString() };
  await tx('patients', 'readwrite', (store) => store.put(record));
  return { ...record, isNew: true };
}

/**
 * Returns all patients, sorted by most recently created.
 * @returns {Promise<Array>}
 */
async function getAllPatients() {
  const db = await init();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('patients', 'readonly');
    const store       = transaction.objectStore('patients');
    const request     = store.getAll();
    request.onsuccess = (e) => resolve(
      e.target.result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
    request.onerror = (e) => reject(e.target.error);
  });
}

// ── Visit operations ──────────────────────────────────────────────────────────

/**
 * Saves a completed visit to local IndexedDB.
 * Always saves locally first — the caller is responsible for then
 * calling saveVisitToServer() or enqueuing if offline.
 *
 * @param {object} visit - { patientId, inputData, riskClass, riskLabel,
 *                           confidence, flags, topFactors, recommendation }
 * @returns {Promise<string>} - the visitId
 */
async function saveVisitLocally(visit) {
  const visitId  = crypto.randomUUID();
  const record = {
    visitId,
    patientId:      visit.patientId,
    timestamp:      new Date().toISOString(),
    inputData:      visit.inputData,
    riskClass:      visit.riskClass,
    riskLabel:      visit.riskLabel,
    confidence:     visit.confidence,
    flags:          visit.flags          || [],
    topFactors:     visit.topFactors     || [],
    recommendation: visit.recommendation || '',
    synced:         0,    // will be set to 1 after server confirms
  };

  await tx('visits', 'readwrite', (store) => store.put(record));
  return visitId;
}

/**
 * Marks a locally-saved visit as synced with the server.
 * @param {string} visitId
 */
async function markVisitSynced(visitId) {
  const db       = await init();
  const existing = await tx('visits', 'readonly', (store) => store.get(visitId));
  if (!existing) return;
  await tx('visits', 'readwrite', (store) => store.put({ ...existing, synced: 1 }));
}

/**
 * Returns all visits for a patient, sorted chronologically (oldest first).
 * Used to render the risk trend chart and visit history list.
 * @param {string} patientId
 * @returns {Promise<Array>}
 */
async function getVisitsForPatient(patientId) {
  const db = await init();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('visits', 'readonly');
    const index       = transaction.objectStore('visits').index('patientId');
    const request     = index.getAll(patientId);
    request.onsuccess = (e) => resolve(
      e.target.result.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    );
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Returns all visits that haven't been synced to the server yet.
 * @returns {Promise<Array>}
 */
async function getUnsyncedVisits() {
  const db = await init();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('visits', 'readonly');
    const store       = transaction.objectStore('visits');
    const request     = store.getAll();
    request.onsuccess = (e) => resolve(e.target.result.filter(v => v.synced === false || v.synced === 0));
    request.onerror   = (e) => reject(e.target.error);
  });
}

// ── Offline queue operations ───────────────────────────────────────────────────

/**
 * Adds a failed API call to the offline queue for later retry.
 * @param {object} item - { type: 'visit' | 'patient', payload: object }
 */
async function enqueue(item) {
  await tx('queue', 'readwrite', (store) =>
    store.add({ ...item, timestamp: new Date().toISOString(), retryCount: 0 })
  );
}

/**
 * Returns all items currently in the offline queue.
 * @returns {Promise<Array>}
 */
async function getQueue() {
  const db = await init();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('queue', 'readonly');
    const request     = transaction.objectStore('queue').getAll();
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror   = (e) => reject(e.target.error);
  });
}

/** Removes a successfully retried item from the queue. */
async function dequeue(queueId) {
  await tx('queue', 'readwrite', (store) => store.delete(queueId));
}

/**
 * Flushes the offline queue — retries all queued API calls.
 * Called automatically when the browser regains connectivity (online event).
 *
 * @param {string} apiBaseUrl - e.g. "https://maternaai-api.onrender.com"
 * @returns {Promise<{ succeeded: number, failed: number }>}
 */
async function flushQueue(apiBaseUrl) {
  let succeeded = 0;
  let failed = 0;

  try {
    const unsyncedVisits = await getUnsyncedVisits();
    
    for (const visit of unsyncedVisits) {
      if (visit.riskLabel === 'Pending') {
        // Needs prediction
        try {
          const predictResponse = await fetch(`${apiBaseUrl}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(visit.inputData),
          });

          if (predictResponse.ok) {
            const result = await predictResponse.json();
            
            // Update visit
            visit.riskClass = result.risk_class;
            visit.riskLabel = result.risk_label;
            visit.confidence = result.confidence;
            visit.flags = result.clinical_flags || [];
            visit.topFactors = result.top_factors || [];
            visit.recommendation = result.recommendation;
            visit.synced = 1;
            
            await tx('visits', 'readwrite', (store) => store.put(visit));
            succeeded++;
          } else {
            console.error('[MaternaAI] API returned not ok:', predictResponse.status, await predictResponse.text());
            failed++;
          }
        } catch (err) {
          console.error('[MaternaAI] Sync failed for visit:', visit.visitId, err);
          failed++;
        }
      } else {
        // Already has prediction, just mark as synced since we have no backend DB
        visit.synced = 1;
        await tx('visits', 'readwrite', (store) => store.put(visit));
        succeeded++;
      }
    }

    // Also clear the legacy queue if any items are there
    const queue = await getQueue();
    for (const item of queue) {
      if (item.queueId) {
        await dequeue(item.queueId);
      }
    }

  } catch (err) {
    console.error('[MaternaAI] flushQueue error:', err);
  }

  return { succeeded, failed };
}

// ── Main submit flow (used by the React form's onSubmit) ──────────────────────

/**
 * The complete submit flow. Call this from your form's submit handler.
 *
 * Steps:
 *   1. POST to /predict — always attempted first (may fail if offline)
 *   2. Save result locally to IndexedDB immediately
 *   3. POST to /visits to sync with server (or enqueue if offline)
 *
 * @param {string}  apiBaseUrl  - e.g. "https://maternaai-api.onrender.com"
 * @param {string}  patientId   - e.g. "ANC-00123"
 * @param {object}  inputData   - the form values
 * @returns {Promise<{ result, visitId, offline }>}
 */
async function submitVisit(apiBaseUrl, patientId, inputData) {
  let result   = null;
  let offline  = false;
  let visitId  = null;

  // Step 1: Try to get a prediction from the server
  try {
    const predictResponse = await fetch(`${apiBaseUrl}/predict`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(inputData),
    });

    if (!predictResponse.ok) {
      // It's a server error or bad request, not a network failure.
      const errorText = await predictResponse.text();
      throw new Error(`Predict API returned ${predictResponse.status}: ${errorText}`);
    }
    result = await predictResponse.json();

  } catch (err) {
    // If it's our own thrown error from a 4xx/5xx response, rethrow it so it shows in the UI
    if (err.message.startsWith('Predict API returned')) {
      throw err;
    }
    // Otherwise it's a TypeError from fetch (Network/CORS error), treat as offline.
    offline = true;
    
    // Save locally as pending prediction
    visitId = await saveVisitLocally({
      patientId,
      inputData,
      riskClass:      0,
      riskLabel:      'Pending',
      confidence:     0,
      flags:          [],
      topFactors:     [],
      recommendation: 'Waiting for server connection to assess risk.',
    });
    
    await enqueue({ type: 'predict_and_save', payload: { visitId, patientId, inputData } });
    return { result: null, visitId, offline: true };
  }

  // Step 2: Save locally — this always succeeds regardless of connectivity
  visitId = await saveVisitLocally({
    patientId,
    inputData,
    riskClass:      result.risk_class,
    riskLabel:      result.risk_label,
    confidence:     result.confidence,
    flags:          result.clinical_flags,
    topFactors:     result.top_factors,
    recommendation: result.recommendation,
  });

  // Since we don't have a backend DB, we just mark it as synced immediately
  await markVisitSynced(visitId);

  return { result, visitId, offline: false };
}

// ── Listen for network recovery and auto-flush ─────────────────────────────────
// This wires up automatically when the module is imported.
// When the browser comes back online, the queue is flushed silently.
let _apiBaseUrl = null;

function setApiBaseUrl(url) {
  _apiBaseUrl = url;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (_apiBaseUrl) {
      flushQueue(_apiBaseUrl).then(({ succeeded, failed }) => {
        if (succeeded > 0) {
          console.log(`[MaternaAI] Synced ${succeeded} queued item(s) after reconnection.`);
        }
      });
    }
  });
}

// ── Exports ───────────────────────────────────────────────────────────────────
const db = {
  init,
  upsertPatient,
  getAllPatients,
  saveVisitLocally,
  markVisitSynced,
  getVisitsForPatient,
  getUnsyncedVisits,
  enqueue,
  getQueue,
  dequeue,
  flushQueue,
  submitVisit,
  setApiBaseUrl,
};

export default db;
