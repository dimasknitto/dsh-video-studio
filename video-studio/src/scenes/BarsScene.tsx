import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import type {BarsScene as BarsSceneSpec, Theme} from '../spec';
import {SceneShell} from '../ui/SceneShell';
import {useEnter, useUnit} from '../ui/motion';
import {alpha} from '../ui/Background';

interface Props {
  scene: BarsSceneSpec;
  theme: Theme;
  durationInFrames: number;
  transitionFrames: number;
}

export const BarsScene: React.FC<Props> = ({scene, theme, durationInFrames, transitionFrames}) => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const heading = useEnter(0, 22);
  const max = scene.max ?? Math.max(...scene.items.map((item) => item.value), 1) * 1.1;

  return (
    <SceneShell durationInFrames={durationInFrames} transitionFrames={transitionFrames}>
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', gap: 44 * u}}>
        {scene.heading ? (
          <div
            style={{
              ...heading,
              fontSize: 64 * u,
              fontWeight: 780,
              letterSpacing: -1.8 * u,
              lineHeight: 1.1,
              color: theme.fg,
            }}
          >
            {scene.heading}
          </div>
        ) : null}
        <div style={{display: 'flex', flexDirection: 'column', gap: 30 * u}}>
          {scene.items.map((item, index) => {
            const start = 8 + index * 5;
            const progress = interpolate(frame, [start, start + 26], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const width = Math.max(0.02, Math.min(1, item.value / max)) * progress * 100;
            return (
              <div key={`${item.label}-${index}`} style={{display: 'flex', flexDirection: 'column', gap: 12 * u}}>
                <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
                  <span style={{fontSize: 32 * u, fontWeight: 600, color: theme.fg}}>{item.label}</span>
                  <span style={{fontSize: 30 * u, fontWeight: 700, color: theme.accent2, fontVariantNumeric: 'tabular-nums'}}>
                    {item.value.toLocaleString('en-US')}
                    {scene.unit ?? ''}
                  </span>
                </div>
                <div
                  style={{
                    height: 22 * u,
                    borderRadius: 99,
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${width}%`,
                      height: '100%',
                      borderRadius: 99,
                      background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})`,
                      boxShadow: `0 0 ${22 * u}px ${alpha(theme.accent, 0.5)}`,
                    }}
                  />
                </div>
                {item.note ? (
                  <span style={{fontSize: 24 * u, color: theme.muted}}>{item.note}</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </SceneShell>
  );
};
