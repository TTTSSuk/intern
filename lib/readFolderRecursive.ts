// lib/readFolderRecursive.ts
import fs from 'fs';
import path from 'path';

export interface Folder {
  name?: string;
  files: string[];
  subfolders: Folder[];
}

export function readFolderRecursive(folderPath: string): Folder {
  const items = fs.readdirSync(folderPath, { withFileTypes: true });
  const files: string[] = [];
  const subfolders: Folder[] = [];

  items.forEach(item => {
    if (item.isDirectory()) {
      subfolders.push({
        name: item.name,
        ...readFolderRecursive(path.join(folderPath, item.name)),
      });
    } else {
      files.push(item.name);
    }
  });

  return { files, subfolders };
}
