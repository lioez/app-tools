export enum AppStep {
  UPLOAD = 'UPLOAD',
  EDITOR = 'EDITOR',
  RESULT = 'RESULT'
}

export enum FileFormat {
  PNG = 'png',
  ICO = 'ico',
  SVG = 'svg',
  WEBP = 'webp'
}

export interface ImageState {
  originalFile: File | null;
  originalUrl: string | null;
  processedUrl: string | null; // The result after BG removal
  isProcessing: boolean;
  error: string | null;
  processingProgress: number; // 0-100
}

export interface ExportSettings {
  width: number;
  height: number;
  format: FileFormat;
  keepAspectRatio: boolean;
}