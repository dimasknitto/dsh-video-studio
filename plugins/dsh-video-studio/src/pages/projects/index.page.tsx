import type { StudioProject } from '@/types';
import { ProjectRow } from './components/project-row';

interface ProjectsPanelProps {
  projects: StudioProject[];
  selected: string | null;
  onSelect: (slug: string) => void;
}

export function ProjectsPanel({ projects, selected, onSelect }: ProjectsPanelProps) {
  return (
    <aside className="dvs-card dvs-cardTight">
      <div className="dvs-listHead">
        <span>Projects</span>
        <span>{projects.length}</span>
      </div>
      <div className="dvs-list">
        {projects.map((entry) => (
          <ProjectRow
            key={entry.slug}
            project={entry}
            active={entry.slug === selected}
            onSelect={onSelect}
          />
        ))}
      </div>
    </aside>
  );
}
