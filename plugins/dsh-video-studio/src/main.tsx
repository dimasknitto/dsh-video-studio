import type { ComponentType } from 'react';
import { Icon } from '@/components/ui/icon';
import { StudioPage } from '@/pages/studio';
import css from './styles.css?inline';

export const inject = ['slots', 'uiWorkspace'];

const PANEL_ID = 'video-studio';
const STYLE_ID = 'dsh-video-studio-css';

type SlotComponent = ComponentType<{
  size?: number;
  startSession?: (prompt: string) => void;
}>;

interface SlotMeta {
  name: string;
  key?: string;
  id?: string;
  order?: number;
  label?: string;
  inject?: () => { startSession: (prompt: string) => void };
}

interface SlotsApi {
  inject: (name: string, factory: () => unknown) => void;
  register: (meta: SlotMeta, component: SlotComponent) => unknown;
}

interface WorkspaceApi {
  startSession: (
    target: undefined,
    options: { prompt: string; whenDraftExists: 'append' },
  ) => unknown;
}

export interface PluginContext {
  slots: SlotsApi;
  uiWorkspace?: WorkspaceApi;
  logger?: { warn?: (message: string) => void };
}

function injectStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.dataset.plugin = PANEL_ID;
  style.textContent = css;
  document.head.append(style);
}

export function apply(ctx: PluginContext): void {
  injectStyles();

  ctx.slots.inject('main', () =>
    ctx.slots.register(
      {
        name: 'main',
        key: PANEL_ID,
        inject: () => ({
          startSession: (prompt: string) =>
            ctx.uiWorkspace?.startSession(undefined, {
              prompt,
              whenDraftExists: 'append',
            }),
        }),
      },
      StudioPage,
    ),
  );

  ctx.slots.inject('sidebar.panellist', () =>
    ctx.slots.register(
      {
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 20,
        label: 'Video Studio',
      },
      Icon,
    ),
  );
}
