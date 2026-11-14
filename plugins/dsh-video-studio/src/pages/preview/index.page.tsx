import { formatBytes, formatDuration } from '@/lib/format';
import { RenderActions } from '@/pages/render/components/render-actions';
import { JobLog } from '@/pages/render/components/job-log';
import type { StudioJob, StudioProject } from '@/types';
import { SceneTimeline } from './components/scene-timeline';
import { VideoPlayer } from './components/video-player';

interface ProjectDetailProps {
  project: StudioProject;
  job: StudioJob | null;
  busy: boolean;
  running: boolean;
  onRender: () => void;
  onDraft: () => void;
  onStudio: () => void;
}

export function ProjectDetail({
  project,
  job,
  busy,
  running,
  onRender,
  onDraft,
  onStudio,
}: ProjectDetailProps) {
  const video = project.outputs.find((output) => output.kind === 'video') ?? null;

  return (
    <section className="dvs-card">
      <div className="dvs-detail">
        <div className="dvs-playerCol">
          <VideoPlayer project={project} />
          <SceneTimeline timeline={project.timeline} />
        </div>
        <div className="dvs-side">
          <div className="dvs-metaStack">
            <div className="dvs-metaRow">
              <span>Project</span>
              <code>{project.slug}</code>
            </div>
            <div className="dvs-metaRow">
              <span>Durasi</span>
              <span>
                {formatDuration(project.seconds)} · {project.sceneCount} scene
              </span>
            </div>
            <div className="dvs-metaRow">
              <span>Format</span>
              <span>
                {project.width}×{project.height} · {project.fps}fps
              </span>
            </div>
            <div className="dvs-metaRow">
              <span>Output</span>
              <span>{video ? `${video.name} · ${formatBytes(video.size)}` : 'belum ada'}</span>
            </div>
          </div>
          <RenderActions
            busy={busy}
            running={running}
            onRender={onRender}
            onDraft={onDraft}
            onStudio={onStudio}
          />
          {job ? <JobLog job={job} /> : null}
        </div>
      </div>
    </section>
  );
}
