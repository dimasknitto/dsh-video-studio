import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate} from 'remotion';
import type {VideoSpec} from './spec';
import {fpsOf, resolveTheme, timeline, totalFrames} from './spec';
import {Background} from './ui/Background';
import {Brand, Captions, ProgressBar} from './ui/Captions';
import {SceneView} from './scenes/SceneView';
import {assetSrc} from './ui/media';
import {clamp} from './ui/motion';

/**
 * Top-level renderer. Every visual decision comes from the JSON spec, which is
 * why the same component serves both the preview and the final render.
 */
export const Video: React.FC<VideoSpec> = (spec) => {
  const theme = resolveTheme(spec.theme);
  const fps = fpsOf(spec);
  const entries = timeline(spec);
  const total = Math.max(1, totalFrames(spec));
  const transitionFrames =
    spec.transition?.type === 'none' ? 0 : Math.max(1, Math.round((spec.transition?.duration ?? 0.32) * fps));

  return (
    <AbsoluteFill style={{backgroundColor: theme.bg, fontFamily: theme.font, color: theme.fg}}>
      <Background theme={theme} grid={spec.grid ?? true} />

      {entries.map((entry) => (
        <Sequence
          key={`${entry.index}-${entry.scene.type}`}
          from={entry.from}
          durationInFrames={entry.durationInFrames}
          name={`${String(entry.index + 1).padStart(2, '0')} ${entry.scene.id ?? entry.scene.type}`}
        >
          <SceneView
            scene={entry.scene}
            theme={theme}
            durationInFrames={entry.durationInFrames}
            transitionFrames={transitionFrames}
          />
        </Sequence>
      ))}

      <Captions spec={spec} theme={theme} />
      <Brand spec={spec} theme={theme} />
      {spec.progressBar !== false ? <ProgressBar spec={spec} theme={theme} /> : null}

      {(spec.audio ?? []).map((track, index) => {
        const start = Math.max(0, Math.round((track.startAt ?? 0) * fps));
        const duration = Math.max(1, total - start);
        const base = track.volume ?? 0.4;
        return (
          <Sequence key={`audio-${index}`} from={start} durationInFrames={duration} name={`audio ${index + 1}`}>
            <Audio
              src={assetSrc(track.src)}
              startFrom={Math.round((track.trimStart ?? 0) * fps)}
              volume={(localFrame) => {
                let value = base;
                if (track.fadeIn) {
                  value *= interpolate(localFrame, [0, track.fadeIn * fps], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  });
                }
                if (track.fadeOut) {
                  value *= interpolate(
                    localFrame,
                    [duration - track.fadeOut * fps, duration],
                    [1, 0],
                    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
                  );
                }
                return clamp(value, 0, 1);
              }}
            />
          </Sequence>
        );
      })}

    </AbsoluteFill>
  );
};
