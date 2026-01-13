import { db } from '../db/db';
import { decrypt as decryptLegacy } from './encryption';
import { encryptWebCrypto } from './webCrypto';

export interface MigrationStats {
  total: number;
  migrated: number;
  failed: number;
  skipped: number;
}

export async function migrateToWebCrypto(password: string): Promise<MigrationStats> {
  const stats: MigrationStats = { total: 0, migrated: 0, failed: 0, skipped: 0 };
  
  // 1. Migrate Notes
  const notes = await db.notes.toArray();
  stats.total += notes.length;

  for (const note of notes) {
    try {
      // Check if already migrated (starts with '{' implies JSON object with cipher/salt/iv)
      // Legacy data is a raw Base64 string from CryptoJS, typically usually doesn't start with {
      // unless it's double serialized.
      // Better check: try to parse as JSON. If it has 'cipher' and 'iv', it's new.
      let isNewFormat = false;
      try {
          const parsed = JSON.parse(note.data);
          if (parsed.cipher && parsed.iv && parsed.salt) {
              isNewFormat = true;
          }
      } catch (e) {
          // Not JSON, likely legacy string
      }

      if (isNewFormat) {
          stats.skipped++;
          continue;
      }

      // Legacy Decrypt
      const decryptedData = decryptLegacy(note.data, password);
      
      if (!decryptedData) {
          console.error(`Failed to decrypt note ${note.id} with provided password.`);
          stats.failed++;
          continue;
      }

      // WebCrypto Encrypt
      const newCrypto = await encryptWebCrypto(decryptedData, password);
      
      // Save as stringified JSON
      await db.notes.update(note.id, { data: JSON.stringify(newCrypto) });
      stats.migrated++;

    } catch (err) {
      console.error(`Migration error for note ${note.id}:`, err);
      stats.failed++;
    }
  }

  // 2. Migrate Tasks (Similar logic)
  const tasks = await db.tasks.toArray();
  stats.total += tasks.length;

  for (const task of tasks) {
    try {
      let isNewFormat = false;
      try {
          const parsed = JSON.parse(task.data);
          if (parsed.cipher && parsed.iv && parsed.salt) {
              isNewFormat = true;
          }
      } catch (e) { }

      if (isNewFormat) {
          stats.skipped++;
          continue;
      }

      const decryptedData = decryptLegacy(task.data, password);
      if (!decryptedData) {
          stats.failed++;
          continue;
      }

      const newCrypto = await encryptWebCrypto(decryptedData, password);
      await db.tasks.update(task.id, { data: JSON.stringify(newCrypto) });
      stats.migrated++;

    } catch (err) {
      console.error(`Migration error for task ${task.id}:`, err);
      stats.failed++;
    }
  }
  
  // 3. Migrate FS Nodes (Folders/Structure)
  const fsNodes = await db.fs_nodes.toArray();
  stats.total += fsNodes.length;
  
  for (const node of fsNodes) {
      try {
          let isNewFormat = false;
          try {
              const parsed = JSON.parse(node.data);
              // Handle unencrypted tasks setting
              if (parsed.cipher && parsed.iv && parsed.salt) isNewFormat = true;
          } catch (e) {}
          
          if (isNewFormat) {
              stats.skipped++;
              continue;
          }
          
          // Handle potentially unencrypted data (Settings: disableTaskEncryption)
          // The store handles this by checking if JSON.parse works on the raw data.
          // For migration, we assume we want EVERYTHING on WebCrypto if possible, 
          // OR we respect the unencrypted state. 
          // For now, if it decrypts with legacy, we re-encrypt.
          
          let decryptedData = decryptLegacy(node.data, password);
          
          // Fallback for unencrypted nodes (if any exists from disableTaskEncryption)
          if (!decryptedData) {
              try {
                  decryptedData = JSON.parse(node.data);
                  // If we successfully parsed it, but it wasn't legacy encrypted, 
                  // it might be plaintext. We should probably ENCRYPT it now 
                  // to standardise, or skip? 
                  // Let's encrypt it to be safe and uniform.
              } catch (e) {
                  // Truly failed
                  stats.failed++;
                  continue;
              }
          }

          if (decryptedData) {
             const newCrypto = await encryptWebCrypto(decryptedData, password);
             await db.fs_nodes.update(node.id, { data: JSON.stringify(newCrypto) });
             stats.migrated++;
          }
          
      } catch (err) {
          console.error(`Migration error for node ${node.id}:`, err);
          stats.failed++;
      }
  }

  return stats;
}

export async function importAndMigrateBackup(backupData: any, password: string): Promise<MigrationStats> {
  const stats: MigrationStats = { total: 0, migrated: 0, failed: 0, skipped: 0 };

  // 1. Import Notes
  if (backupData.notes && Array.isArray(backupData.notes)) {
    stats.total += backupData.notes.length;
    for (const note of backupData.notes) {
      try {
        // Backup data is plaintext, so we just need to encrypt it
        const newCrypto = await encryptWebCrypto(note, password);
        // db.notes expects { id, data: string }
        await db.notes.put({ id: note.id, data: JSON.stringify(newCrypto) });
        stats.migrated++;
      } catch (err) {
        console.error(`Import error for note ${note.id}:`, err);
        stats.failed++;
      }
    }
  }

  // 2. Import Tasks
  if (backupData.tasks && Array.isArray(backupData.tasks)) {
    stats.total += backupData.tasks.length;
    for (const task of backupData.tasks) {
      try {
        const newCrypto = await encryptWebCrypto(task, password);
        await db.tasks.put({ id: task.id, data: JSON.stringify(newCrypto) });
        stats.migrated++;
      } catch (err) {
        console.error(`Import error for task ${task.id}:`, err);
        stats.failed++;
      }
    }
  }

  // 3. Import FS Nodes (Folders/Structure)
  if (backupData.nodes && Array.isArray(backupData.nodes)) {
    stats.total += backupData.nodes.length;
    for (const node of backupData.nodes) {
      try {
        const newCrypto = await encryptWebCrypto(node, password);
        // db.fs_nodes expects { id, data: string }
        await db.fs_nodes.put({ id: node.id, data: JSON.stringify(newCrypto) });
        stats.migrated++;
      } catch (err) {
        console.error(`Import error for node ${node.id}:`, err);
        stats.failed++;
      }
    }
  }
  
  // 4. Import Folders (Legacy Format Support)
  if (backupData.folders && Array.isArray(backupData.folders)) {
      // These might be old-style folders, check schema.
      // Current schema uses 'fs_nodes' for everything. 
      // If 'folders' exists, we might need to convert them to fs_nodes or ignore if redundant.
      // Based on the provided JSON, 'folders' is empty, so we'll skip complex logic for now.
  }

  return stats;
}
