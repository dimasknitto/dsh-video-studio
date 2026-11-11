import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame} from 'remotion';
import type {ImageScene as ImageSceneSpec, Theme} from '../spec';
import {SceneShell} from '../ui/SceneShell';
import {assetSrc} from '../ui/media';
import {useEnter, useUnit} from '../ui/motion';
import {alpha} from '../ui/Background';

interface Props {
  scene: ImageSceneSpec;
  theme: Theme;
  durationInFrames: number;
  transitionFrames: number;
}

export const ImageScene: React.FC<Props> = ({scene, theme, durationInFrames, transitionFrames}) => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const enter = useEnter(14, 30);
  const progress = interpolate(frame, [0, Math.max(1, durationInFrames)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ken = scene.kenBurns ?? 'zoom-in';
  const scale =
    ken === 'zoom-in' ? 1 + progress * 0.09 : ken === 'zoom-out' ? 1.09 - progress * 0.09 : 1.04;
  const translateX = ken === 'pan-left' ? (progress - 0.5) * -6 : ken === 'pan-right' ? (progress - 0.5) * 6 : 0;
  const overlay = scene.overlay ?? 0.55;
  const inset = scene.inset ?? false;

  return (
    <SceneShell
      durationInFrames={durationInFrames}
      transitionFrames={transitionFrames}
      style={{padding: inset ? `${90 * u}px ${70 * u}px` : 0}}
    >
      <AbsoluteFill
        style={{
          borderRadius: inset ? theme.radius : 0,
          overflow: 'hidden',
          boxShadow: inset ? `0 ${30 * u}px ${90 * u}px rgba(0,0,0,0.45)` : undefined,
        }}
      >
        <Img
          src={assetSrc(scene.src)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: scene.fit ?? 'cover',
            transform: `scale(${scale}) translateX(${translateX}%)`,
          }}
        />
        <AbsoluteFill
          style={{
            background: `linear-gradient(180deg, ${alpha('#000', Math.min(0.7, overlay * 0.55))} 0%, ${alpha('#000', 0.08)} 38%, ${alpha('#000', overlay)} 100%)`,
          }}
        />
      </AbsoluteFill>

      {scene.heading || scene.body ? (
        <div
          style={{
            ...enter,
            position: 'absolute',
            left: inset ? 70 * u + 46 * u : 78 * u,
            right: inset ? 70 * u + 46 * u : 78 * u,
            bottom: inset ? 90 * u + 46 * u : 150 * u,
            display: 'flex',
            flexDirection: 'column',
            gap: 16 * u,
          }}
        >
          {scene.heading ? (
            <div
              style={{
                fontSize: 66 * u,
                lineHeight: 1.06,
                fontWeight: 780,
                letterSpacing: -2 * u,
                color: '#ffffff',
                textShadow: `0 ${8 * u}px ${34 * u}px rgba(0,0,0,0.55)`,
              }}
            >
              {scene.heading}
            </div>
          ) : null}
          {scene.body ? (
            <div style={{fontSize: 31 * u, lineHeight: 1.45, color: 'rgba(255,255,255,0.82)', maxWidth: 780 * u}}>
              {scene.body}
            </div>
          ) : null}
        </div>
      ) : null}
    </SceneShell>
  );
};
