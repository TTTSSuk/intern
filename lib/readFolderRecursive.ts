// lib/readFolderRecursive.ts
import fs from 'fs';
import path from 'path';

export interface Folder {
  name?: string;
  files: string[];
  subfolders?: Folder[];
}

export function readFolderRecursive(folderPath: string): Folder {
  const items = fs.readdirSync(folderPath, { withFileTypes: true });
  const files: string[] = [];
  const subfolders: Folder[] = [];

  items.forEach(item => {
    if (item.isDirectory()) {
      const childFolder = readFolderRecursive(path.join(folderPath, item.name));
      subfolders.push({ name: item.name, ...childFolder });
    } else {
      files.push(item.name);
    }
  });

  const folder: Partial<Folder> = {};

  if (files.length > 0) folder.files = files;
  if (subfolders.length > 0) folder.subfolders = subfolders;

  return folder as Folder;
}
