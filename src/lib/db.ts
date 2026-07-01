import { openDB, DBSchema } from 'idb';

export interface MaternaPatientData {
  age: number;
  systolicBP: number;
  diastolicBP: number;
  bloodSugar: number;
  bodyTemp: number;
  heartRate: number;
}

export interface TopFactor {
  feature: string;
  impact: string;
  magnitude: number;
  value: number;
}

export interface PredictionResult {
  risk_class: number;
  risk_label: 'Low' | 'Medium' | 'High';
  confidence: number;
  top_factors: TopFactor[];
  recommendation: string;
}

export interface MaternaSyncRecord {
  id?: number;
  historyId?: number;
  data: MaternaPatientData;
  timestamp: number;
}

export interface MaternaHistoryRecord {
  id?: number;
  data: MaternaPatientData;
  result?: PredictionResult;
  status: 'pending' | 'synced' | 'failed';
  timestamp: number;
}

interface MaternaDB extends DBSchema {
  'sync-queue': {
    key: number;
    value: MaternaSyncRecord;
    indexes: { 'by-timestamp': number };
  };
  'history': {
    key: number;
    value: MaternaHistoryRecord;
    indexes: { 'by-timestamp': number };
  };
}

export async function initDB() {
  return openDB<MaternaDB>('MaternaDatabase', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const store = db.createObjectStore('sync-queue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-timestamp', 'timestamp');
      }
      if (oldVersion < 2) {
        const historyStore = db.createObjectStore('history', {
          keyPath: 'id',
          autoIncrement: true,
        });
        historyStore.createIndex('by-timestamp', 'timestamp');
      }
    },
  });
}

export async function enqueueRecord(data: MaternaPatientData, historyId?: number) {
  const db = await initDB();
  await db.add('sync-queue', {
    data,
    historyId,
    timestamp: Date.now(),
  });
}

export async function getSyncQueue() {
  const db = await initDB();
  return db.getAllFromIndex('sync-queue', 'by-timestamp');
}

export async function removeRecord(id: number) {
  const db = await initDB();
  await db.delete('sync-queue', id);
}

export async function addHistoryRecord(record: Omit<MaternaHistoryRecord, 'id'>) {
  const db = await initDB();
  return db.add('history', record);
}

export async function getHistory() {
  const db = await initDB();
  const all = await db.getAllFromIndex('history', 'by-timestamp');
  return all.reverse(); // Newest first
}

export async function getHistoryRecord(id: number) {
  const db = await initDB();
  return db.get('history', id);
}

export async function updateHistoryRecord(record: MaternaHistoryRecord) {
  const db = await initDB();
  return db.put('history', record);
}
