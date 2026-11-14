export interface StudioFormat {
  label: string;
  size: string;
}

export const FORMATS: Record<string, StudioFormat> = {
  reel: { label: 'Reel 9:16', size: '1080×1920' },
  landscape: { label: 'YouTube 16:9', size: '1920×1080' },
  square: { label: 'Square 1:1', size: '1080×1080' },
};

export const FORMAT_OPTIONS = Object.entries(FORMATS).map(([value, info]) => ({
  value,
  label: info.label,
}));

export const THEME_OPTIONS = ['midnight', 'sunset', 'neon', 'paper', 'mono'].map((value) => ({
  value,
  label: value,
}));

export const DEFAULT_FORMAT = 'reel';
export const DEFAULT_THEME = 'midnight';
export const DEFAULT_SECONDS = 20;
export const MIN_SECONDS = 5;
export const MAX_SECONDS = 120;

/** Interval polling daftar project & job. */
export const POLL_INTERVAL_MS = 3000;
