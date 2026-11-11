import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {CodeScene as CodeSceneSpec, Theme} from '../spec';
import {SceneShell} from '../ui/SceneShell';
import {useEnter, useUnit} from '../ui/motion';
import {alpha} from '../ui/Background';

interface Props {
  scene: CodeSceneSpec;
  theme: Theme;
  durationInFrames: number;
  transitionFrames: number;
}

const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'new', 'class',
  'import', 'from', 'export', 'default', 'await', 'async', 'try', 'catch', 'throw', 'typeof',
  'interface', 'type', 'extends', 'implements', 'public', 'private', 'readonly', 'def', 'lambda',
  'in', 'is', 'not', 'and', 'or', 'None', 'True', 'False', 'self', 'print', 'echo', 'sudo',
  'cd', 'npm', 'npx', 'node', 'git', 'true', 'false', 'null', 'undefined',
]);

type Token = {text: string; color: string; italic?: boolean};

function tokenize(line: string, theme: Theme): Token[] {
  const tokens: Token[] = [];
  const pattern =
    /(\/\/.*$|#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|([{}()[\];,.=+\-*/<>!&|:?]+)|(\s+)/g;
  let match: RegExpExecArray | null;
  let cursor = 0;
  while ((match = pattern.exec(line)) !== null) {
    if (match.index > cursor) {
      tokens.push({text: line.slice(cursor, match.index), color: theme.fg});
    }
    const [raw, comment, str, num, word, punct] = match;
    if (comment) tokens.push({text: raw, color: theme.muted, italic: true});
    else if (str) tokens.push({text: raw, color: theme.accent2});
    else if (num) tokens.push({text: raw, color: theme.isLight ? '#9a3412' : '#ffb86b'});
    else if (word)
      tokens.push({
        text: raw,
        color: KEYWORDS.has(word) ? theme.accent : theme.fg,
        italic: KEYWORDS.has(word) && word === 'def',
      });
    else if (punct) tokens.push({text: raw, color: theme.isLight ? theme.muted : alpha(theme.fg, 0.62)});
    else tokens.push({text: raw, color: theme.fg});
    cursor = match.index + raw.length;
  }
  if (cursor < line.length) tokens.push({text: line.slice(cursor), color: theme.fg});
  return tokens;
}

export const CodeScene: React.FC<Props> = ({scene, theme, durationInFrames, transitionFrames}) => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = useEnter(0, 24, 0.97);
  const lines = scene.code.replace(/\t/g, '  ').split('\n');
  const maxLength = Math.max(...lines.map((line) => line.length), 24);
  const fontSize = Math.max(18 * u, Math.min(30 * u, (1000 * u) / (maxLength * 0.6)));
  const highlight = new Set(scene.highlight ?? []);
  const lineDelay = Math.min(4, Math.max(1.5, (durationInFrames * 0.4) / Math.max(1, lines.length)));
  const visible = (index: number) => {
    const appear = index * lineDelay;
    return frame >= appear || index === 0;
  };

  return (
    <SceneShell durationInFrames={durationInFrames} transitionFrames={transitionFrames}>
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', gap: 24 * u}}>
        <div
          style={{
            ...enter,
            borderRadius: theme.radius,
            overflow: 'hidden',
            border: `1px solid ${theme.border}`,
            background: theme.isLight ? '#fffdf7' : 'rgba(9,11,20,0.86)',
            boxShadow: `0 ${30 * u}px ${80 * u}px rgba(0,0,0,${theme.isLight ? 0.18 : 0.5})`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12 * u,
              padding: `${16 * u}px ${22 * u}px`,
              borderBottom: `1px solid ${theme.border}`,
              background: theme.surface,
            }}
          >
            {['#ff5f57', '#febc2e', '#28c840'].map((color) => (
              <span key={color} style={{width: 14 * u, height: 14 * u, borderRadius: 99, background: color}} />
            ))}
            <span
              style={{
                marginLeft: 12 * u,
                fontFamily: theme.mono,
                fontSize: 22 * u,
                color: theme.muted,
                letterSpacing: 0.4,
              }}
            >
              {scene.filename ?? 'snippet.ts'}
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: theme.mono,
                fontSize: 18 * u,
                color: theme.muted,
                padding: `${4 * u}px ${10 * u}px`,
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
              }}
            >
              {scene.language ?? 'ts'}
            </span>
          </div>
          <div style={{padding: `${26 * u}px ${28 * u}px`, display: 'flex', flexDirection: 'column', gap: 6 * u}}>
            {lines.map((line, index) => {
              const shown = visible(index);
              const isHot = highlight.has(index + 1);
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: 22 * u,
                    alignItems: 'flex-start',
                    opacity: shown ? 1 : 0.15,
                    transform: `translateY(${shown ? 0 : 8}px)`,
                    padding: `${2 * u}px ${12 * u}px`,
                    marginLeft: -12 * u,
                    borderRadius: 8,
                    background: isHot ? alpha(theme.accent, 0.16) : 'transparent',
                    boxShadow: isHot ? `inset ${3 * u}px 0 0 ${theme.accent}` : undefined,
                  }}
                >
                  <span
                    style={{
                      flex: '0 0 auto',
                      width: 34 * u,
                      textAlign: 'right',
                      fontFamily: theme.mono,
                      fontSize: fontSize * 0.78,
                      lineHeight: 1.55,
                      color: alpha(theme.muted, 0.55),
                      userSelect: 'none',
                    }}
                  >
                    {index + 1}
                  </span>
                  <code
                    style={{
                      fontFamily: theme.mono,
                      fontSize,
                      lineHeight: 1.55,
                      whiteSpace: 'pre',
                      letterSpacing: -0.2,
                    }}
                  >
                    {tokenize(line, theme).map((token, tokenIndex) => (
                      <span
                        key={tokenIndex}
                        style={{color: token.color, fontStyle: token.italic ? 'italic' : 'normal'}}
                      >
                        {token.text}
                      </span>
                    ))}
                  </code>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SceneShell>
  );
};
