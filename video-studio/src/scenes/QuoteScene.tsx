import React from 'react';
import type {QuoteScene as QuoteSceneSpec, Theme} from '../spec';
import {SceneShell} from '../ui/SceneShell';
import {useEnter, useUnit} from '../ui/motion';
import {alpha} from '../ui/Background';

interface Props {
  scene: QuoteSceneSpec;
  theme: Theme;
  durationInFrames: number;
  transitionFrames: number;
}

export const QuoteScene: React.FC<Props> = ({scene, theme, durationInFrames, transitionFrames}) => {
  const u = useUnit();
  const mark = useEnter(0, 30, 0.8);
  const text = useEnter(8, 30);
  const author = useEnter(22, 24);

  return (
    <SceneShell durationInFrames={durationInFrames} transitionFrames={transitionFrames}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
          gap: 20 * u,
        }}
      >
        <div
          style={{
            ...mark,
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 190 * u,
            lineHeight: 0.7,
            color: theme.accent,
            opacity: 0.9,
            height: 90 * u,
          }}
        >
          “
        </div>
        <blockquote
          style={{
            ...text,
            margin: 0,
            fontSize: Math.max(42 * u, (66 - Math.max(0, scene.text.length - 90) * 0.28) * u),
            lineHeight: 1.28,
            fontWeight: 620,
            letterSpacing: -1.2 * u,
            color: theme.fg,
            maxWidth: 900 * u,
          }}
        >
          {scene.text}
        </blockquote>
        {scene.author ? (
          <div
            style={{
              ...author,
              display: 'flex',
              alignItems: 'center',
              gap: 18 * u,
              marginTop: 18 * u,
            }}
          >
            <span
              style={{
                width: 54 * u,
                height: 3 * u,
                borderRadius: 9,
                background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})`,
              }}
            />
            <span style={{fontSize: 30 * u, fontWeight: 700, color: theme.fg}}>{scene.author}</span>
            {scene.role ? (
              <span
                style={{
                  fontSize: 27 * u,
                  color: theme.muted,
                  paddingLeft: 18 * u,
                  borderLeft: `1px solid ${alpha(theme.fg, 0.18)}`,
                }}
              >
                {scene.role}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </SceneShell>
  );
};
