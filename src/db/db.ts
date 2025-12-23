import Dexie, { type Table } from 'dexie';

export interface Folder {
  id: string;
  name: string;
  parentId: string;
  type: 'note' | 'task';
  order?: number;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  audio?: string; // Virtual path /secure-img/ID
  updatedAt: string;
  order?: number;
}

export interface Task {
  id: number;
  title: string;
  time: string | null;
  completionType: 'at' | 'before_by';
  startTime: string | null;
  location: string;
  people: string;
  notes: string;
  completed: boolean;
  alarm: {
    enabled: boolean;
    trigger: number;
    repeat: number;
    audio?: { data: string; name: string };
    noSound?: boolean;
  };
  nextAlarmTime: string | null;
  updatedAt: string;
  order?: number;
}

export interface Asset {
  id: string;
  data: string; // Encrypted binary data
  mimeType: string;
}

export interface Meta {
  key: string;
  value: any;
}

export interface FSNode {
  id: string;
  parentId: string;
  type: 'note' | 'task' | 'folder';
  name: string;
  order: number;
  itemRefId: number; // For notes/tasks
}

export class PixelKeepDB extends Dexie {
  notes!: Table<{ id: number; data: string }>; // Encrypted Note
  tasks!: Table<{ id: number; data: string }>; // Encrypted Task
  folders!: Table<{ id: string; data: string }>; // Encrypted Folder
  assets!: Table<Asset>; // Encrypted Assets (images, audio)
  fs_nodes!: Table<{ id: string; data: string }>; // Encrypted FSNode
  meta!: Table<Meta>;

  constructor() {
    super('PixelPWADatabase');
    
    // Version 4 was intended for assets rename, but hung. 
    // Version 5 forces a clean state for the assets table.
    this.version(5).stores({
      notes: 'id',
      tasks: 'id',
      meta: 'key',
      fs_nodes: 'id',
      assets: 'id',
      folders: 'id'
    });
  }
}

export const db = new PixelKeepDB();

console.log('Database instance created. Initializing...');

// Global database error/blocked handlers
db.on('blocked', () => {
  console.warn('DATABASE BLOCKED: Another tab is holding the connection open.');
  alert('The Ritual is Blocked! Please close other tabs of PixelKeep.');
});

// Attempt to open with a timeout
const openDb = async () => {
    try {
        console.log('Opening database...');
        // Dexie.open() returns a promise that resolves when the DB is ready
        await db.open();
        console.log('Database opened successfully.');
    } catch (err: any) {
        console.error('FAILED TO OPEN DATABASE:', err);
        if (err.name === 'VersionError') {
            console.log('Version mismatch, attempting to delete and restart...');
            // In extreme cases, we might need to delete, but let's try to just alert first
        }
        alert(`Oracle Database Error: ${err.message}`);
    }
};

openDb();
