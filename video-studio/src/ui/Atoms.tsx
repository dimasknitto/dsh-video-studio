import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from '../spec';
import {enterAt, useEnter, useUnit} from './motion';
import {alpha} from './Background';

interface KickerProps {
  text: string;
  theme: Theme;
  delay?: number;
}

/** Small uppercase label with a glowing accent dot. */
export const Kicker: React.FC<KickerProps> = ({text, theme, delay = 0}) => {
  const u = useUnit();
  const enter = useEnter(delay, 18);
  return (
    <div
      style={{
        ...enter,
        display: 'flex',
        alignItems: 'center',
        gap: 14 * u,
        fontSize: 26 * u,
        fontWeight: 700,
        letterSpacing: 4.5 * u,
        textTransform: 'uppercase',
        color: theme.accent,
      }}
    >
      <span
        style={{
          width: 12 * u,
          height: 12 * u,
          borderRadius: 99,
          background: theme.accent,
          boxShadow: `0 0 ${24 * u}px ${alpha(theme.accent, 0.9)}`,
        }}
      />
      {text}
    </div>
  );
};

interface PillProps {
  children: React.ReactNode;
  theme: Theme;
  tone?: 'accent' | 'muted';
}

export const Pill: React.FC<PillProps> = ({children, theme, tone = 'accent'}) => {
  const u = useUnit();
  const color = tone === 'accent' ? theme.accent : theme.muted;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10 * u,
        padding: `${10 * u}px ${20 * u}px`,
        borderRadius: 999,
        fontSize: 24 * u,
        fontWeight: 600,
        letterSpacing: 0.4 * u,
        color,
        background: alpha(color, 0.12),
        border: `1px solid ${alpha(color, 0.3)}`,
      }}
    >
      {children}
    </span>
  );
};

/** Split a headline into words and reveal them in sequence. */
export const StaggerWords: React.FC<{
  text: string;
  theme: Theme;
  delay?: number;
  style?: React.CSSProperties;
}> = ({text, theme, delay = 0, style}) => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span style={{display: 'inline', ...style}}>
      {words.map((word, index) => {
        const enter = enterAt(frame, fps, delay + index * 3, 26);
        return (
          <span
            key={`${word}-${index}`}
            style={{
              display: 'inline-block',
              opacity: enter.opacity,
              transform: enter.transform,
              marginRight: `${0.26 * u * 16}px`,
              color: theme.fg,
            }}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
};
