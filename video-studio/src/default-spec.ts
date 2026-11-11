import type {VideoSpec} from './spec';

/**
 * Neutral default props for Studio. This must stay minimal: Remotion merges
 * input props over defaults, so anything optional left here (brand, audio,
 * subtitles) would silently leak into every project that omits it.
 */
export const defaultSpec: VideoSpec = {
  meta: {title: 'Untitled', width: 1080, height: 1920, fps: 30},
  theme: {preset: 'midnight'},
  transition: {type: 'fade', duration: 0.32},
  progressBar: true,
  grid: true,
  scenes: [
    {
      type: 'title',
      seconds: 3,
      kicker: 'Video studio',
      text: 'Pick a project to preview',
      subtitle: 'Run: node bin/video.mjs preview projects/<slug>',
    },
  ],
};
