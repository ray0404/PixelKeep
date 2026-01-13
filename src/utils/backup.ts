import { db, Note, Task, FSNode } from '../db/db';
import { encrypt, decrypt } from './encryption';
import JSZip from 'jszip';

export type ExportFormat = 'json' | 'markdown' | 'txt' | 'txt_html' | 'zip';

export async function exportData(password: string, format: ExportFormat = 'json') {
  const notesEnc = await db.notes.toArray();
  const tasksEnc = await db.tasks.toArray();
  const nodesEnc = await db.fs_nodes.toArray();
  const foldersEnc = await db.folders.toArray();

  const notes = notesEnc.map(n => decrypt(n.data, password) as Note).filter(Boolean);
  const tasks = tasksEnc.map(t => decrypt(t.data, password) as Task).filter(Boolean);
  const nodes = nodesEnc.map(n => decrypt(n.data, password) as FSNode).filter(Boolean);
  const folders = foldersEnc.map(f => decrypt(f.data, password)).filter(Boolean);

  const data = {
    notes,
    tasks,
    nodes,
    folders,
    version: 2,
    exportedAt: new Date().toISOString()
  };

  if (format === 'json') {
    downloadBlob(JSON.stringify(data, null, 2), `pixel-keep-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  } else if (format === 'markdown' || format === 'txt' || format === 'txt_html' || format === 'zip') {
    const zip = new JSZip();
    
    // Notes Folder
    const notesFolder = zip.folder("notes");
    for (const note of notes) {
      let content = "";
      if (format === 'markdown') {
        content = `# ${note.title}\n\n${note.content}\n\nTags: ${note.tags.join(', ')}`;
        notesFolder?.file(`${note.title.replace(/[^a-z0-9]/gi, '_')}.md`, content);
      } else if (format === 'txt_html') {
        content = `${note.title}\n\n${note.content}\n\nTags: ${note.tags.join(', ')}`;
        notesFolder?.file(`${note.title.replace(/[^a-z0-9]/gi, '_')}.html`, content);
      } else {
        content = `${note.title}\n\n${note.content.replace(/<[^>]*>?/gm, ' ')}\n\nTags: ${note.tags.join(', ')}`;
        notesFolder?.file(`${note.title.replace(/[^a-z0-9]/gi, '_')}.txt`, content);
      }
    }

    // Tasks File
    const taskContent = tasks.map(t => `- [${t.completed ? 'x' : ' '}] ${t.title} (${t.time || 'No time'})\n  ${t.notes}`).join('\n');
    zip.file("quests.txt", taskContent);

    // If ZIP, also include the raw JSON and images
    if (format === 'zip') {
      zip.file("backup.json", JSON.stringify(data, null, 2));
      // For complete inclusion, we'd add media here. 
      // Current implementation focus is on the JSON backup.
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixel-keep-export-${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

function downloadBlob(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importData(file: File, password: string) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'json') {
    const text = await file.text();
    let data = JSON.parse(text);
    
    // Legacy support: if array, it's a list of notes
    if (Array.isArray(data)) {
      data = { notes: data, tasks: [] };
    }

    await processImport(data, password);
  } else if (extension === 'zip') {
    const zip = await JSZip.loadAsync(file);
    const backupJson = await zip.file("backup.json")?.async("string");
    if (backupJson) {
      const data = JSON.parse(backupJson);
      await processImport(data, password);
    } else {
      throw new Error("No backup.json found in ZIP");
    }
  } else {
    throw new Error("Unsupported file format");
  }
}

async function processImport(jsonData: any, password: string) {
  if (!jsonData.notes || !jsonData.tasks) {
    throw new Error('Invalid backup file');
  }

  // Import Notes
  for (const rawNote of jsonData.notes) {
    const note = { ...rawNote };

    // Legacy normalization
    if (!note.updatedAt && note.timestamp) {
      note.updatedAt = new Date(note.timestamp).toISOString();
    }
    if (!note.tags) {
      note.tags = [];
    }
    if (note.audio === null) {
      delete note.audio;
    }

    await db.notes.put({ id: note.id, data: encrypt(note, password) });
    // For legacy: create node if not present
    if (!jsonData.nodes || !jsonData.nodes.find((n: any) => n.itemRefId === note.id && n.type === 'note')) {
      const newNode: FSNode = {
        id: `note-${note.id}`,
        parentId: note.folderId || 'root_notes',
        type: 'note',
        name: note.title,
        order: note.order || Date.now(),
        itemRefId: note.id
      };
      await db.fs_nodes.put({ id: newNode.id, data: encrypt(newNode, password) });
    }
  }

  // Import Tasks
  for (const task of jsonData.tasks) {
    await db.tasks.put({ id: task.id, data: encrypt(task, password) });
    // For legacy: create node if not present
    if (!jsonData.nodes || !jsonData.nodes.find((n: any) => n.itemRefId === task.id && n.type === 'task')) {
      const newNode: FSNode = {
        id: `task-${task.id}`,
        parentId: 'root_tasks',
        type: 'task',
        name: task.title,
        order: task.order || Date.now(),
        itemRefId: task.id
      };
      await db.fs_nodes.put({ id: newNode.id, data: encrypt(newNode, password) });
    }
  }

  // Import Nodes (if present in backup)
  if (jsonData.nodes) {
    for (const node of jsonData.nodes) {
      await db.fs_nodes.put({ id: node.id, data: encrypt(node, password) });
    }
  }

  // Import Folders (if present in backup)
  if (jsonData.folders) {
    for (const folder of jsonData.folders) {
      await db.folders.put({ id: folder.id, data: encrypt(folder, password) });
    }
  }
}