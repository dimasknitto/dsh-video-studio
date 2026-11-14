import type { StudioProject } from '@/types';

interface VideoPlayerProps {
  project: StudioProject;
}

export function VideoPlayer({ project }: VideoPlayerProps) {
  const video = project.outputs.find((output) => output.kind === 'video');

  if (!video) {
    return <div className="dvs-emptyPlayer">Belum ada render untuk project ini</div>;
  }

  return (
    <video
      key={video.url + video.mtime}
      className="dvs-player"
      src={`${video.url}?v=${video.mtime}`}
      controls
      playsInline
      preload="metadata"
      poster={project.cover ? `${project.cover}?v=${project.updatedAt}` : undefined}
    />
  );
}
