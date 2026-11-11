import React from 'react';
import {AbsoluteFill, Img, useVideoConfig} from 'remotion';
import type {SplitScene as SplitSceneSpec, Theme} from '../spec';
import {SceneShell} from '../ui/SceneShell';
import {assetSrc} from '../ui/media';
import {Kicker} from '../ui/Atoms';
import {useEnter, useUnit} from '../ui/motion';
import {alpha} from '../ui/Background';

interface Props {
  scene: SplitSceneSpec;
  theme: Theme;
  durationInFrames: number;
  transitionFrames: number;
}

export const SplitScene: React.FC<Props> = ({scene, theme, durationInFrames, transitionFrames}) => {
  const u = useUnit();
  const {width, height} = useVideoConfig();
  const portrait = height >= width;
  const side = scene.side ?? 'top';
  const stacked = portrait || side === 'top';
  const imageFirst = side !== 'right';
  const image = useEnter(2, 30, 0.97);
  const copy = useEnter(12, 30);

  const media = (
    <div
      style={{
        ...image,
        flex: stacked ? '0 0 44%' : '1 1 50%',
        minHeight: 0,
        borderRadius: theme.radius,
        overflow: 'hidden',
        border: `1px solid ${theme.border}`,
        boxShadow: `0 ${26 * u}px ${70 * u}px rgba(0,0,0,0.35)`,
        background: theme.surface,
      }}
    >
      {scene.image ? (
        <Img
          src={assetSrc(scene.image)}
          style={{width: '100%', height: '100%', objectFit: scene.fit ?? 'cover'}}
        />
      ) : (
        <AbsoluteFill
          style={{background: `linear-gradient(150deg, ${alpha(theme.accent, 0.5)}, ${alpha(theme.accent2, 0.35)})`}}
        />
      )}
    </div>
  );

  const text = (
    <div
      style={{
        ...copy,
        flex: '1 1 50%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 20 * u,
        paddingLeft: stacked ? 0 : imageFirst ? 36 * u : 0,
        paddingRight: stacked ? 0 : imageFirst ? 0 : 36 * u,
      }}
    >
      {scene.kicker ? <Kicker text={scene.kicker} theme={theme} /> : null}
      <div
        style={{
          fontSize: (stacked ? 66 : 58) * u,
          lineHeight: 1.08,
          fontWeight: 780,
          letterSpacing: -1.8 * u,
          color: theme.fg,
        }}
      >
        {scene.heading}
      </div>
      {scene.body ? (
        <div style={{fontSize: 31 * u, lineHeight: 1.5, color: theme.muted, maxWidth: 620 * u}}>
          {scene.body}
        </div>
      ) : null}
    </div>
  );

  return (
    <SceneShell durationInFrames={durationInFrames} transitionFrames={transitionFrames}>
      <div
        style={{
          display: 'flex',
          flexDirection: stacked ? 'column' : imageFirst ? 'row' : 'row-reverse',
          gap: 34 * u,
          width: '100%',
          height: '100%',
          alignItems: 'stretch',
          justifyContent: 'center',
        }}
      >
        {media}
        {text}
      </div>
    </SceneShell>
  );
};
