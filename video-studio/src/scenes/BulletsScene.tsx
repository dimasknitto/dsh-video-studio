import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {BulletsScene as BulletsSceneSpec, Theme} from '../spec';
import {SceneShell} from '../ui/SceneShell';
import {Kicker} from '../ui/Atoms';
import {enterAt, useEnter, useUnit} from '../ui/motion';
import {alpha} from '../ui/Background';

interface Props {
  scene: BulletsSceneSpec;
  theme: Theme;
  durationInFrames: number;
  transitionFrames: number;
}

export const BulletsScene: React.FC<Props> = ({scene, theme, durationInFrames, transitionFrames}) => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const heading = useEnter(2, 24);
  const items = scene.items.map((item) => (typeof item === 'string' ? {text: item} : item));
  const count = Math.max(1, items.length);
  const stagger = Math.min(12, Math.max(5, Math.floor((durationInFrames * 0.45) / count)));
  const numbered = scene.numbered ?? true;

  return (
    <SceneShell durationInFrames={durationInFrames} transitionFrames={transitionFrames}>
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', gap: 46 * u}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 20 * u}}>
          {scene.kicker ? <Kicker text={scene.kicker} theme={theme} /> : null}
          {scene.heading ? (
            <h2
              style={{
                ...heading,
                margin: 0,
                fontSize: (78 - Math.max(0, scene.heading.length - 28) * 0.9) * u,
                lineHeight: 1.08,
                letterSpacing: -2 * u,
                fontWeight: 780,
                color: theme.fg,
              }}
            >
              {scene.heading}
            </h2>
          ) : null}
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: 22 * u}}>
          {items.map((item, index) => {
            const enter = enterAt(frame, fps, 10 + index * stagger, 30);
            return (
              <div
                key={`${item.text}-${index}`}
                style={{
                  ...enter,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 24 * u,
                  padding: `${22 * u}px ${26 * u}px`,
                  borderRadius: theme.radius * 0.8,
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  backdropFilter: 'blur(14px)',
                }}
              >
                <div
                  style={{
                    flex: '0 0 auto',
                    width: 54 * u,
                    height: 54 * u,
                    borderRadius: numbered ? 16 * u : 99,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24 * u,
                    fontWeight: 750,
                    color: theme.isLight ? '#fff' : '#0b0b12',
                    background: numbered
                      ? `linear-gradient(140deg, ${theme.accent}, ${theme.accent2})`
                      : alpha(theme.accent, 0.9),
                    boxShadow: `0 8px ${28 * u}px ${alpha(theme.accent, 0.32)}`,
                  }}
                >
                  {numbered ? String(index + 1).padStart(2, '0') : ''}
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: 6 * u, paddingTop: 4 * u}}>
                  <span style={{fontSize: 38 * u, lineHeight: 1.24, fontWeight: 650, color: theme.fg}}>
                    {item.text}
                  </span>
                  {item.detail ? (
                    <span style={{fontSize: 29 * u, lineHeight: 1.4, color: theme.muted, fontWeight: 430}}>
                      {item.detail}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SceneShell>
  );
};
