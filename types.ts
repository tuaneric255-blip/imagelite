
export enum ToolType {
  COMPRESS = 'COMPRESS',
  CONVERT_WEBP = 'CONVERT_WEBP',
  CONVERT_AVIF = 'CONVERT_AVIF',
  BASE64 = 'BASE64',
  ANIMATION = 'ANIMATION',
  DECODE = 'DECODE',
  SVG = 'SVG'
}

export interface ProcessedImage {
  id: string;
  originalName: string;
  originalSize: number;
  originalUrl: string;
  processedUrl: string;
  processedSize: number;
  type: string; // 'image/jpeg' | 'image/png' | etc
  status: 'pending' | 'processing' | 'done' | 'error';
  base64?: string;
  seoData?: {
    alt?: string;
    desc?: string;
    suggestion?: string;
  };
}

export interface AnimationFrame {
  id: string;
  url: string;
  file: File;
}

export type Language = 'vi' | 'en';
export type ThemeMode = 'light' | 'dark';

export interface Settings {
  language: Language;
  themeMode: ThemeMode;
  primaryColor: string;
  userApiKey: string;
}

export interface AppState {
  activeTool: ToolType;
  images: ProcessedImage[];
  animationFrames: AnimationFrame[];
  isProcessing: boolean;
  settings: Settings;
}

export const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/avif': ['.avif'],
};
