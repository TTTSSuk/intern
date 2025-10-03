// types.ts
export type Folder = {
  name: string;
  subfolders?: SubFolder[];
};

export type SubFolder = {
  name: string;
  files?: string[];
};

export type ValidationError = {
  folderName: string;
  errors: string[];
};
