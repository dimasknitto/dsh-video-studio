import React from 'react';
import type {Scene, Theme} from '../spec';
import {TitleScene} from './TitleScene';
import {BulletsScene} from './BulletsScene';
import {StatScene} from './StatScene';
import {QuoteScene} from './QuoteScene';
import {ImageScene} from './ImageScene';
import {VideoScene} from './VideoScene';
import {CodeScene} from './CodeScene';
import {TerminalScene} from './TerminalScene';
import {ChatScene} from './ChatScene';
import {SplitScene} from './SplitScene';
import {BarsScene} from './BarsScene';
import {OutroScene} from './OutroScene';
import {AbsoluteFill} from 'remotion';

interface SceneViewProps {
  scene: Scene;
  theme: Theme;
  durationInFrames: number;
  transitionFrames: number;
}

/** Dispatch one spec scene to its renderer. */
export const SceneView: React.FC<SceneViewProps> = (props) => {
  const {scene} = props;
  const common = {
    theme: props.theme,
    durationInFrames: props.durationInFrames,
    transitionFrames: props.transitionFrames,
  };

  const body = (() => {
    switch (scene.type) {
      case 'title':
        return <TitleScene scene={scene} {...common} />;
      case 'bullets':
        return <BulletsScene scene={scene} {...common} />;
      case 'stat':
        return <StatScene scene={scene} {...common} />;
      case 'quote':
        return <QuoteScene scene={scene} {...common} />;
      case 'image':
        return <ImageScene scene={scene} {...common} />;
      case 'video':
        return <VideoScene scene={scene} {...common} />;
      case 'code':
        return <CodeScene scene={scene} {...common} />;
      case 'terminal':
        return <TerminalScene scene={scene} {...common} />;
      case 'chat':
        return <ChatScene scene={scene} {...common} />;
      case 'split':
        return <SplitScene scene={scene} {...common} />;
      case 'bars':
        return <BarsScene scene={scene} {...common} />;
      case 'outro':
        return <OutroScene scene={scene} {...common} />;
      case 'blank':
        return <AbsoluteFill style={{background: scene.color ?? 'transparent'}} />;
      default:
        return null;
    }
  })();

  return (
    <>
      {scene.bg ? <AbsoluteFill style={{background: scene.bg}} /> : null}
      {body}
    </>
  );
};
