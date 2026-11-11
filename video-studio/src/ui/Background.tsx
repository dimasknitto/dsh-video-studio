import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {Theme} from '../spec';
import {useUnit} from './motion';

export function alpha(color: string, amount: number): string {
  return `color-mix(in srgb, ${color} ${Math.round(amount * 100)}%, transparent)`;
}

interface BackgroundProps {
  theme: Theme;
  grid?: boolean;
  bg?: string;
}

/**
 * The shared stage: a tinted base, two slowly drifting accent glows, an
 * optional blueprint grid, and a vignette. Kept subtle so type stays the hero.
 */
export const Background: React.FC<BackgroundProps> = ({theme, grid = true, bg}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const driftX = Math.sin(frame / 140) * 40 * u;
  const driftY = Math.cos(frame / 170) * 30 * u;

  return (
    <AbsoluteFill style={{backgroundColor: bg ?? theme.bg, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(58% 42% at 16% 10%, ${alpha(theme.accent, theme.isLight ? 0.16 : 0.3)}, transparent 72%)`,
            `radial-gradient(52% 38% at 86% 86%, ${alpha(theme.accent2, theme.isLight ? 0.14 : 0.24)}, transparent 70%)`,
            `radial-gradient(70% 50% at 50% 115%, ${alpha(theme.accent, theme.isLight ? 0.1 : 0.18)}, transparent 75%)`,
          ].join(','),
          transform: `translate(${driftX}px, ${driftY}px) scale(1.12)`,
        }}
      />
      {grid ? (
        <AbsoluteFill
          style={{
            backgroundImage: [
              `linear-gradient(${alpha(theme.fg, theme.isLight ? 0.055 : 0.05)} 1px, transparent 1px)`,
              `linear-gradient(90deg, ${alpha(theme.fg, theme.isLight ? 0.055 : 0.05)} 1px, transparent 1px)`,
            ].join(','),
            backgroundSize: `${72 * u}px ${72 * u}px, ${72 * u}px ${72 * u}px`,
            maskImage:
              'radial-gradient(120% 90% at 50% 40%, black 10%, rgba(0,0,0,0.55) 55%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(120% 90% at 50% 40%, black 10%, rgba(0,0,0,0.55) 55%, transparent 100%)',
          }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          background: theme.isLight
            ? `radial-gradient(120% 100% at 50% 45%, transparent 55%, ${alpha('#5b4a33', 0.12)} 100%)`
            : `radial-gradient(110% 90% at 50% 45%, transparent 45%, rgba(0,0,0,0.55) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
