import { formatDuration } from '@/lib/format';
import type { StudioTimelineScene } from '@/types';

interface SceneTimelineProps {
  timeline: StudioTimelineScene[];
}

export function SceneTimeline({ timeline }: SceneTimelineProps) {
  return (
    <div className="dvs-timeline">
      {timeline.map((scene, index) => (
        <span
          key={`${index}-${scene.type}`}
          className="dvs-scene"
          title={`${scene.type} · ${formatDuration(scene.seconds)} · ${scene.label}`}
        >
          {index + 1}. {scene.type}
        </span>
      ))}
    </div>
  );
}
