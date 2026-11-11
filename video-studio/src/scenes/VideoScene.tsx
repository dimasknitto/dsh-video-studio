import React from 'react';
import {AbsoluteFill, OffthreadVideo, useVideoConfig} from 'remotion';
import type {Theme, VideoScene as VideoSceneSpec} from '../spec';
import {SceneShell} from '../ui/SceneShell';
import {assetSrc} from '../ui/media';
import {useUnit} from '../ui/motion';

interface Props {
  scene: VideoSceneSpec;
  theme: Theme;
  durationInFrames: number;
  transitionFrames: number;
}

export const VideoScene: React.FC<Props> = ({scene, theme, durationInFrames, transitionFrames}) => {
  const u = useUnit();
  const {fps} = useVideoConfig();
  const inset = scene.inset ?? false;
  const startFrom = Math.max(0, Math.round((scene.trimStart ?? 0) * fps));
  const endAt =
    typeof scene.trimEnd === 'number' && scene.trimEnd > 0
      ? Math.round(scene.trimEnd * fps)
      : undefined;

  return (
    <SceneShell
      durationInFrames={durationInFrames}
      transitionFrames={transitionFrames}
      style={{padding: inset ? `${90 * u}px ${70 * u}px` : 0}}
    >
      <AbsoluteFill
        style={{
          borderRadius: inset || scene.rounded ? theme.radius : 0,
          overflow: 'hidden',
          backgroundColor: '#000',
          boxShadow: inset ? `0 ${30 * u}px ${90 * u}px rgba(0,0,0,0.5)` : undefined,
        }}
      >
        <OffthreadVideo
          src={assetSrc(scene.src)}
          startFrom={startFrom > 0 ? startFrom : undefined}
          endAt={endAt}
          muted={scene.muted ?? true}
          volume={scene.volume ?? 1}
          playbackRate={scene.playbackRate ?? 1}
          style={{
            width: '100%',
            height: '100%',
            objectFit: scene.fit ?? 'cover',
          }}
        />
      </AbsoluteFill>
    </SceneShell>
  );
};
