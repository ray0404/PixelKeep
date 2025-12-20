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

export interface ImageAsset {
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
  images!: Table<ImageAsset>; // Images are stored as Assets
  fs_nodes!: Table<{ id: string; data: string }>; // Encrypted FSNode
  meta!: Table<Meta>;

  constructor() {
    super('PixelPWADatabase');
    this.version(3).stores({
      notes: 'id',
      tasks: 'id',
      meta: 'key',
      fs_nodes: 'id',
      images: 'id',
      folders: 'id'
    });
  }
}

export const db = new PixelKeepDB();
