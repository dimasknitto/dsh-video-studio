/** Bentuk data yang dikirim host half (`lib/index.js`) lewat `/video-studio/api/state`. */

export interface StudioOutput {
  name: string;
  size: number;
  mtime: number;
  kind: 'video' | 'image';
  url: string;
}

export interface StudioTimelineScene {
  type: string;
  seconds: number;
  label: string;
}

export interface StudioProject {
  slug: string;
  dir: string;
  title: string | null;
  width: number;
  height: number;
  fps: number;
  theme: string;
  sceneCount: number;
  seconds: number;
  timeline: StudioTimelineScene[];
  updatedAt: number;
  outputs: StudioOutput[];
  cover: string | null;
  specUrl: string;
  latestVideo: StudioOutput | null;
}

export type JobStatus = 'running' | 'done' | 'error';
export type JobKind = 'render' | 'draft';

export interface StudioJob {
  id: string;
  slug: string;
  kind: JobKind;
  status: JobStatus;
  startedAt: number;
  endedAt: number | null;
  exitCode: number | null;
  out: string | null;
  log: string;
}

export interface StudioState {
  studioDir: string;
  projects: StudioProject[];
  jobs: StudioJob[];
  studio: { running: boolean; slug: string | null; url: string | null };
  error: string | null;
}

export interface RenderResult {
  id: string;
  slug: string;
  status: JobStatus;
  busy?: boolean;
}

export interface StudioLaunchResult {
  url: string;
  starting?: boolean;
}
