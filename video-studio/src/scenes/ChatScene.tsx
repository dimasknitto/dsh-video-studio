import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {ChatScene as ChatSceneSpec, Theme} from '../spec';
import {SceneShell} from '../ui/SceneShell';
import {enterAt, useEnter, useUnit} from '../ui/motion';
import {alpha} from '../ui/Background';

interface Props {
  scene: ChatSceneSpec;
  theme: Theme;
  durationInFrames: number;
  transitionFrames: number;
}

export const ChatScene: React.FC<Props> = ({scene, theme, durationInFrames, transitionFrames}) => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const heading = useEnter(0, 22);
  const messages = scene.messages;
  const count = Math.max(1, messages.length);
  const step = Math.min(20, Math.max(8, Math.floor((durationInFrames * 0.55) / count)));

  return (
    <SceneShell durationInFrames={durationInFrames} transitionFrames={transitionFrames}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
          gap: 26 * u,
        }}
      >
        {scene.title ? (
          <div
            style={{
              ...heading,
              fontSize: 30 * u,
              fontWeight: 700,
              color: theme.muted,
              letterSpacing: 0.4 * u,
              display: 'flex',
              alignItems: 'center',
              gap: 14 * u,
            }}
          >
            <span
              style={{
                width: 40 * u,
                height: 40 * u,
                borderRadius: 12 * u,
                background: `linear-gradient(140deg, ${theme.accent}, ${theme.accent2})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22 * u,
                color: theme.isLight ? '#fff' : '#07070c',
                fontWeight: 800,
              }}
            >
              AI
            </span>
            {scene.title}
          </div>
        ) : null}

        <div style={{display: 'flex', flexDirection: 'column', gap: 20 * u}}>
          {messages.map((message, index) => {
            const start = 8 + index * step;
            const isUser = message.role === 'user';
            const typingEnd = start + (isUser ? 0 : 14);
            const visible = frame >= start;
            const typing = !isUser && frame >= start && frame < typingEnd;
            const enter = enterAt(frame, fps, start + (isUser ? 0 : 14), 24);
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: isUser ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 16 * u,
                  opacity: visible ? 1 : 0,
                }}
              >
                <div
                  style={{
                    flex: '0 0 auto',
                    width: 52 * u,
                    height: 52 * u,
                    borderRadius: 99,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isUser ? 15 * u : 19 * u,
                    fontWeight: 800,
                    letterSpacing: isUser ? 0.2 * u : 0.5 * u,
                    color: isUser ? theme.muted : theme.isLight ? '#fff' : '#08080d',
                    background: isUser
                      ? theme.surface
                      : `linear-gradient(140deg, ${theme.accent}, ${theme.accent2})`,
                    border: isUser ? `1px solid ${theme.border}` : 'none',
                  }}
                >
                  {isUser ? (message.name ?? 'YOU').slice(0, 3).toUpperCase() : 'AI'}
                </div>
                <div
                  style={{
                    ...(typing ? {} : enter),
                    maxWidth: '76%',
                    padding: `${20 * u}px ${26 * u}px`,
                    borderRadius: 24 * u,
                    borderBottomRightRadius: isUser ? 8 * u : 24 * u,
                    borderBottomLeftRadius: isUser ? 24 * u : 8 * u,
                    background: isUser
                      ? alpha(theme.accent, theme.isLight ? 0.16 : 0.2)
                      : theme.surface,
                    border: `1px solid ${isUser ? alpha(theme.accent, 0.32) : theme.border}`,
                    fontSize: (isUser ? 31 : 33) * u,
                    lineHeight: 1.42,
                    color: theme.fg,
                    fontWeight: isUser ? 500 : 450,
                  }}
                >
                  {typing ? (
                    <span style={{display: 'inline-flex', gap: 8 * u, alignItems: 'center', height: 30 * u}}>
                      {[0, 1, 2].map((dot) => (
                        <span
                          key={dot}
                          style={{
                            width: 12 * u,
                            height: 12 * u,
                            borderRadius: 99,
                            background: theme.accent,
                            opacity: 0.35 + 0.65 * Math.abs(Math.sin((frame + dot * 4) / 6)),
                          }}
                        />
                      ))}
                    </span>
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SceneShell>
  );
};
