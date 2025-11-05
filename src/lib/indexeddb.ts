const DB_NAME = 'dailyReportDB';
const DB_VERSION = 1;
const STORE_NAME = 'settings';

interface StoredData {
  workTimes?: any[];
  customVariables?: { [key: string]: any };
  // Add other settings here as needed
}

let db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function getFromIndexedDB<T>(key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result as T);
    };

    request.onerror = (event) => {
      console.error("Error getting data from IndexedDB:", (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
}

export async function setToIndexedDB<T>(key: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error("Error setting data to IndexedDB:", (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
}
