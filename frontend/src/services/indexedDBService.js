import { openDB } from 'idb';

const DB_NAME = 'MovensyncDB';
const DB_VERSION = 1;
const FLOOR_PLANS_STORE = 'floor_plans';

// Initialize IndexedDB
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create floor plans store if it doesn't exist
      if (!db.objectStoreNames.contains(FLOOR_PLANS_STORE)) {
        const store = db.createObjectStore(FLOOR_PLANS_STORE, { keyPath: 'id' });
        store.createIndex('hasLocalChanges', 'hasLocalChanges');
        store.createIndex('lastSynced', 'lastSynced');
      }
    },
  });
};

const indexedDBService = {
  // Get floor plan from IndexedDB
  getFloorPlan: async (id) => {
    try {
      const db = await initDB();
      return await db.get(FLOOR_PLANS_STORE, id);
    } catch (error) {
      console.error('Error getting floor plan from IndexedDB:', error);
      return null;
    }
  },

  // Get all floor plans from IndexedDB
  getAllFloorPlans: async () => {
    try {
      const db = await initDB();
      return await db.getAll(FLOOR_PLANS_STORE);
    } catch (error) {
      console.error('Error getting all floor plans from IndexedDB:', error);
      return [];
    }
  },

  // Save floor plan to IndexedDB
  saveFloorPlan: async (floorPlan, hasLocalChanges = false) => {
    try {
      const db = await initDB();
      const data = {
        id: floorPlan.id,
        data: floorPlan,
        hasLocalChanges,
        lastSynced: hasLocalChanges ? null : new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      await db.put(FLOOR_PLANS_STORE, data);
      return data;
    } catch (error) {
      console.error('Error saving floor plan to IndexedDB:', error);
      throw error;
    }
  },

  // Mark floor plan as synced
  markAsSynced: async (id) => {
    try {
      const db = await initDB();
      const existing = await db.get(FLOOR_PLANS_STORE, id);
      if (existing) {
        existing.hasLocalChanges = false;
        existing.lastSynced = new Date().toISOString();
        await db.put(FLOOR_PLANS_STORE, existing);
      }
    } catch (error) {
      console.error('Error marking floor plan as synced:', error);
    }
  },

  // Get all floor plans with local changes (unsynced)
  getUnsyncedFloorPlans: async () => {
    try {
      const db = await initDB();
      const index = db.transaction(FLOOR_PLANS_STORE).store.index('hasLocalChanges');
      return await index.getAll(true);
    } catch (error) {
      console.error('Error getting unsynced floor plans:', error);
      return [];
    }
  },

  // Delete floor plan from IndexedDB
  deleteFloorPlan: async (id) => {
    try {
      const db = await initDB();
      await db.delete(FLOOR_PLANS_STORE, id);
    } catch (error) {
      console.error('Error deleting floor plan from IndexedDB:', error);
    }
  },

  // Clear all floor plans from IndexedDB
  clearAll: async () => {
    try {
      const db = await initDB();
      await db.clear(FLOOR_PLANS_STORE);
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
    }
  }
};

export default indexedDBService;
