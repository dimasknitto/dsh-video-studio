import React from 'react';
import {Composition} from 'remotion';
import {defaultSpec} from './default-spec';
import {Video} from './Video';
import type {VideoSpec} from './spec';
import {fpsOf, totalFrames} from './spec';

const calculateMetadata = ({props}: {props: VideoSpec}) => {
  const fps = fpsOf(props);
  return {
    durationInFrames: Math.max(1, totalFrames(props)),
    fps,
    width: props.meta?.width ?? 1080,
    height: props.meta?.height ?? 1920,
  };
};

/**
 * One composition, any video: dimensions, fps, and duration come from the
 * spec. `video.mjs preview` passes the selected project as `--props`.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Video"
      component={Video}
      durationInFrames={120}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultSpec}
      calculateMetadata={calculateMetadata}
    />
  );
};
