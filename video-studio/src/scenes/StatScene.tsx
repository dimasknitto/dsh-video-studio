import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import type {StatScene as StatSceneSpec, Theme} from '../spec';
import {SceneShell} from '../ui/SceneShell';
import {Kicker} from '../ui/Atoms';
import {useEnter, useUnit} from '../ui/motion';
import {alpha} from '../ui/Background';

interface Props {
  scene: StatSceneSpec;
  theme: Theme;
  durationInFrames: number;
  transitionFrames: number;
}

const NUMBER = /^([^\d-]*)(-?\d+(?:[.,]\d+)?)(.*)$/;

export const StatScene: React.FC<Props> = ({scene, theme, durationInFrames, transitionFrames}) => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const enter = useEnter(2, 40, 0.94);

  const match = NUMBER.exec(scene.value.trim());
  let display = scene.value;
  if (match) {
    const [, prefix, raw, suffix] = match;
    const normalised = raw.replace(',', '.');
    const target = Number(normalised);
    if (Number.isFinite(target)) {
      const decimals = normalised.includes('.') ? normalised.split('.')[1].length : 0;
      // Counting up reads as motion for "1,204" but as a glitch for "1".
      const shouldCount = Math.abs(target) >= 10;
      const progress = shouldCount
        ? interpolate(frame, [4, 46], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          })
        : 1;
      const current = target * progress;
      display = `${prefix}${current.toFixed(decimals)}${suffix}`;
    }
  }

  const size = Math.max(120 * u, (250 - Math.max(0, display.length - 4) * 26) * u);

  return (
    <SceneShell durationInFrames={durationInFrames} transitionFrames={transitionFrames}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          gap: 26 * u,
          width: '100%',
        }}
      >
        {scene.kicker ? <Kicker text={scene.kicker} theme={theme} /> : null}
        <div
          style={{
            ...enter,
            fontSize: size,
            lineHeight: 0.95,
            fontWeight: 820,
            letterSpacing: -8 * u,
            backgroundImage: `linear-gradient(120deg, ${theme.accent} 10%, ${theme.accent2} 90%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: `drop-shadow(0 ${18 * u}px ${60 * u}px ${alpha(theme.accent, 0.35)})`,
          }}
        >
          {display}
        </div>
        <div style={{fontSize: 42 * u, fontWeight: 650, color: theme.fg, maxWidth: 820 * u, lineHeight: 1.3}}>
          {scene.label}
        </div>
        {scene.note ? (
          <div style={{fontSize: 29 * u, color: theme.muted, maxWidth: 760 * u, lineHeight: 1.45}}>
            {scene.note}
          </div>
        ) : null}
      </div>
    </SceneShell>
  );
};
