import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {TerminalScene as TerminalSceneSpec, Theme} from '../spec';
import {SceneShell} from '../ui/SceneShell';
import {useEnter, useUnit} from '../ui/motion';
import {alpha} from '../ui/Background';

interface Props {
  scene: TerminalSceneSpec;
  theme: Theme;
  durationInFrames: number;
  transitionFrames: number;
}

const CHARS_PER_FRAME = 1.9;

export const TerminalScene: React.FC<Props> = ({scene, theme, durationInFrames, transitionFrames}) => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const enter = useEnter(0, 26, 0.97);
  const fontSize = Math.max(20 * u, Math.min(30 * u, 860 * u / (Math.max(...scene.lines.map((line) => line.text.length), 20) * 0.56)));

  let cursor = 6;
  const schedule = scene.lines.map((line) => {
    const start = cursor;
    const typed = Math.ceil(line.text.length / CHARS_PER_FRAME);
    cursor += typed + 5;
    return {start, typed};
  });

  const colorFor = (type: string | undefined): string => {
    if (type === 'ok') return theme.isLight ? '#1d7a5f' : '#4ade80';
    if (type === 'warn') return theme.isLight ? '#a16207' : '#fbbf24';
    if (type === 'error') return theme.isLight ? '#b91c1c' : '#f87171';
    if (type === 'cmd') return theme.fg;
    return theme.muted;
  };

  return (
    <SceneShell durationInFrames={durationInFrames} transitionFrames={transitionFrames}>
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%'}}>
        <div
          style={{
            ...enter,
            borderRadius: theme.radius,
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.accent, 0.22)}`,
            background: theme.isLight ? '#fffdf7' : 'rgba(7,9,16,0.9)',
            boxShadow: `0 ${34 * u}px ${90 * u}px rgba(0,0,0,${theme.isLight ? 0.2 : 0.55})`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12 * u,
              padding: `${16 * u}px ${22 * u}px`,
              borderBottom: `1px solid ${theme.border}`,
              background: theme.surface,
            }}
          >
            {['#ff5f57', '#febc2e', '#28c840'].map((color) => (
              <span key={color} style={{width: 14 * u, height: 14 * u, borderRadius: 99, background: color}} />
            ))}
            <span style={{marginLeft: 10 * u, fontFamily: theme.mono, fontSize: 21 * u, color: theme.muted}}>
              {scene.title ?? 'zsh'}
            </span>
          </div>
          <div
            style={{
              padding: `${26 * u}px ${28 * u}px`,
              display: 'flex',
              flexDirection: 'column',
              gap: 9 * u,
              fontFamily: theme.mono,
              fontSize,
              lineHeight: 1.5,
            }}
          >
            {scene.lines.map((line, index) => {
              const {start, typed} = schedule[index];
              const shown = Math.max(0, Math.min(line.text.length, Math.ceil((frame - start) * CHARS_PER_FRAME)));
              const active = frame >= start && frame < start + typed + 8;
              const isCommand = (line.type ?? 'out') === 'cmd';
              const visible = frame >= start;
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12 * u,
                    opacity: visible ? 1 : 0,
                    whiteSpace: 'pre',
                  }}
                >
                  {isCommand ? (
                    <span style={{color: theme.accent, fontWeight: 700}}>$</span>
                  ) : (
                    <span style={{width: 12 * u, display: 'inline-block'}} />
                  )}
                  <span style={{color: colorFor(line.type)}}>{line.text.slice(0, shown)}</span>
                  {active ? (
                    <span
                      style={{
                        display: 'inline-block',
                        width: fontSize * 0.55,
                        height: fontSize * 1.05,
                        background: theme.accent,
                        opacity: frame % 16 < 9 ? 0.95 : 0.15,
                        borderRadius: 2,
                      }}
                    />
                  ) : null}
                </div>
              );
            })}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12 * u,
                opacity: frame > cursor ? 1 : 0,
              }}
            >
              <span style={{color: theme.accent, fontWeight: 700}}>$</span>
              <span
                style={{
                  display: 'inline-block',
                  width: fontSize * 0.55,
                  height: fontSize * 1.05,
                  background: theme.accent,
                  opacity: frame % 16 < 9 ? 0.95 : 0.15,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </SceneShell>
  );
};
