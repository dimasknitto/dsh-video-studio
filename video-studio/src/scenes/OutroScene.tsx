import React from 'react';
import type {OutroScene as OutroSceneSpec, Theme} from '../spec';
import {SceneShell} from '../ui/SceneShell';
import {useEnter, useUnit} from '../ui/motion';
import {alpha} from '../ui/Background';

interface Props {
  scene: OutroSceneSpec;
  theme: Theme;
  durationInFrames: number;
  transitionFrames: number;
}

export const OutroScene: React.FC<Props> = ({scene, theme, durationInFrames, transitionFrames}) => {
  const u = useUnit();
  const enter = useEnter(2, 36, 0.96);
  const cta = useEnter(16, 24);
  const handle = useEnter(26, 18);
  const length = scene.text.length;
  const size = Math.max(54 * u, (108 - Math.max(0, length - 16) * 1.4) * u);

  return (
    <SceneShell durationInFrames={durationInFrames} transitionFrames={transitionFrames}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
          gap: 30 * u,
        }}
      >
        <div
          style={{
            ...enter,
            fontSize: size,
            lineHeight: 1.02,
            fontWeight: 820,
            letterSpacing: -3 * u,
            backgroundImage: `linear-gradient(100deg, ${theme.accent} 5%, ${theme.accent2} 95%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            maxWidth: 900 * u,
          }}
        >
          {scene.text}
        </div>
        {scene.subtitle ? (
          <div style={{fontSize: 34 * u, color: theme.muted, maxWidth: 760 * u, lineHeight: 1.45}}>
            {scene.subtitle}
          </div>
        ) : null}
        {scene.cta ? (
          <div
            style={{
              ...cta,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 14 * u,
              padding: `${20 * u}px ${34 * u}px`,
              borderRadius: 999,
              fontSize: 31 * u,
              fontWeight: 700,
              color: theme.isLight ? '#fff' : '#07070c',
              background: `linear-gradient(120deg, ${theme.accent}, ${theme.accent2})`,
              boxShadow: `0 ${16 * u}px ${50 * u}px ${alpha(theme.accent, 0.45)}`,
            }}
          >
            {scene.cta}
            <span style={{fontSize: 34 * u}}>→</span>
          </div>
        ) : null}
        {scene.handle ? (
          <div
            style={{
              ...handle,
              marginTop: 10 * u,
              fontSize: 25 * u,
              letterSpacing: 3 * u,
              textTransform: 'uppercase',
              color: theme.muted,
              fontWeight: 600,
            }}
          >
            {scene.handle}
          </div>
        ) : null}
      </div>
    </SceneShell>
  );
};
