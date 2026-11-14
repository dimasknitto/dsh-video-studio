import { useCallback, useEffect, useMemo, useState } from 'react';
import { POLL_INTERVAL_MS } from '@/lib/constants';
import {
  useGetStateQuery,
  useOpenStudioMutation,
  useStartRenderMutation,
} from '@/redux/api/studio';
import type { StudioJob, StudioProject } from '@/types';

/**
 * Semua logic data panel ada di sini; komponen halaman hanya merender.
 * State diambil ulang tiap 3 detik supaya progres render terlihat tanpa reload.
 */
export function useStudioController(startSession?: (prompt: string) => void) {
  const { data, error, isFetching, refetch } = useGetStateQuery(undefined, {
    pollingInterval: POLL_INTERVAL_MS,
  });
  const [startRender, renderResult] = useStartRenderMutation();
  const [openStudio, studioResult] = useOpenStudioMutation();

  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const projects = useMemo<StudioProject[]>(() => data?.projects ?? [], [data]);
  const jobs = useMemo<StudioJob[]>(() => data?.jobs ?? [], [data]);

  useEffect(() => {
    if (projects.length === 0) {
      setSelected(null);
      return;
    }
    const exists = selected !== null && projects.some((entry) => entry.slug === selected);
    if (!exists) setSelected(projects[0]?.slug ?? null);
  }, [projects, selected]);

  const project = useMemo(
    () => (selected === null ? null : (projects.find((entry) => entry.slug === selected) ?? null)),
    [projects, selected],
  );

  const job = useMemo(
    () => (selected === null ? null : (jobs.find((entry) => entry.slug === selected) ?? null)),
    [jobs, selected],
  );

  const running = job?.status === 'running';
  const busy = renderResult.isLoading || studioResult.isLoading;

  const queryError =
    error === undefined
      ? null
      : 'Tidak bisa membaca studio: ' +
        ('message' in error ? String(error.message) : 'permintaan gagal');

  const counts = useMemo(
    () => ({
      projects: projects.length,
      renders: projects.reduce(
        (sum, entry) => sum + entry.outputs.filter((output) => output.kind === 'video').length,
        0,
      ),
    }),
    [projects],
  );

  const runRender = useCallback(
    async (draft: boolean) => {
      if (!project) return;
      setNotice(null);
      try {
        await startRender({ slug: project.slug, draft }).unwrap();
        setNotice(draft ? 'Draft 50% dimulai.' : 'Render dimulai. Log muncul di bawah.');
      } catch (caught) {
        setNotice(readErrorMessage(caught));
      }
    },
    [project, startRender],
  );

  const runStudio = useCallback(async () => {
    if (!project) return;
    setNotice(null);
    try {
      const result = await openStudio({ slug: project.slug }).unwrap();
      if (result.url) window.open(result.url, '_blank', 'noopener');
      setNotice(
        result.starting ? `Studio sedang start: ${result.url}` : `Studio dibuka: ${result.url}`,
      );
    } catch (caught) {
      setNotice(readErrorMessage(caught));
    }
  }, [openStudio, project]);

  const copyPrompt = useCallback(async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setNotice('Prompt disalin ke clipboard.');
    } catch {
      setNotice(`Clipboard tidak tersedia. Prompt: ${prompt.slice(0, 120)}…`);
    }
  }, []);

  const sendPrompt = useCallback(
    (prompt: string) => {
      if (typeof startSession === 'function') {
        startSession(prompt);
        setNotice('Prompt dibuka di sesi baru — tekan kirim untuk mulai.');
        return;
      }
      void copyPrompt(prompt);
    },
    [copyPrompt, startSession],
  );

  return {
    projects,
    project,
    job,
    counts,
    selected,
    setSelected,
    notice,
    error: queryError ?? data?.error ?? null,
    busy,
    running,
    isFetching,
    refresh: refetch,
    onRender: () => void runRender(false),
    onDraft: () => void runRender(true),
    onStudio: () => void runStudio(),
    copyPrompt,
    sendPrompt,
  };
}

function readErrorMessage(caught: unknown): string {
  if (typeof caught === 'object' && caught !== null && 'data' in caught) {
    const data = (caught as { data?: { error?: string } }).data;
    if (data?.error) return data.error;
  }
  if (caught instanceof Error) return caught.message;
  return String(caught);
}
