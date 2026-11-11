import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * One visual unit that works for portrait, landscape, and square.
 * A 1080x1920 reel and a 1920x1080 YouTube video both get unit = 1, so the
 * same spec reads well in either format.
 */
export function useUnit(): number {
  const {width, height} = useVideoConfig();
  return Math.sqrt((width * height) / (1080 * 1920));
}

export interface EnterStyle {
  opacity: number;
  transform: string;
}

/** Pure entrance curve, safe to call for each item in a list. */
export function enterAt(
  frame: number,
  fps: number,
  delay = 0,
  distance = 34,
  scaleFrom = 1,
): EnterStyle {
  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {damping: 200, stiffness: 130, mass: 0.55},
  });
  const opacity = interpolate(progress, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translate = (1 - progress) * distance;
  const scale = interpolate(progress, [0, 1], [scaleFrom, 1]);
  return {
    opacity,
    transform: `translateY(${translate}px) scale(${scale})`,
  };
}

/** Springy entrance: opacity + translate + optional scale. */
export function useEnter(delay = 0, distance = 34, scaleFrom = 1): EnterStyle {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return enterAt(frame, fps, delay, distance, scaleFrom);
}

/** Eased progress 0..1 over `duration` frames starting at 0. */
export function useProgress(duration: number, easing = Easing.out(Easing.cubic)): number {
  const frame = useCurrentFrame();
  return interpolate(frame, [0, Math.max(1, duration)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });
}

/** Fade a scene out over its last `fade` frames. */
export function useExit(durationInFrames: number, fade: number): number {
  const frame = useCurrentFrame();
  if (fade <= 0) return 1;
  return interpolate(frame, [durationInFrames - fade, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

/** Small continuous float, useful for glows and idle elements. */
export function useDrift(amplitude = 20, speed = 0.02): {x: number; y: number} {
  const frame = useCurrentFrame();
  return {
    x: Math.sin(frame * speed) * amplitude,
    y: Math.cos(frame * speed * 0.8) * amplitude,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
