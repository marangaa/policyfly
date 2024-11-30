
export interface Document {
  id: string;
  name: string;
  filePath: string;
}

export type DocumentDownloadResponse = {
  buffer: Buffer;
  filename: string;
};