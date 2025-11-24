import indexedDBService from './indexedDBService';
import floorPlanService from './floorPlanService';

class SyncService {
  constructor() {
    this.syncing = false;
    this.syncQueue = [];
    this.listeners = [];
    this.retryAttempts = new Map(); // Track retry attempts per floor plan
    this.maxRetries = 5;
  }

  // Add listener for sync events
  addListener(listener) {
    this.listeners.push(listener);
  }

  // Remove listener
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // Notify all listeners
  notify(event) {
    this.listeners.forEach(listener => listener(event));
  }

  // Sync a single floor plan
  async syncFloorPlan(floorPlanData) {
    const { id, data } = floorPlanData;

    try {
      // Attempt to save to server
      const response = await floorPlanService.update(id, {
        name: data.name,
        buildingName: data.building_name,
        floorNumber: data.floor_number,
        rooms: data.rooms
      });

      if (response.success) {
        // Mark as synced in IndexedDB
        await indexedDBService.markAsSynced(id);

        // Reset retry attempts
        this.retryAttempts.delete(id);

        return { success: true, id };
      } else {
        throw new Error(response.message || 'Sync failed');
      }
    } catch (error) {
      console.error(`Error syncing floor plan ${id}:`, error);

      // Track retry attempts
      const attempts = this.retryAttempts.get(id) || 0;
      this.retryAttempts.set(id, attempts + 1);

      return { success: false, id, error: error.message };
    }
  }

  // Sync all unsynced floor plans
  async syncAll() {
    if (this.syncing) {
      console.log('Sync already in progress');
      return;
    }

    this.syncing = true;
    this.notify({ type: 'sync_started' });

    try {
      // Get all unsynced floor plans
      const unsyncedPlans = await indexedDBService.getUnsyncedFloorPlans();

      if (unsyncedPlans.length === 0) {
        this.notify({ type: 'sync_completed', syncedCount: 0 });
        this.syncing = false;
        return;
      }

      this.notify({
        type: 'sync_progress',
        total: unsyncedPlans.length,
        current: 0
      });

      let successCount = 0;
      let failedPlans = [];

      // Sync each floor plan
      for (let i = 0; i < unsyncedPlans.length; i++) {
        const plan = unsyncedPlans[i];

        // Check if we've exceeded max retries
        const attempts = this.retryAttempts.get(plan.id) || 0;
        if (attempts >= this.maxRetries) {
          console.warn(`Max retries exceeded for floor plan ${plan.id}`);
          failedPlans.push({ id: plan.id, reason: 'Max retries exceeded' });
          continue;
        }

        const result = await this.syncFloorPlan(plan);

        if (result.success) {
          successCount++;
        } else {
          failedPlans.push({ id: plan.id, reason: result.error });
        }

        this.notify({
          type: 'sync_progress',
          total: unsyncedPlans.length,
          current: i + 1,
          successCount,
          failedCount: failedPlans.length
        });
      }

      // Notify completion
      this.notify({
        type: 'sync_completed',
        syncedCount: successCount,
        failedCount: failedPlans.length,
        failedPlans
      });

      // Schedule retry for failed plans if any
      if (failedPlans.length > 0) {
        this.scheduleRetry();
      }

    } catch (error) {
      console.error('Sync error:', error);
      this.notify({ type: 'sync_error', error: error.message });
    } finally {
      this.syncing = false;
    }
  }

  // Schedule retry with exponential backoff
  scheduleRetry() {
    // Retry after 5 seconds, then 10, 20, 40, etc.
    const baseDelay = 5000;
    const retryCount = Math.max(...Array.from(this.retryAttempts.values()));
    const delay = baseDelay * Math.pow(2, Math.min(retryCount, 4));

    console.log(`Scheduling retry in ${delay / 1000} seconds`);

    setTimeout(() => {
      this.syncAll();
    }, delay);
  }

  // Force sync (ignore retry limits)
  async forceSync() {
    this.retryAttempts.clear();
    await this.syncAll();
  }

  // Get sync status
  async getSyncStatus() {
    const unsyncedPlans = await indexedDBService.getUnsyncedFloorPlans();
    return {
      hasUnsyncedChanges: unsyncedPlans.length > 0,
      unsyncedCount: unsyncedPlans.length,
      syncing: this.syncing
    };
  }
}

// Singleton instance
const syncService = new SyncService();

export default syncService;
