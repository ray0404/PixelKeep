/**
 * Requests persistent storage from the browser.
 * This helps prevent the browser from clearing IndexedDB data when the device is low on storage.
 * @returns {Promise<boolean>} True if storage is persistent, false otherwise.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persist();
    console.log(`Persistent storage granted: ${isPersisted}`);
    return isPersisted;
  }
  return false;
}

/**
 * Checks if storage is already persistent.
 * @returns {Promise<boolean>} True if storage is persistent, false otherwise.
 */
export async function isStoragePersisted(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persisted) {
    return await navigator.storage.persisted();
  }
  return false;
}
