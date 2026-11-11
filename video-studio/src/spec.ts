/**
 * Video spec: the single source of truth for a video.
 *
 * Everything the renderer needs lives in one JSON file per project. That is
 * what makes the studio promptable: an agent (or a human) edits data, not
 * React code, and the same spec powers the preview and the final MP4.
 */

export type SceneType =
  | 'title'
  | 'bullets'
  | 'stat'
  | 'quote'
  | 'image'
  | 'video'
  | 'code'
  | 'terminal'
  | 'chat'
  | 'split'
  | 'bars'
  | 'outro'
  | 'blank';

export interface SceneBase {
  id?: string;
  type: SceneType;
  /** Preferred duration in seconds. */
  seconds?: number;
  /** Exact duration in frames. Wins over `seconds`. */
  duration?: number;
  /** Lower-third caption shown while the scene is on screen. */
  caption?: string;
  /** Per-scene CSS background override. */
  bg?: string;
}

export interface TitleScene extends SceneBase {
  type: 'title';
  kicker?: string;
  text: string;
  subtitle?: string;
  align?: 'left' | 'center';
  /** Render the headline with the accent gradient. */
  gradient?: boolean;
}

export interface BulletItem {
  text: string;
  detail?: string;
}

export interface BulletsScene extends SceneBase {
  type: 'bullets';
  heading?: string;
  kicker?: string;
  items: Array<string | BulletItem>;
  numbered?: boolean;
}

export interface StatScene extends SceneBase {
  type: 'stat';
  value: string;
  label: string;
  note?: string;
  kicker?: string;
}

export interface QuoteScene extends SceneBase {
  type: 'quote';
  text: string;
  author?: string;
  role?: string;
}

export type KenBurns = 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'none';

export interface ImageScene extends SceneBase {
  type: 'image';
  src: string;
  caption?: string;
  fit?: 'cover' | 'contain';
  kenBurns?: KenBurns;
  /** 0..1 dark scrim over the image so text stays readable. */
  overlay?: number;
  /** Inset the image instead of full-bleed. */
  inset?: boolean;
  heading?: string;
  body?: string;
}

export interface VideoScene extends SceneBase {
  type: 'video';
  src: string;
  /** Seconds trimmed from the start of the source. */
  trimStart?: number;
  /** Seconds trimmed from the end of the source. */
  trimEnd?: number;
  muted?: boolean;
  volume?: number;
  playbackRate?: number;
  fit?: 'cover' | 'contain';
  inset?: boolean;
  rounded?: boolean;
}

export interface CodeScene extends SceneBase {
  type: 'code';
  filename?: string;
  language?: string;
  code: string;
  /** 1-based line numbers to highlight. */
  highlight?: number[];
}

export interface TerminalLine {
  text: string;
  type?: 'cmd' | 'out' | 'ok' | 'warn' | 'error';
}

export interface TerminalScene extends SceneBase {
  type: 'terminal';
  title?: string;
  lines: TerminalLine[];
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  name?: string;
}

export interface ChatScene extends SceneBase {
  type: 'chat';
  title?: string;
  messages: ChatMessage[];
}

export interface SplitScene extends SceneBase {
  type: 'split';
  image?: string;
  heading: string;
  body?: string;
  kicker?: string;
  /** Which half the image occupies. */
  side?: 'left' | 'right' | 'top';
  fit?: 'cover' | 'contain';
}

export interface BarItem {
  label: string;
  value: number;
  note?: string;
}

export interface BarsScene extends SceneBase {
  type: 'bars';
  heading?: string;
  items: BarItem[];
  unit?: string;
  max?: number;
}

export interface OutroScene extends SceneBase {
  type: 'outro';
  text: string;
  cta?: string;
  handle?: string;
  subtitle?: string;
}

export interface BlankScene extends SceneBase {
  type: 'blank';
  color?: string;
}

export type Scene =
  | TitleScene
  | BulletsScene
  | StatScene
  | QuoteScene
  | ImageScene
  | VideoScene
  | CodeScene
  | TerminalScene
  | ChatScene
  | SplitScene
  | BarsScene
  | OutroScene
  | BlankScene;

export interface AudioTrack {
  src: string;
  volume?: number;
  /** Timeline offset in seconds. */
  startAt?: number;
  /** Skip this many seconds into the source. */
  trimStart?: number;
  fadeIn?: number;
  fadeOut?: number;
}

export interface Subtitle {
  text: string;
  /** Seconds on the timeline. */
  from: number;
  to: number;
}

export type ThemePreset = 'midnight' | 'sunset' | 'neon' | 'paper' | 'mono';

export interface ThemeInput {
  preset?: ThemePreset;
  bg?: string;
  fg?: string;
  muted?: string;
  accent?: string;
  accent2?: string;
  font?: string;
  mono?: string;
  radius?: number;
}

export interface Theme {
  preset: ThemePreset;
  bg: string;
  fg: string;
  muted: string;
  accent: string;
  accent2: string;
  font: string;
  mono: string;
  radius: number;
  surface: string;
  border: string;
  captionBg: string;
  captionFg: string;
  isLight: boolean;
}

export interface VideoSpec {
  $schema?: string;
  meta: {
    title?: string;
    width?: number;
    height?: number;
    fps?: number;
  };
  theme?: ThemeInput;
  transition?: { type?: 'fade' | 'none'; duration?: number };
  progressBar?: boolean;
  grid?: boolean;
  brand?: { handle?: string; show?: boolean };
  audio?: AudioTrack[];
  subtitles?: Subtitle[];
  scenes: Scene[];
}

export const DEFAULT_WIDTH = 1080;
export const DEFAULT_HEIGHT = 1920;
export const DEFAULT_FPS = 30;

const FONT_STACK =
  '"Segoe UI Variable Display", "Segoe UI", "Inter", "Helvetica Neue", Arial, sans-serif';
const MONO_STACK =
  '"Cascadia Code", "Cascadia Mono", Consolas, "SF Mono", Menlo, monospace';

const PRESETS: Record<ThemePreset, Theme> = {
  midnight: {
    preset: 'midnight',
    bg: '#070912',
    fg: '#f4f6ff',
    muted: '#9aa4c7',
    accent: '#7c5cff',
    accent2: '#22d3ee',
    font: FONT_STACK,
    mono: MONO_STACK,
    radius: 28,
    surface: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.12)',
    captionBg: 'rgba(8,10,20,0.78)',
    captionFg: '#f4f6ff',
    isLight: false,
  },
  sunset: {
    preset: 'sunset',
    bg: '#160d14',
    fg: '#fff5ec',
    muted: '#d8b7a6',
    accent: '#ff7a45',
    accent2: '#ffd166',
    font: FONT_STACK,
    mono: MONO_STACK,
    radius: 30,
    surface: 'rgba(255,255,255,0.07)',
    border: 'rgba(255,196,150,0.18)',
    captionBg: 'rgba(24,10,8,0.78)',
    captionFg: '#fff5ec',
    isLight: false,
  },
  neon: {
    preset: 'neon',
    bg: '#03060a',
    fg: '#eafff6',
    muted: '#8fb3a6',
    accent: '#00ffa3',
    accent2: '#ff2bd6',
    font: FONT_STACK,
    mono: MONO_STACK,
    radius: 24,
    surface: 'rgba(0,255,163,0.07)',
    border: 'rgba(0,255,163,0.24)',
    captionBg: 'rgba(0,10,8,0.8)',
    captionFg: '#eafff6',
    isLight: false,
  },
  paper: {
    preset: 'paper',
    bg: '#f3eee2',
    fg: '#16130f',
    muted: '#6b6357',
    accent: '#c2410c',
    accent2: '#1d7a5f',
    font: FONT_STACK,
    mono: MONO_STACK,
    radius: 22,
    surface: 'rgba(0,0,0,0.045)',
    border: 'rgba(0,0,0,0.12)',
    captionBg: 'rgba(255,252,245,0.9)',
    captionFg: '#16130f',
    isLight: true,
  },
  mono: {
    preset: 'mono',
    bg: '#0a0a0a',
    fg: '#f2f2f2',
    muted: '#9b9b9b',
    accent: '#ffffff',
    accent2: '#a3a3a3',
    font: FONT_STACK,
    mono: MONO_STACK,
    radius: 18,
    surface: 'rgba(255,255,255,0.055)',
    border: 'rgba(255,255,255,0.14)',
    captionBg: 'rgba(0,0,0,0.82)',
    captionFg: '#f2f2f2',
    isLight: false,
  },
};

export function resolveTheme(input?: ThemeInput): Theme {
  const preset = PRESETS[input?.preset ?? 'midnight'];
  return { ...preset, ...stripUndefined(input ?? {}) } as Theme;
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) out[key] = entry;
  }
  return out as Partial<T>;
}

export function fpsOf(spec: VideoSpec): number {
  return spec.meta?.fps ?? DEFAULT_FPS;
}

export function sceneFrames(scene: Scene, fps: number): number {
  if (typeof scene.duration === 'number' && Number.isFinite(scene.duration)) {
    return Math.max(1, Math.round(scene.duration));
  }
  const seconds = typeof scene.seconds === 'number' ? scene.seconds : 3;
  return Math.max(1, Math.round(seconds * fps));
}

export function totalFrames(spec: VideoSpec): number {
  const fps = fpsOf(spec);
  return spec.scenes.reduce((sum, scene) => sum + sceneFrames(scene, fps), 0);
}

export interface TimelineEntry {
  scene: Scene;
  index: number;
  from: number;
  durationInFrames: number;
}

export function timeline(spec: VideoSpec): TimelineEntry[] {
  const fps = fpsOf(spec);
  let cursor = 0;
  return spec.scenes.map((scene, index) => {
    const durationInFrames = sceneFrames(scene, fps);
    const entry = { scene, index, from: cursor, durationInFrames };
    cursor += durationInFrames;
    return entry;
  });
}

export function isRemote(src: string): boolean {
  return /^(https?:|data:|blob:)/i.test(src);
}
