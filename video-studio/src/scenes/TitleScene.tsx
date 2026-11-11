import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import type {Theme, TitleScene as TitleSceneSpec} from '../spec';
import {SceneShell} from '../ui/SceneShell';
import {Kicker} from '../ui/Atoms';
import {useEnter, useUnit} from '../ui/motion';
import {alpha} from '../ui/Background';

interface Props {
  scene: TitleSceneSpec;
  theme: Theme;
  durationInFrames: number;
  transitionFrames: number;
}

export const TitleScene: React.FC<Props> = ({scene, theme, durationInFrames, transitionFrames}) => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const centered = scene.align === 'center';
  const kicker = useEnter(2, 20);
  const subtitle = useEnter(16, 26);
  const lineWidth = interpolate(frame, [10, 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const length = scene.text.trim().length;
  const size = Math.max(54 * u, (118 - Math.max(0, length - 18) * 1.6) * u);

  return (
    <SceneShell durationInFrames={durationInFrames} transitionFrames={transitionFrames}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: centered ? 'center' : 'flex-start',
          textAlign: centered ? 'center' : 'left',
          gap: 30 * u,
          width: '100%',
        }}
      >
        {scene.kicker ? (
          <div style={kicker}>
            <Kicker text={scene.kicker} theme={theme} />
          </div>
        ) : null}
        <h1
          style={{
            margin: 0,
            fontSize: size,
            lineHeight: 1.02,
            letterSpacing: -3.2 * u,
            fontWeight: 800,
            color: theme.fg,
            ...(scene.gradient
              ? {
                  backgroundImage: `linear-gradient(96deg, ${theme.accent} 0%, ${theme.accent2} 100%)`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }
              : {}),
          }}
        >
          {scene.text}
        </h1>
        <div
          style={{
            height: 8 * u,
            width: 150 * u * lineWidth,
            borderRadius: 99,
            background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})`,
            boxShadow: `0 0 ${30 * u}px ${alpha(theme.accent, 0.55)}`,
          }}
        />
        {scene.subtitle ? (
          <p
            style={{
              ...subtitle,
              margin: 0,
              maxWidth: 860 * u,
              fontSize: 36 * u,
              lineHeight: 1.45,
              color: theme.muted,
              fontWeight: 450,
            }}
          >
            {scene.subtitle}
          </p>
        ) : null}
      </div>
    </SceneShell>
  );
};
