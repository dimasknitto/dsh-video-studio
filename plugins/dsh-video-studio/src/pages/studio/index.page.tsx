import { Provider } from 'react-redux';
import { PanelHeader } from '@/components/layout/panel-header';
import { ProjectDetail } from '@/pages/preview';
import { ProjectsPanel } from '@/pages/projects';
import { PromptCard } from '@/pages/prompt/components/prompt-card';
import { store } from '@/redux/store';
import { useStudioController } from './hooks/use-studio-controller';

export interface StudioPageProps {
  startSession?: (prompt: string) => void;
}

function StudioBody({ startSession }: StudioPageProps) {
  const studio = useStudioController(startSession);

  return (
    <div className="dvs-root">
      <div className="dvs-inner">
        <PanelHeader
          projectCount={studio.counts.projects}
          renderCount={studio.counts.renders}
          onRefresh={() => void studio.refresh()}
        />

        {studio.error ? <div className="dvs-banner">{studio.error}</div> : null}
        {studio.notice ? <div className="dvs-notice">{studio.notice}</div> : null}

        <PromptCard
          onSend={studio.sendPrompt}
          onCopy={(prompt) => void studio.copyPrompt(prompt)}
        />

        {studio.projects.length > 0 ? (
          <div className="dvs-main">
            <ProjectsPanel
              projects={studio.projects}
              selected={studio.selected}
              onSelect={studio.setSelected}
            />
            {studio.project ? (
              <ProjectDetail
                project={studio.project}
                job={studio.job}
                busy={studio.busy}
                running={studio.running === true}
                onRender={studio.onRender}
                onDraft={studio.onDraft}
                onStudio={studio.onStudio}
              />
            ) : (
              <div className="dvs-empty">Pilih project untuk melihat preview.</div>
            )}
          </div>
        ) : (
          <div className="dvs-empty">
            Belum ada project. Tulis prompt di atas untuk membuat video pertama.
          </div>
        )}
      </div>
    </div>
  );
}

export function StudioPage(props: StudioPageProps) {
  return (
    <Provider store={store}>
      <StudioBody startSession={props.startSession} />
    </Provider>
  );
}
