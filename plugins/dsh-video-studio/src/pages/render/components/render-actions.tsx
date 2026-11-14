interface RenderActionsProps {
  busy: boolean;
  running: boolean;
  onRender: () => void;
  onDraft: () => void;
  onStudio: () => void;
}

export function RenderActions({ busy, running, onRender, onDraft, onStudio }: RenderActionsProps) {
  return (
    <div className="dvs-actions">
      <button
        type="button"
        className="dvs-btn dvs-btn-primary"
        onClick={onRender}
        disabled={busy || running}
      >
        {running ? 'Merender…' : 'Render MP4'}
      </button>
      <button
        type="button"
        className="dvs-btn"
        onClick={onDraft}
        disabled={busy || running}
        title="Render 50% untuk review cepat"
      >
        Draft 50%
      </button>
      <button
        type="button"
        className="dvs-btn"
        onClick={onStudio}
        disabled={busy}
        title="Buka Remotion Studio untuk scrub timeline"
      >
        Studio
      </button>
    </div>
  );
}
