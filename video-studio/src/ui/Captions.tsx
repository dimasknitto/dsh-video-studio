import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import type {Subtitle, Theme, VideoSpec} from '../spec';
import {timeline, totalFrames} from '../spec';
import {useUnit} from './motion';
import {alpha} from './Background';

interface CaptionProps {
  spec: VideoSpec;
  theme: Theme;
}

function activeSubtitle(subtitles: Subtitle[] | undefined, seconds: number): Subtitle | undefined {
  if (!subtitles) return undefined;
  return subtitles.find((entry) => seconds >= entry.from && seconds < entry.to);
}

/** Lower-third captions: global subtitles win over the current scene caption. */
export const Captions: React.FC<CaptionProps> = ({spec, theme}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const fps = spec.meta.fps ?? 30;
  const seconds = frame / fps;
  const entries = timeline(spec);
  const current = entries.find(
    (entry) => frame >= entry.from && frame < entry.from + entry.durationInFrames,
  );
  const subtitle = activeSubtitle(spec.subtitles, seconds);
  const text = subtitle?.text ?? current?.scene.caption;
  if (!text) return null;

  const localFrame = subtitle ? seconds * fps : frame - (current?.from ?? 0);
  const sceneDuration = subtitle ? (subtitle.to - subtitle.from) * fps : current?.durationInFrames ?? 1;
  const opacity = interpolate(
    localFrame,
    [0, 6, Math.max(7, sceneDuration - 8), sceneDuration],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  const isSubtitle = Boolean(subtitle);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 140 * u,
        display: 'flex',
        justifyContent: 'center',
        padding: `0 ${76 * u}px`,
        opacity,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16 * u,
          maxWidth: 900 * u,
          padding: `${16 * u}px ${26 * u}px`,
          borderRadius: 18 * u,
          background: theme.captionBg,
          border: `1px solid ${alpha(theme.fg, theme.isLight ? 0.1 : 0.12)}`,
          boxShadow: `0 ${14 * u}px ${40 * u}px rgba(0,0,0,${theme.isLight ? 0.14 : 0.4})`,
          backdropFilter: 'blur(16px)',
        }}
      >
        {!isSubtitle ? (
          <span
            style={{
              flex: '0 0 auto',
              width: 8 * u,
              height: 34 * u,
              borderRadius: 99,
              background: `linear-gradient(180deg, ${theme.accent}, ${theme.accent2})`,
            }}
          />
        ) : null}
        <span
          style={{
            fontSize: (isSubtitle ? 29 : 31) * u,
            lineHeight: 1.38,
            fontWeight: isSubtitle ? 600 : 550,
            letterSpacing: 0.1 * u,
            color: theme.captionFg,
            textAlign: 'center',
            textWrap: 'balance',
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

/** Thin progress line pinned to the bottom edge. */
export const ProgressBar: React.FC<{theme: Theme; spec: VideoSpec}> = ({theme, spec}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const total = Math.max(1, totalFrames(spec));
  const progress = interpolate(frame, [0, total], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 5 * u,
        background: alpha(theme.fg, 0.1),
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})`,
          boxShadow: `0 0 ${18 * u}px ${alpha(theme.accent, 0.8)}`,
        }}
      />
    </div>
  );
};

/** Optional handle mark in the top-right corner. */
export const Brand: React.FC<{spec: VideoSpec; theme: Theme}> = ({spec, theme}) => {
  const u = useUnit();
  if (!spec.brand?.show || !spec.brand.handle) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 54 * u,
        right: 64 * u,
        fontSize: 22 * u,
        fontWeight: 650,
        letterSpacing: 2.4 * u,
        textTransform: 'uppercase',
        color: theme.muted,
        opacity: 0.85,
        display: 'flex',
        alignItems: 'center',
        gap: 10 * u,
      }}
    >
      <span
        style={{
          width: 10 * u,
          height: 10 * u,
          borderRadius: 99,
          background: theme.accent,
          boxShadow: `0 0 ${16 * u}px ${alpha(theme.accent, 0.9)}`,
        }}
      />
      {spec.brand.handle}
    </div>
  );
};
