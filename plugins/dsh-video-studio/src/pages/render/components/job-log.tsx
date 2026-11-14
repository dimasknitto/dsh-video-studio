import type { StudioJob } from '@/types';

interface JobLogProps {
  job: StudioJob;
}

const STATUS_LABEL: Record<StudioJob['status'], string> = {
  running: 'Render berjalan',
  done: 'Render selesai',
  error: 'Render gagal',
};

export function JobLog({ job }: JobLogProps) {
  return (
    <div className="dvs-job">
      <div className="dvs-jobHead">
        <span className="dvs-dot" data-status={job.status} />
        {STATUS_LABEL[job.status]}
        <span className="dvs-dim">· {job.kind === 'draft' ? 'draft 50%' : 'render penuh'}</span>
      </div>
      <pre className="dvs-log">{job.log || '…'}</pre>
    </div>
  );
}
