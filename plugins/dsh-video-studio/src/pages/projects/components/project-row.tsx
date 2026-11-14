import { Icon } from '@/components/ui/icon';
import { formatDuration } from '@/lib/format';
import type { StudioProject } from '@/types';

interface ProjectRowProps {
  project: StudioProject;
  active: boolean;
  onSelect: (slug: string) => void;
}

export function ProjectRow({ project, active, onSelect }: ProjectRowProps) {
  return (
    <button
      type="button"
      className="dvs-row"
      data-active={active ? 'true' : 'false'}
      onClick={() => onSelect(project.slug)}
      title={project.slug}
    >
      <div className="dvs-rowThumb">
        {project.cover ? (
          <img src={`${project.cover}?v=${project.updatedAt}`} alt="" loading="lazy" />
        ) : (
          <Icon size={20} />
        )}
      </div>
      <div className="dvs-rowBody">
        <div className="dvs-rowTitle">{project.title || project.slug}</div>
        <div className="dvs-rowMeta">
          {formatDuration(project.seconds)} · {project.sceneCount} scene · {project.width}×
          {project.height}
        </div>
      </div>
    </button>
  );
}
