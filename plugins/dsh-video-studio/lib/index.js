/**
 * dsh-video-studio — host half.
 *
 * Registers the browser-facing routes behind the Video Studio panel:
 * project discovery, render jobs, Remotion Studio launch, and range-aware
 * media serving. The heavy lifting stays in `video-studio/bin/video.mjs`;
 * this file only orchestrates it for the GUI.
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const name = 'video-studio';
export const inject = ['webServer'];

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PREFIX = '/video-studio';
const MAX_LOG = 200_000;
const MAX_JOBS = 20;

/** Find the engine without hardcoding a machine-specific path. */
function resolveStudioDir(config) {
  const candidates = [];
  if (config.studioDir) candidates.push(path.resolve(config.studioDir));
  if (process.env.DSH_VIDEO_STUDIO_DIR) {
    candidates.push(path.resolve(process.env.DSH_VIDEO_STUDIO_DIR));
  }
  // Repo layout: <repo>/plugins/dsh-video-studio/lib -> <repo>/video-studio
  candidates.push(path.resolve(HERE, '..', '..', '..', 'video-studio'));
  // Packaged layout: <plugin>/engine
  candidates.push(path.resolve(HERE, '..', '..', 'engine'));
  candidates.push(path.join(process.cwd(), 'video-studio'));
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'bin', 'video.mjs'))) return candidate;
  }
  return candidates[0] ?? path.join(process.cwd(), 'video-studio');
}

/** Prefer PATH node, then the Node that ships with DSH, then Electron-as-Node. */
function resolveNode(config) {
  if (config.nodePath) return {bin: path.resolve(config.nodePath), env: {}};
  if (process.env.DSH_VIDEO_STUDIO_NODE) {
    return {bin: process.env.DSH_VIDEO_STUDIO_NODE, env: {}};
  }
  try {
    execFileSync('node', ['--version'], {stdio: 'ignore', windowsHide: true});
    return {bin: 'node', env: {}};
  } catch {
    // fall through to the launcher's own runtime
  }
  if (process.versions.electron) {
    const bundled = path.join(
      path.dirname(process.execPath),
      'resources',
      'runtime',
      'bin',
      process.platform === 'win32' ? 'node.exe' : 'node',
    );
    if (fs.existsSync(bundled)) return {bin: bundled, env: {}};
    return {bin: process.execPath, env: {ELECTRON_RUN_AS_NODE: '1'}};
  }
  return {bin: 'node', env: {}};
}

const MIME = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
};

const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov']);

function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error('request body too large');
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function isLoopback(req) {
  const address = req.socket.remoteAddress ?? '';
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

function safeSlug(value) {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value);
}

function sceneLabel(scene) {
  if (!scene || typeof scene !== 'object') return '';
  switch (scene.type) {
    case 'title':
      return scene.text ?? '';
    case 'bullets':
      return scene.heading ?? `${(scene.items ?? []).length} poin`;
    case 'stat':
      return `${scene.value ?? ''} ${scene.label ?? ''}`.trim();
    case 'quote':
      return scene.text ?? '';
    case 'image':
    case 'video':
      return scene.src ?? '';
    case 'code':
      return scene.filename ?? 'code';
    case 'terminal':
      return `${(scene.lines ?? []).length} baris terminal`;
    case 'chat':
      return `${(scene.messages ?? []).length} pesan`;
    case 'split':
      return scene.heading ?? '';
    case 'bars':
      return scene.heading ?? `${(scene.items ?? []).length} bar`;
    case 'outro':
      return scene.text ?? '';
    default:
      return scene.type ?? '';
  }
}

function specSummary(spec) {
  const fps = Number(spec?.meta?.fps) || 30;
  const scenes = Array.isArray(spec?.scenes) ? spec.scenes : [];
  const timeline = [];
  let frames = 0;
  for (const scene of scenes) {
    const length =
      Number.isFinite(scene?.duration) && scene.duration > 0
        ? Math.round(scene.duration)
        : Math.max(1, Math.round((Number(scene?.seconds) || 3) * fps));
    timeline.push({
      type: scene?.type ?? 'unknown',
      seconds: length / fps,
      label: String(sceneLabel(scene)).slice(0, 80),
    });
    frames += length;
  }
  return {
    title: spec?.meta?.title ?? null,
    width: Number(spec?.meta?.width) || 1080,
    height: Number(spec?.meta?.height) || 1920,
    fps,
    theme: spec?.theme?.preset ?? 'midnight',
    sceneCount: scenes.length,
    seconds: frames / fps,
    timeline,
  };
}

export function apply(ctx, config = {}) {
  const studioDir = resolveStudioDir(config);
  const projectsDir = path.join(studioDir, 'projects');
  const cliPath = path.join(studioDir, 'bin', 'video.mjs');
  const node = resolveNode(config);
  const nodeBin = node.bin;
  const studioPort = Number(config.studioPort) || 3211;

  /** @type {Map<string, any>} */
  const jobs = new Map();
  let studioChild = null;
  let studioSlug = null;
  let studioUrl = null;

  function childEnv() {
    const tmp = path.join(studioDir, '.tmp');
    try {
      fs.mkdirSync(tmp, {recursive: true});
    } catch {
      // The render itself will report a real failure later.
    }
    return {...process.env, ...node.env, TMP: tmp, TEMP: tmp, TMPDIR: tmp};
  }

  function appendLog(job, chunk) {
    job.log += chunk.toString('utf8');
    if (job.log.length > MAX_LOG) job.log = job.log.slice(-MAX_LOG);
  }

  function listProjectDirs() {
    if (!fs.existsSync(projectsDir)) return [];
    return fs
      .readdirSync(projectsDir, {withFileTypes: true})
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((slug) => fs.existsSync(path.join(projectsDir, slug, 'video.json')));
  }

  function readProject(slug) {
    const dir = path.join(projectsDir, slug);
    const specPath = path.join(dir, 'video.json');
    if (!fs.existsSync(specPath)) throw new Error(`project "${slug}" tidak ditemukan`);
    let spec;
    try {
      spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    } catch (error) {
      throw new Error(`video.json tidak valid: ${error.message}`);
    }
    const outDir = path.join(dir, 'out');
    const outputs = [];
    if (fs.existsSync(outDir)) {
      for (const entry of fs.readdirSync(outDir, {withFileTypes: true})) {
        if (!entry.isFile()) continue;
        const ext = path.extname(entry.name).toLowerCase();
        if (!MIME[ext]) continue;
        const stat = fs.statSync(path.join(outDir, entry.name));
        outputs.push({
          name: entry.name,
          size: stat.size,
          mtime: Math.round(stat.mtimeMs),
          kind: VIDEO_EXT.has(ext) ? 'video' : 'image',
          url: `${PREFIX}/media/${encodeURIComponent(slug)}/${encodeURIComponent(entry.name)}`,
        });
      }
    }
    outputs.sort((a, b) => (a.kind === b.kind ? b.mtime - a.mtime : a.kind === 'video' ? -1 : 1));

    const coverCandidate = path.join(outDir, 'cover.png');
    const thumbCandidate = path.join(outDir, 'thumbs', 'thumb-01.png');
    let cover = null;
    if (fs.existsSync(coverCandidate)) {
      cover = `${PREFIX}/media/${encodeURIComponent(slug)}/cover.png`;
    } else if (fs.existsSync(thumbCandidate)) {
      cover = `${PREFIX}/media/${encodeURIComponent(slug)}/thumbs/thumb-01.png`;
    }

    const summary = specSummary(spec);
    const specMtime = fs.statSync(specPath).mtimeMs;
    const latestOutput = outputs.length > 0 ? outputs[0].mtime : 0;
    return {
      slug,
      dir,
      ...summary,
      updatedAt: Math.round(Math.max(specMtime, latestOutput)),
      outputs,
      cover,
      specUrl: `${PREFIX}/api/spec/${encodeURIComponent(slug)}`,
      latestVideo: outputs.find((output) => output.kind === 'video') ?? null,
    };
  }

  function publicState() {
    const errors = [];
    let projects = [];
    if (!fs.existsSync(cliPath)) {
      errors.push(`Studio tidak ditemukan di ${studioDir}. Set studioDir di konfigurasi plugin.`);
    } else if (!fs.existsSync(projectsDir)) {
      errors.push(`Folder projects belum ada di ${studioDir}.`);
    } else {
      for (const slug of listProjectDirs()) {
        try {
          projects.push(readProject(slug));
        } catch (error) {
          errors.push(`${slug}: ${error.message}`);
        }
      }
    }
    projects.sort((a, b) => b.updatedAt - a.updatedAt);
    const jobList = [...jobs.values()]
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, MAX_JOBS)
      .map((job) => ({
        id: job.id,
        slug: job.slug,
        kind: job.kind,
        status: job.status,
        startedAt: job.startedAt,
        endedAt: job.endedAt ?? null,
        exitCode: job.exitCode ?? null,
        out: job.out ?? null,
        log: job.log.length > 20_000 ? job.log.slice(-20_000) : job.log,
      }));
    return {
      studioDir,
      projects,
      jobs: jobList,
      studio: {running: Boolean(studioUrl), slug: studioSlug, url: studioUrl},
      error: errors.length > 0 ? errors.join(' ') : null,
    };
  }

  function startRender(slug, options = {}) {
    const running = [...jobs.values()].find((job) => job.slug === slug && job.status === 'running');
    if (running) return {busy: true, id: running.id};
    const project = readProject(slug);
    const draft = Boolean(options.draft);
    const scale = options.scale ?? (draft ? 0.5 : null);
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const args = [cliPath, 'render', `projects/${slug}`];
    if (scale) args.push(`--scale=${scale}`);
    if (draft) args.push(`--out=${path.join(project.dir, 'out', `${slug}-draft.mp4`)}`);

    const job = {
      id,
      slug,
      kind: draft ? 'draft' : 'render',
      status: 'running',
      startedAt: Date.now(),
      endedAt: null,
      exitCode: null,
      out: draft ? path.join(project.dir, 'out', `${slug}-draft.mp4`) : null,
      log: `$ node bin/video.mjs ${args.slice(1).join(' ')}\n`,
      child: null,
    };
    const child = spawn(nodeBin, args, {
      cwd: studioDir,
      env: childEnv(),
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    job.child = child;
    child.stdout.on('data', (chunk) => appendLog(job, chunk));
    child.stderr.on('data', (chunk) => appendLog(job, chunk));
    child.on('error', (error) => {
      job.status = 'error';
      job.endedAt = Date.now();
      appendLog(job, `\nspawn gagal: ${error.message}\n`);
    });
    child.on('close', (code) => {
      job.exitCode = code;
      job.status = code === 0 ? 'done' : 'error';
      job.endedAt = Date.now();
      if (code === 0 && !job.out) {
        try {
          const fresh = readProject(slug);
          job.out = fresh.latestVideo?.name ?? null;
        } catch {
          job.out = null;
        }
      } else if (job.out) {
        job.out = path.basename(job.out);
      }
      job.child = null;
    });
    jobs.set(id, job);
    while (jobs.size > MAX_JOBS) {
      const oldest = [...jobs.values()].sort((a, b) => a.startedAt - b.startedAt)[0];
      if (!oldest || oldest.status === 'running') break;
      jobs.delete(oldest.id);
    }
    return {id, draft};
  }

  async function waitForHttp(url, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        const response = await fetch(url, {signal: AbortSignal.timeout(1200)});
        if (response.ok) return true;
      } catch {
        // not up yet
      }
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    return false;
  }

  async function openStudio(slug) {
    readProject(slug);
    if (studioChild && studioChild.exitCode === null) {
      return {url: studioUrl, slug: studioSlug, starting: !studioUrl};
    }
    const url = `http://127.0.0.1:${studioPort}`;
    const child = spawn(
      nodeBin,
      [cliPath, 'preview', `projects/${slug}`, '--port', String(studioPort)],
      {
        cwd: studioDir,
        env: childEnv(),
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      },
    );
    studioChild = child;
    studioSlug = slug;
    studioUrl = url;
    child.stdout.on('data', () => {});
    child.stderr.on('data', () => {});
    child.on('exit', () => {
      if (studioChild === child) {
        studioChild = null;
        studioSlug = null;
        studioUrl = null;
      }
    });
    const ready = await waitForHttp(url, 25_000);
    return {url, slug, starting: !ready};
  }

  function serveMedia(req, res, slug, restPath) {
    if (!safeSlug(slug)) return json(res, 400, {error: 'slug tidak valid'});
    const outDir = path.join(projectsDir, slug, 'out');
    const target = path.resolve(outDir, restPath);
    if (!target.startsWith(path.resolve(outDir) + path.sep)) {
      return json(res, 403, {error: 'path di luar folder out'});
    }
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      return json(res, 404, {error: 'file tidak ditemukan'});
    }
    const ext = path.extname(target).toLowerCase();
    const type = MIME[ext] ?? 'application/octet-stream';
    const stat = fs.statSync(target);
    const range = req.headers.range;
    if (!range) {
      res.writeHead(200, {
        'content-type': type,
        'content-length': stat.size,
        'accept-ranges': 'bytes',
        'cache-control': 'no-cache',
      });
      fs.createReadStream(target).pipe(res);
      return;
    }
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (!match) {
      res.writeHead(416, {'content-range': `bytes */${stat.size}`});
      res.end();
      return;
    }
    const start = match[1] === '' ? Math.max(0, stat.size - Number(match[2])) : Number(match[1]);
    const end = match[1] === '' || match[2] === '' ? stat.size - 1 : Math.min(Number(match[2]), stat.size - 1);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
      res.writeHead(416, {'content-range': `bytes */${stat.size}`});
      res.end();
      return;
    }
    res.writeHead(206, {
      'content-type': type,
      'content-length': end - start + 1,
      'content-range': `bytes ${start}-${end}/${stat.size}`,
      'accept-ranges': 'bytes',
      'cache-control': 'no-cache',
    });
    fs.createReadStream(target, {start, end}).pipe(res);
  }

  async function route(req, res) {
    if (!isLoopback(req)) {
      return json(res, 403, {error: 'loopback only'});
    }
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    const pathname = url.pathname;
    if (!pathname.startsWith(PREFIX)) return json(res, 404, {error: 'not found'});
    const rest = pathname.slice(PREFIX.length);

    if (req.method === 'GET' && rest === '/api/state') {
      return json(res, 200, publicState());
    }

    if (req.method === 'GET' && rest === '/api/jobs') {
      return json(res, 200, {jobs: publicState().jobs});
    }

    if (req.method === 'GET' && rest.startsWith('/api/spec/')) {
      const slug = decodeURIComponent(rest.slice('/api/spec/'.length));
      if (!safeSlug(slug)) return json(res, 400, {error: 'slug tidak valid'});
      const file = path.join(projectsDir, slug, 'video.json');
      if (!fs.existsSync(file)) return json(res, 404, {error: 'project tidak ditemukan'});
      res.writeHead(200, {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'});
      res.end(fs.readFileSync(file));
      return;
    }

    if (rest.startsWith('/media/')) {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return json(res, 405, {error: 'method not allowed'});
      }
      const parts = rest.slice('/media/'.length).split('/');
      const slug = decodeURIComponent(parts[0] ?? '');
      const filePath = parts.slice(1).map(decodeURIComponent).join('/');
      return serveMedia(req, res, slug, filePath);
    }

    if (req.method === 'POST') {
      if (req.headers['x-video-studio'] !== '1') {
        return json(res, 403, {error: 'missing x-video-studio header'});
      }
      if (rest === '/api/render') {
        const body = await readJsonBody(req);
        const slug = String(body.slug ?? '');
        if (!safeSlug(slug)) return json(res, 400, {error: 'slug tidak valid'});
        try {
          const result = startRender(slug, {draft: Boolean(body.draft), scale: body.scale});
          if (result.busy) return json(res, 409, {error: 'render sudah berjalan', id: result.id});
          return json(res, 202, result);
        } catch (error) {
          return json(res, 400, {error: error.message});
        }
      }
      if (rest === '/api/studio') {
        const body = await readJsonBody(req);
        const slug = String(body.slug ?? '');
        if (!safeSlug(slug)) return json(res, 400, {error: 'slug tidak valid'});
        try {
          const result = await openStudio(slug);
          return json(res, 200, result);
        } catch (error) {
          return json(res, 400, {error: error.message});
        }
      }
      return json(res, 404, {error: 'not found'});
    }

    return json(res, 404, {error: 'not found'});
  }

  ctx.effect(() => {
    const dispose = ctx.webServer.register({
      kind: 'prefix',
      path: PREFIX,
      handler: (req, res) => {
        route(req, res).catch((error) => {
          ctx.logger?.warn?.('video-studio route failed: %s', error?.message ?? error);
          if (!res.headersSent) json(res, 500, {error: error?.message ?? String(error)});
          else res.end();
        });
      },
    });
    return () => {
      dispose();
      for (const job of jobs.values()) {
        if (job.status === 'running' && job.child) job.child.kill();
      }
      if (studioChild) {
        studioChild.kill();
        studioChild = null;
      }
    };
  }, 'video-studio: http routes');
}
