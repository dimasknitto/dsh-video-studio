interface PanelHeaderProps {
  projectCount: number;
  renderCount: number;
  onRefresh: () => void;
}

export function PanelHeader({ projectCount, renderCount, onRefresh }: PanelHeaderProps) {
  return (
    <header className="dvs-head">
      <div>
        <h1 className="dvs-title">Video Studio</h1>
        <p className="dvs-sub">
          Prompt jadi video, preview, render, dan edit footage — {projectCount} project,{' '}
          {renderCount} file video.
        </p>
      </div>
      <button
        type="button"
        className="dvs-btn"
        onClick={onRefresh}
        title="Muat ulang daftar project"
      >
        Refresh
      </button>
    </header>
  );
}
