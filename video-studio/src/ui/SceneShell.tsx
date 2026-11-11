import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {useUnit} from './motion';

interface SceneShellProps {
  durationInFrames: number;
  transitionFrames: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Cross-fades a scene in and out at the sequence edges. Scenes are laid out
 * back-to-back, so this is what makes a cut feel like a transition.
 */
export const SceneShell: React.FC<SceneShellProps> = ({
  durationInFrames,
  transitionFrames,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const fade = Math.max(1, Math.min(transitionFrames, Math.floor(durationInFrames / 3)));
  const fadeIn = interpolate(frame, [0, fade], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [durationInFrames - fade, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(frame, [0, Math.max(1, durationInFrames)], [1.015, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(fadeIn, fadeOut),
        transform: `scale(${scale})`,
        padding: `${96 * useUnit()}px ${78 * useUnit()}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
