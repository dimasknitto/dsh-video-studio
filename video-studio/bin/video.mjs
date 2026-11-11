#!/usr/bin/env node
/**
 * video.mjs — the command line behind the DSH video studio.
 *
 * Design rules:
 *  - The spec JSON is the only source of truth; every command edits that file.
 *  - Commands print paths a human (or an agent) can act on, never silent.
 *  - No dependencies beyond Node + the local Remotion install, and child
 *    processes inherit stdio so they work inside the harness sandbox.
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawn, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const ENTRY = path.join(ROOT, 'src', 'index.ts');
const REMOTION_CLI = path.join(ROOT, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');

const tty = process.stdout.isTTY;
const paint = (code) => (text) => (tty ? `\u001b[${code}m${text}\u001b[0m` : text);
const bold = paint('1');
const dim = paint('2');
const red = paint('31');
const green = paint('32');
const yellow = paint('33');
const cyan = paint('36');
const magenta = paint('35');

const SCENE_TYPES = [
  'title', 'bullets', 'stat', 'quote', 'image', 'video', 'code',
  'terminal', 'chat', 'split', 'bars', 'outro', 'blank',
];

const BASE_KEYS = ['id', 'type', 'seconds', 'duration', 'caption', 'bg'];

const SCENE_RULES = {
  title: {required: ['text'], keys: ['kicker', 'text', 'subtitle', 'align', 'gradient']},
  bullets: {required: ['items'], keys: ['kicker', 'heading', 'items', 'numbered']},
  stat: {required: ['value', 'label'], keys: ['kicker', 'value', 'label', 'note']},
  quote: {required: ['text'], keys: ['text', 'author', 'role']},
  image: {required: ['src'], keys: ['src', 'fit', 'kenBurns', 'overlay', 'inset', 'heading', 'body']},
  video: {
    required: ['src'],
    keys: ['src', 'trimStart', 'trimEnd', 'muted', 'volume', 'playbackRate', 'fit', 'inset', 'rounded'],
  },
  code: {required: ['code'], keys: ['filename', 'language', 'code', 'highlight']},
  terminal: {required: ['lines'], keys: ['title', 'lines']},
  chat: {required: ['messages'], keys: ['title', 'messages']},
  split: {required: ['heading'], keys: ['image', 'heading', 'body', 'kicker', 'side', 'fit']},
  bars: {required: ['items'], keys: ['heading', 'items', 'unit', 'max']},
  outro: {required: ['text'], keys: ['text', 'cta', 'handle', 'subtitle']},
  blank: {required: [], keys: ['color']},
};

const THEME_PRESETS = ['midnight', 'sunset', 'neon', 'paper', 'mono'];

// ---------------------------------------------------------------------------
// small utilities
// ---------------------------------------------------------------------------

function fail(message) {
  console.error(`${red('error')} ${message}`);
  process.exit(1);
}

function note(message) {
  console.log(`${dim('·')} ${message}`);
}

function done(message) {
  console.log(`${green('✓')} ${message}`);
}

function readJson(file) {
  let raw = fs.readFileSync(file, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  return JSON.parse(raw);
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, file);
}

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const eq = token.indexOf('=');
      if (eq > 0) {
        flags[token.slice(2, eq)] = token.slice(eq + 1);
      } else {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith('--')) {
          flags[token.slice(2)] = next;
          i++;
        } else {
          flags[token.slice(2)] = true;
        }
      }
    } else {
      positional.push(token);
    }
  }
  return {flags, positional};
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'video';
}

function fmtSeconds(seconds) {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  return m > 0 ? `${m}m ${rest.toFixed(1)}s` : `${rest.toFixed(1)}s`;
}

// ---------------------------------------------------------------------------
// project + validation
// ---------------------------------------------------------------------------

function resolveProject(input) {
  const abs = path.resolve(input ?? '.');
  if (abs.toLowerCase().endsWith('.json')) {
    return {specPath: abs, dir: path.dirname(abs)};
  }
  return {specPath: path.join(abs, 'video.json'), dir: abs};
}

function loadProject(input) {
  const project = resolveProject(input);
  if (!fs.existsSync(project.specPath)) {
    fail(`no video.json found at ${project.specPath}. Run \`video new <dir>\` first.`);
  }
  let spec;
  try {
    spec = readJson(project.specPath);
  } catch (error) {
    fail(`invalid JSON in ${project.specPath}: ${error.message}`);
  }
  return {...project, spec};
}

function isObj(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function unknownKeys(obj, allowed) {
  return Object.keys(obj).filter((key) => !allowed.includes(key));
}

function validateSpec(spec, dir) {
  const errors = [];
  const warnings = [];
  const add = (message) => errors.push(message);
  const warn = (message) => warnings.push(message);

  if (!isObj(spec)) {
    add('video.json must contain a JSON object');
    return {errors, warnings};
  }

  const topKeys = ['$schema', 'meta', 'theme', 'transition', 'progressBar', 'grid', 'brand', 'audio', 'subtitles', 'scenes'];
  for (const key of unknownKeys(spec, topKeys)) warn(`unknown top-level key "${key}"`);

  const meta = isObj(spec.meta) ? spec.meta : {};
  for (const key of unknownKeys(meta, ['title', 'width', 'height', 'fps'])) {
    warn(`unknown meta key "${key}"`);
  }
  const width = meta.width ?? 1080;
  const height = meta.height ?? 1920;
  const fps = meta.fps ?? 30;
  if (!Number.isFinite(width) || width < 16 || width > 4096) add('meta.width must be between 16 and 4096');
  if (!Number.isFinite(height) || height < 16 || height > 4096) add('meta.height must be between 16 and 4096');
  if (!Number.isFinite(fps) || fps < 1 || fps > 120) add('meta.fps must be between 1 and 120');

  if (isObj(spec.theme)) {
    for (const key of unknownKeys(spec.theme, ['preset', 'bg', 'fg', 'muted', 'accent', 'accent2', 'font', 'mono', 'radius'])) {
      warn(`unknown theme key "${key}"`);
    }
    if (spec.theme.preset && !THEME_PRESETS.includes(spec.theme.preset)) {
      add(`theme.preset "${spec.theme.preset}" is not one of ${THEME_PRESETS.join(', ')}`);
    }
  }

  if (spec.transition && spec.transition.type && !['fade', 'none'].includes(spec.transition.type)) {
    add('transition.type must be "fade" or "none"');
  }

  if (!Array.isArray(spec.scenes) || spec.scenes.length === 0) {
    add('scenes must be a non-empty array');
    return {errors, warnings};
  }

  const ids = new Set();
  let totalSeconds = 0;

  spec.scenes.forEach((scene, index) => {
    const at = `scenes[${index}]`;
    if (!isObj(scene)) {
      add(`${at} must be an object`);
      return;
    }
    if (!SCENE_TYPES.includes(scene.type)) {
      add(`${at}.type "${scene.type}" is not one of ${SCENE_TYPES.join(', ')}`);
      return;
    }
    const rule = SCENE_RULES[scene.type];
    const allowed = [...BASE_KEYS, ...rule.keys];
    for (const key of unknownKeys(scene, allowed)) {
      warn(`${at} (${scene.type}) has unknown key "${key}" — it will be ignored`);
    }
    for (const key of rule.required) {
      const value = scene[key];
      const empty =
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0);
      if (empty) add(`${at} (${scene.type}) requires "${key}"`);
    }
    if (scene.id !== undefined) {
      if (typeof scene.id !== 'string') add(`${at}.id must be a string`);
      else if (ids.has(scene.id)) warn(`${at}.id "${scene.id}" is duplicated`);
      else ids.add(scene.id);
    }
    const seconds = typeof scene.duration === 'number' ? scene.duration / fps : scene.seconds ?? 3;
    if (!Number.isFinite(seconds) || seconds <= 0) add(`${at} needs a positive seconds/duration`);
    if (seconds > 120) warn(`${at} is ${seconds.toFixed(1)}s long — that is unusual for one scene`);
    totalSeconds += Number.isFinite(seconds) ? seconds : 0;

    if (scene.type === 'bullets' || scene.type === 'bars') {
      const items = scene.items;
      if (Array.isArray(items)) {
        items.forEach((item, itemIndex) => {
          if (typeof item === 'string') {
            if (scene.type === 'bars') add(`${at}.items[${itemIndex}] for bars must be {label, value}`);
          } else if (!isObj(item)) {
            add(`${at}.items[${itemIndex}] must be a string or object`);
          } else if (scene.type === 'bullets' && typeof item.text !== 'string') {
            add(`${at}.items[${itemIndex}].text is required`);
          } else if (scene.type === 'bars') {
            if (typeof item.label !== 'string') add(`${at}.items[${itemIndex}].label is required`);
            if (!Number.isFinite(item.value)) add(`${at}.items[${itemIndex}].value must be a number`);
          }
        });
      }
    }
    if (scene.type === 'terminal' && Array.isArray(scene.lines)) {
      scene.lines.forEach((line, lineIndex) => {
        if (!isObj(line) || typeof line.text !== 'string') {
          add(`${at}.lines[${lineIndex}] must be {text, type?}`);
        }
      });
    }
    if (scene.type === 'chat' && Array.isArray(scene.messages)) {
      scene.messages.forEach((message, messageIndex) => {
        if (!isObj(message) || !['user', 'ai'].includes(message.role) || typeof message.text !== 'string') {
          add(`${at}.messages[${messageIndex}] must be {role:"user"|"ai", text}`);
        }
      });
    }
    if (scene.type === 'code' && Array.isArray(scene.highlight)) {
      const lineCount = String(scene.code ?? '').split('\n').length;
      scene.highlight.forEach((line) => {
        if (!Number.isInteger(line) || line < 1 || line > lineCount) {
          warn(`${at}.highlight line ${line} is outside 1..${lineCount}`);
        }
      });
    }

    // Local media must exist; remote URLs are left to the renderer.
    const media = [];
    if (scene.type === 'image' || scene.type === 'video') media.push(['src', scene.src]);
    if (scene.type === 'split' && scene.image) media.push(['image', scene.image]);
    for (const [field, src] of media) {
      if (typeof src !== 'string' || src.length === 0) continue;
      if (/^(https?:|data:|blob:)/i.test(src)) continue;
      const resolved = path.resolve(dir, src);
      if (!fs.existsSync(resolved)) add(`${at}.${field} not found: ${src} (looked in ${path.dirname(resolved)})`);
    }
  });

  if (Array.isArray(spec.audio)) {
    spec.audio.forEach((track, index) => {
      if (!isObj(track) || typeof track.src !== 'string') {
        add(`audio[${index}] must be {src, volume?}`);
        return;
      }
      if (!/^(https?:|data:)/i.test(track.src) && !fs.existsSync(path.resolve(dir, track.src))) {
        add(`audio[${index}].src not found: ${track.src}`);
      }
    });
  } else if (spec.audio !== undefined) {
    add('audio must be an array');
  }

  if (Array.isArray(spec.subtitles)) {
    spec.subtitles.forEach((entry, index) => {
      if (!isObj(entry) || typeof entry.text !== 'string') add(`subtitles[${index}] must be {text, from, to}`);
      else if (!(entry.from < entry.to)) add(`subtitles[${index}] needs from < to`);
      else if (entry.to > totalSeconds + 0.01) {
        warn(`subtitles[${index}] ends at ${entry.to}s but the video is ${totalSeconds.toFixed(1)}s`);
      }
    });
  } else if (spec.subtitles !== undefined) {
    add('subtitles must be an array');
  }

  if (totalSeconds <= 0) add('the video has no duration');
  return {errors, warnings, totalSeconds};
}

function describeScene(scene) {
  switch (scene.type) {
    case 'title':
      return scene.text;
    case 'bullets':
      return `${scene.heading ?? 'bullets'} · ${scene.items.length} item`;
    case 'stat':
      return `${scene.value} — ${scene.label}`;
    case 'quote':
      return scene.text;
    case 'image':
      return scene.src;
    case 'video':
      return scene.src;
    case 'code':
      return `${scene.filename ?? 'code'} · ${String(scene.code).split('\n').length} lines`;
    case 'terminal':
      return `${scene.lines.length} lines`;
    case 'chat':
      return `${scene.messages.length} messages`;
    case 'split':
      return scene.heading;
    case 'bars':
      return `${scene.items.length} bars`;
    case 'outro':
      return scene.text;
    case 'blank':
      return 'blank';
    default:
      return '';
  }
}

function printTimeline(spec, dir) {
  const fps = spec.meta?.fps ?? 30;
  const rows = [];
  let cursor = 0;
  spec.scenes.forEach((scene, index) => {
    const frames =
      typeof scene.duration === 'number'
        ? Math.max(1, Math.round(scene.duration))
        : Math.max(1, Math.round((scene.seconds ?? 3) * fps));
    const start = cursor / fps;
    const end = (cursor + frames) / fps;
    rows.push({
      n: index + 1,
      id: scene.id ?? scene.type,
      type: scene.type,
      start: start.toFixed(1),
      end: end.toFixed(1),
      secs: (frames / fps).toFixed(1),
      text: describeScene(scene).slice(0, 44),
    });
    cursor += frames;
  });

  const pad = (value, width) => String(value).padEnd(width);
  console.log(
    `${bold('  #')}  ${pad('id', 16)}${pad('type', 10)}${pad('start', 7)}${pad('end', 7)}${pad('secs', 7)}scene`,
  );
  for (const row of rows) {
    console.log(
      `  ${String(row.n).padStart(2)}  ${pad(row.id, 16)}${pad(row.type, 10)}${pad(row.start, 7)}${pad(row.end, 7)}${pad(row.secs, 7)}${dim(row.text)}`,
    );
  }
  const total = cursor / fps;
  console.log(
    `\n  ${bold(spec.meta?.title ?? path.basename(dir))} — ${fmtSeconds(total)} · ${cursor} frames · ${spec.meta?.width ?? 1080}×${spec.meta?.height ?? 1920} · ${fps}fps`,
  );
}

// ---------------------------------------------------------------------------
// rendering
// ---------------------------------------------------------------------------

function ensureRemotionInstalled() {
  if (!fs.existsSync(REMOTION_CLI)) {
    fail(`Remotion is not installed. Run:\n  cd "${ROOT}" && npm install`);
  }
}

function hasBrowser() {
  const dir = path.join(ROOT, 'node_modules', '.remotion');
  if (!fs.existsSync(dir)) return false;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, {withFileTypes: true})) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (/chrome-headless-shell(\.exe)?$/i.test(entry.name)) return true;
    }
  }
  return false;
}

function runNode(args, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [REMOTION_CLI, ...args], {
      cwd: ROOT,
      stdio: 'inherit',
      env: {...process.env, ...env},
    });
    child.on('exit', (code) => resolve(code ?? 1));
    child.on('error', (error) => {
      console.error(`${red('error')} failed to start Remotion: ${error.message}`);
      resolve(1);
    });
  });
}

async function ensureBrowser() {
  if (hasBrowser()) return;
  console.log(`${dim('downloading')} Chrome Headless Shell for Remotion (one time)…`);
  const code = await runNode(['browser', 'ensure']);
  if (code !== 0) fail('could not download the Remotion browser. Check your network and retry.');
}

function projectEnv(dir) {
  // Keep Remotion's intermediate frames inside the studio so sandboxed and
  // locked-down machines never have to write to the system temp directory.
  const tmp = path.join(ROOT, '.tmp');
  fs.mkdirSync(tmp, {recursive: true});
  return {VIDEO_PUBLIC_DIR: dir, TMP: tmp, TEMP: tmp, TMPDIR: tmp};
}

async function commandRender(flags, positional) {
  ensureRemotionInstalled();
  const project = loadProject(positional[0]);
  const {errors, warnings} = validateSpec(project.spec, project.dir);
  for (const warning of warnings) console.warn(`${yellow('warn')} ${warning}`);
  if (errors.length) {
    for (const error of errors) console.error(`${red('error')} ${error}`);
    fail(`${errors.length} problem(s) in video.json — fix them before rendering.`);
  }

  const spec = project.spec;
  const fps = spec.meta?.fps ?? 30;
  const frames = spec.scenes.reduce(
    (sum, scene) => sum + (scene.duration ?? Math.round((scene.seconds ?? 3) * fps)),
    0,
  );
  const outDir = path.join(project.dir, 'out');
  fs.mkdirSync(outDir, {recursive: true});
  const out = path.resolve(
    flags.out ?? path.join(outDir, `${path.basename(project.dir) || 'video'}.mp4`),
  );

  await ensureBrowser();

  const args = [
    'render',
    ENTRY,
    'Video',
    out,
    `--props=${project.specPath}`,
    '--codec=h264',
    '--overwrite',
  ];
  if (flags.scale) args.push(`--scale=${flags.scale}`);
  if (flags.crf) args.push(`--crf=${flags.crf}`);
  if (flags.concurrency) args.push(`--concurrency=${flags.concurrency}`);
  if (flags.frames) args.push(`--frames=${flags.frames}`);
  if (flags.silent) args.push('--log=error');

  console.log(`${magenta('render')} ${spec.meta?.title ?? path.basename(project.dir)}`);
  note(`${frames} frames · ${fmtSeconds(frames / fps)} · ${spec.meta?.width ?? 1080}×${spec.meta?.height ?? 1920}`);
  note(`out → ${out}`);

  const started = Date.now();
  const code = await runNode(args, projectEnv(project.dir));
  if (code !== 0) fail(`render failed with exit code ${code}`);

  const size = fs.existsSync(out) ? fs.statSync(out).size : 0;
  done(`rendered ${out} (${(size / 1024 / 1024).toFixed(1)} MB in ${((Date.now() - started) / 1000).toFixed(1)}s)`);
  recordRender(project, {out, frames, seconds: frames / fps, at: new Date().toISOString()});
}

function recordRender(project, entry) {
  const file = path.join(project.dir, 'renders.json');
  let history = [];
  try {
    if (fs.existsSync(file)) history = readJson(file);
  } catch {
    history = [];
  }
  if (!Array.isArray(history)) history = [];
  history.unshift(entry);
  writeJson(file, history.slice(0, 20));
}

async function commandStill(flags, positional) {
  ensureRemotionInstalled();
  const project = loadProject(positional[0]);
  const fps = project.spec.meta?.fps ?? 30;
  let frame = Number(flags.frame ?? 0);
  if (flags.at !== undefined) frame = Math.round(Number(flags.at) * fps);
  if (!Number.isFinite(frame) || frame < 0) fail('--frame must be a non-negative number');
  const outDir = path.join(project.dir, 'out');
  fs.mkdirSync(outDir, {recursive: true});
  const out = path.resolve(flags.out ?? path.join(outDir, `still-${frame}.png`));

  await ensureBrowser();
  const args = ['still', ENTRY, 'Video', out, `--frame=${frame}`, `--props=${project.specPath}`, '--overwrite'];
  if (flags.scale) args.push(`--scale=${flags.scale}`);
  const code = await runNode(args, projectEnv(project.dir));
  if (code !== 0) fail(`still failed with exit code ${code}`);
  done(`still ${out}`);
}

async function commandPreview(flags, positional) {
  ensureRemotionInstalled();
  const project = loadProject(positional[0]);
  const port = Number(flags.port ?? 3210);
  console.log(`${magenta('preview')} ${project.specPath}`);
  console.log(`${dim('studio')} http://localhost:${port}`);
  const args = ['studio', ENTRY, `--port=${port}`, `--props=${project.specPath}`];
  const code = await runNode(args, projectEnv(project.dir));
  process.exit(code);
}

async function commandThumbs(flags, positional) {
  ensureRemotionInstalled();
  const project = loadProject(positional[0]);
  const count = Math.max(1, Math.min(24, Number(flags.count ?? 6)));
  const fps = project.spec.meta?.fps ?? 30;
  const frames = project.spec.scenes.reduce(
    (sum, scene) => sum + (scene.duration ?? Math.round((scene.seconds ?? 3) * fps)),
    0,
  );
  const outDir = path.join(project.dir, 'out', 'thumbs');
  fs.mkdirSync(outDir, {recursive: true});
  await ensureBrowser();
  for (let index = 0; index < count; index++) {
    const frame = Math.min(frames - 1, Math.round(((index + 0.5) / count) * frames));
    const out = path.join(outDir, `thumb-${String(index + 1).padStart(2, '0')}.png`);
    const code = await runNode(
      ['still', ENTRY, 'Video', out, `--frame=${frame}`, `--props=${project.specPath}`, '--overwrite', '--scale=0.4'],
      projectEnv(project.dir),
    );
    if (code !== 0) fail(`thumbnail ${index + 1} failed`);
    console.log(`  ${dim('→')} ${out}`);
  }
  done(`${count} thumbnails in ${outDir}`);
}

// ---------------------------------------------------------------------------
// spec editing
// ---------------------------------------------------------------------------

function parseMaybeJson(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed === '') return '';
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function setByPath(target, dotted, value) {
  const parts = dotted.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  if (parts.length === 0) fail('empty path');
  let cursor = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (cursor[key] === undefined || cursor[key] === null || typeof cursor[key] !== 'object') {
      cursor[key] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    }
    cursor = cursor[key];
  }
  cursor[parts[parts.length - 1]] = value;
}

function commandSet(flags, positional) {
  const project = loadProject(positional[0]);
  const dotted = positional[1];
  if (!dotted) fail('usage: video set <project> <path> <json-value>');
  const raw = positional.slice(2).join(' ');
  if (raw === '') fail('missing value');
  setByPath(project.spec, dotted, parseMaybeJson(raw));
  writeJson(project.specPath, project.spec);
  done(`${dotted} updated in ${path.basename(project.specPath)}`);
}

function sceneSummaryLine(scene, index) {
  return `${String(index + 1).padStart(2)}  ${(scene.id ?? scene.type).padEnd(16)} ${scene.type.padEnd(9)} ${dim(
    describeScene(scene).slice(0, 50),
  )}`;
}

function commandScene(flags, positional) {
  const action = positional[0];
  const project = loadProject(positional[1]);
  const scenes = project.spec.scenes;
  if (!Array.isArray(scenes)) fail('video.json has no scenes array');

  if (!action || action === 'list') {
    scenes.forEach((scene, index) => console.log(`  ${sceneSummaryLine(scene, index)}`));
    console.log(`\n  ${scenes.length} scenes · ${fmtSeconds(
      scenes.reduce((sum, scene) => sum + (scene.duration ?? Math.round((scene.seconds ?? 3) * (project.spec.meta?.fps ?? 30))), 0) /
        (project.spec.meta?.fps ?? 30),
    )}`);
    return;
  }

  if (action === 'add') {
    let scene;
    if (flags.json) scene = parseMaybeJson(flags.json);
    else if (flags.file) scene = readJson(path.resolve(flags.file));
    else fail('scene add needs --json \'{"type":"title","text":"..."}\' or --file scene.json');
    if (!isObj(scene) || !scene.type) fail('scene must be an object with a "type"');
    if (!SCENE_TYPES.includes(scene.type)) fail(`unknown scene type "${scene.type}"`);
    const at = flags.after !== undefined ? Number(flags.after) : scenes.length;
    if (!Number.isInteger(at) || at < 0 || at > scenes.length) fail(`--after must be 0..${scenes.length}`);
    scenes.splice(at, 0, scene);
    writeJson(project.specPath, project.spec);
    done(`scene inserted at position ${at + 1} (${scene.type})`);
    return;
  }

  const index = Number(positional[2]);
  const requireIndex = () => {
    if (!Number.isInteger(index) || index < 1 || index > scenes.length) {
      fail(`scene index must be 1..${scenes.length}`);
    }
    return index - 1;
  };

  if (action === 'rm' || action === 'remove' || action === 'delete') {
    const i = requireIndex();
    const [removed] = scenes.splice(i, 1);
    writeJson(project.specPath, project.spec);
    done(`removed scene ${index} (${removed.type})`);
    return;
  }
  if (action === 'move') {
    const from = requireIndex();
    const to = Number(positional[3]);
    if (!Number.isInteger(to) || to < 1 || to > scenes.length) fail(`target must be 1..${scenes.length}`);
    const [scene] = scenes.splice(from, 1);
    scenes.splice(to - 1, 0, scene);
    writeJson(project.specPath, project.spec);
    done(`moved scene ${index} to position ${to}`);
    return;
  }
  if (action === 'duplicate' || action === 'dup') {
    const i = requireIndex();
    const copy = JSON.parse(JSON.stringify(scenes[i]));
    scenes.splice(i + 1, 0, copy);
    writeJson(project.specPath, project.spec);
    done(`duplicated scene ${index}`);
    return;
  }
  if (action === 'set') {
    const i = requireIndex();
    if (flags.json) {
      const next = parseMaybeJson(flags.json);
      if (!isObj(next)) fail('--json must be a scene object');
      scenes[i] = next;
    } else {
      const key = positional[3];
      const value = positional.slice(4).join(' ');
      if (!key || value === '') fail('usage: video scene set <project> <n> <key> <json-value>');
      scenes[i][key] = parseMaybeJson(value);
    }
    writeJson(project.specPath, project.spec);
    done(`scene ${index} updated`);
    return;
  }
  if (action === 'caption') {
    const i = requireIndex();
    scenes[i].caption = positional.slice(3).join(' ');
    writeJson(project.specPath, project.spec);
    done(`caption set on scene ${index}`);
    return;
  }
  fail(`unknown scene action "${action}" — use list|add|rm|move|duplicate|set|caption`);
}

function commandAudio(flags, positional) {
  const action = positional[0];
  const project = loadProject(positional[1]);
  const spec = project.spec;
  const tracks = Array.isArray(spec.audio) ? spec.audio : [];
  if (action === 'list' || !action) {
    if (tracks.length === 0) console.log('  no audio tracks');
    tracks.forEach((track, index) =>
      console.log(`  ${index + 1}  ${track.src}  vol ${track.volume ?? 0.4}  start ${track.startAt ?? 0}s`),
    );
    return;
  }
  if (action === 'add') {
    const src = positional[2];
    if (!src) fail('usage: video audio add <project> <file> [--volume 0.4] [--start 0]');
    let finalSrc = src;
    if (!/^(https?:|data:)/i.test(src)) {
      const abs = path.resolve(src);
      if (!fs.existsSync(abs)) fail(`audio file not found: ${src}`);
      const assets = path.join(project.dir, 'assets');
      fs.mkdirSync(assets, {recursive: true});
      const target = path.join(assets, path.basename(abs));
      if (path.resolve(target) !== abs) fs.copyFileSync(abs, target);
      finalSrc = path.relative(project.dir, target).split(path.sep).join('/');
    }
    tracks.push({
      src: finalSrc,
      volume: Number(flags.volume ?? 0.4),
      startAt: Number(flags.start ?? 0),
    });
    spec.audio = tracks;
    writeJson(project.specPath, spec);
    done(`audio added: ${finalSrc}`);
    return;
  }
  if (action === 'rm' || action === 'remove') {
    const index = Number(positional[2]) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= tracks.length) fail('unknown audio index');
    const [removed] = tracks.splice(index, 1);
    spec.audio = tracks;
    writeJson(project.specPath, spec);
    done(`removed audio ${removed.src}`);
    return;
  }
  fail('usage: video audio list|add|rm');
}

function toSrtTime(seconds) {
  const ms = Math.round(seconds * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  const rest = String(ms % 1000).padStart(3, '0');
  return `${h}:${m}:${s},${rest}`;
}

function commandSrt(flags, positional) {
  const project = loadProject(positional[0]);
  const subtitles = project.spec.subtitles ?? [];
  if (subtitles.length === 0) fail('this project has no subtitles[] entries');
  const body = subtitles
    .slice()
    .sort((a, b) => a.from - b.from)
    .map((entry, index) => `${index + 1}\n${toSrtTime(entry.from)} --> ${toSrtTime(entry.to)}\n${entry.text}\n`)
    .join('\n');
  const out = path.resolve(flags.out ?? path.join(project.dir, 'out', 'captions.srt'));
  fs.mkdirSync(path.dirname(out), {recursive: true});
  fs.writeFileSync(out, body, 'utf8');
  done(`wrote ${out} (${subtitles.length} cues)`);
}

// ---------------------------------------------------------------------------
// media probing + import
// ---------------------------------------------------------------------------

function ffprobePath() {
  return process.env.FFPROBE ?? 'ffprobe';
}

function probeMedia(file) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) fail(`file not found: ${file}`);
  const tmpDir = path.join(ROOT, '.tmp');
  fs.mkdirSync(tmpDir, {recursive: true});
  const tmp = path.join(tmpDir, `probe-${crypto.randomUUID()}.json`);
  const fd = fs.openSync(tmp, 'w');
  const result = spawnSync(
    ffprobePath(),
    ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', abs],
    {stdio: ['ignore', fd, 'inherit']},
  );
  fs.closeSync(fd);
  if (result.status !== 0) {
    fs.rmSync(tmp, {force: true});
    fail('ffprobe failed. Is FFmpeg installed and on PATH?');
  }
  const data = readJson(tmp);
  fs.rmSync(tmp, {force: true});
  const video = (data.streams ?? []).find((stream) => stream.codec_type === 'video') ?? {};
  const audio = (data.streams ?? []).find((stream) => stream.codec_type === 'audio') ?? {};
  const [num, den] = String(video.avg_frame_rate ?? '0/1').split('/').map(Number);
  return {
    path: abs,
    duration: Number(data.format?.duration ?? 0),
    width: video.width ?? 0,
    height: video.height ?? 0,
    fps: den ? Number((num / den).toFixed(3)) : 0,
    videoCodec: video.codec_name ?? null,
    audioCodec: audio.codec_name ?? null,
    hasAudio: Boolean(audio.codec_name),
    size: Number(data.format?.size ?? 0),
  };
}

function commandProbe(positional) {
  if (!positional[0]) fail('usage: video probe <file>');
  const info = probeMedia(positional[0]);
  console.log(JSON.stringify(info, null, 2));
}

function commandImport(flags, positional) {
  const source = positional[0];
  const target = positional[1] ?? flags.to;
  if (!source || !target) fail('usage: video import <file> --to <project-dir> [--segment 4] [--copy]');
  const info = probeMedia(source);
  if (!info.width || !info.height) fail('that file has no video stream');
  const projectDir = path.resolve(flags.to ?? target);
  const specPath = path.join(projectDir, 'video.json');
  if (fs.existsSync(specPath) && !flags.force) fail(`${specPath} already exists (use --force)`);
  fs.mkdirSync(path.join(projectDir, 'assets'), {recursive: true});

  let src = source;
  if (!/^(https?:|data:)/i.test(source)) {
    const assets = path.join(projectDir, 'assets');
    const targetFile = path.join(assets, path.basename(source));
    if (path.resolve(targetFile) !== path.resolve(source)) fs.copyFileSync(source, targetFile);
    src = path.relative(projectDir, targetFile).split(path.sep).join('/');
  }

  const segment = Number(flags.segment ?? 0);
  const duration = info.duration || 0;
  const fps = Number(flags.fps ?? 30);
  const scenes = [];
  if (segment > 0 && duration > segment) {
    let cursor = 0;
    let index = 1;
    while (cursor < duration - 0.05) {
      const length = Math.min(segment, duration - cursor);
      scenes.push({
        id: `take-${index}`,
        type: 'video',
        src,
        trimStart: Number(cursor.toFixed(2)),
        trimEnd: Number((cursor + length).toFixed(2)),
        seconds: Number(length.toFixed(2)),
        muted: true,
        fit: 'cover',
      });
      cursor += length;
      index++;
    }
  } else {
    scenes.push({
      id: 'source',
      type: 'video',
      src,
      seconds: Number((duration || 5).toFixed(2)),
      muted: true,
      fit: 'cover',
    });
  }

  const spec = {
    $schema: '../../video.schema.json',
    meta: {
      title: path.basename(source, path.extname(source)),
      width: Number(flags.width ?? (info.height > info.width ? 1080 : 1920)),
      height: Number(flags.height ?? (info.height > info.width ? 1920 : 1080)),
      fps,
    },
    theme: {preset: 'midnight'},
    transition: {type: 'fade', duration: 0.25},
    progressBar: true,
    grid: false,
    scenes,
  };
  writeJson(specPath, spec);
  done(`imported ${path.basename(source)} → ${specPath}`);
  note(`${scenes.length} scene(s) · ${fmtSeconds(duration)} · ${info.width}×${info.height} @ ${info.fps}fps`);
}

// ---------------------------------------------------------------------------
// scaffolding
// ---------------------------------------------------------------------------

const TEMPLATES = {
  reel: {width: 1080, height: 1920},
  landscape: {width: 1920, height: 1080},
  square: {width: 1080, height: 1080},
};

function commandNew(flags, positional) {
  const dirArg = positional[0];
  if (!dirArg) fail('usage: video new <project-dir> [--template reel|landscape|square] [--title "..."]');
  const projectDir = path.resolve(dirArg);
  const specPath = path.join(projectDir, 'video.json');
  if (fs.existsSync(specPath) && !flags.force) fail(`${specPath} already exists (use --force to overwrite)`);
  const template = TEMPLATES[flags.template ?? 'reel'];
  if (!template) fail(`unknown template "${flags.template}" — use reel, landscape, or square`);
  const title = flags.title ?? path.basename(projectDir).replace(/[-_]+/g, ' ');
  fs.mkdirSync(path.join(projectDir, 'assets'), {recursive: true});
  fs.mkdirSync(path.join(projectDir, 'out'), {recursive: true});

  const spec = {
    $schema: '../../video.schema.json',
    meta: {title, width: template.width, height: template.height, fps: 30},
    theme: {preset: 'midnight'},
    transition: {type: 'fade', duration: 0.32},
    progressBar: true,
    grid: true,
    scenes: [
      {
        id: 'hook',
        type: 'title',
        seconds: 3,
        kicker: 'Kicker',
        text: title,
        subtitle: 'One sentence that earns the next five seconds.',
        align: 'left',
      },
      {
        id: 'points',
        type: 'bullets',
        seconds: 5,
        heading: 'What the viewer gets',
        items: [
          {text: 'First point', detail: 'One supporting line, concrete and specific.'},
          {text: 'Second point', detail: 'Keep it to a single idea.'},
          {text: 'Third point', detail: 'End on the payoff.'},
        ],
      },
      {id: 'cta', type: 'outro', seconds: 3, text: 'Your call to action.', cta: 'Learn more'},
    ],
  };
  writeJson(specPath, spec);
  done(`created ${specPath}`);
  note(`${template.width}×${template.height} · 3 scenes · add media in ${path.join(projectDir, 'assets')}`);
  note(`next: node ${path.relative(process.cwd(), path.join(ROOT, 'bin', 'video.mjs'))} render ${path.relative(process.cwd(), projectDir)}`);
}

function commandDoctor() {
  console.log(bold('video studio doctor'));
  const rows = [
    ['node', process.version],
    ['remotion cli', fs.existsSync(REMOTION_CLI) ? 'installed' : red('missing — run npm install')],
    ['remotion browser', hasBrowser() ? 'installed' : yellow('will download on first render')],
    ['ffmpeg', which('ffmpeg') ?? yellow('not found (only needed for import/probe)')],
    ['ffprobe', which('ffprobe') ?? yellow('not found (only needed for import/probe)')],
    ['projects', listProjects().length ? listProjects().join(', ') : dim('none yet')],
  ];
  for (const [label, value] of rows) console.log(`  ${label.padEnd(18)} ${value}`);
}

function which(bin) {
  const result = spawnSync(process.platform === 'win32' ? 'where' : 'which', [bin], {
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  return result.status === 0 ? bin : null;
}

function listProjects() {
  const dir = path.join(ROOT, 'projects');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, {withFileTypes: true})
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(dir, entry.name, 'video.json')))
    .map((entry) => entry.name);
}

function commandValidate(flags, positional) {
  const project = loadProject(positional[0]);
  const {errors, warnings, totalSeconds} = validateSpec(project.spec, project.dir);
  for (const warning of warnings) console.warn(`${yellow('warn')} ${warning}`);
  for (const error of errors) console.error(`${red('error')} ${error}`);
  if (errors.length) {
    fail(`${errors.length} error(s), ${warnings.length} warning(s)`);
  }
  done(`valid · ${project.spec.scenes.length} scenes · ${fmtSeconds(totalSeconds ?? 0)} · ${warnings.length} warning(s)`);
}

function commandInfo(positional) {
  const project = loadProject(positional[0]);
  const {errors, warnings, totalSeconds} = validateSpec(project.spec, project.dir);
  printTimeline(project.spec, project.dir);
  if (project.spec.audio?.length) console.log(`  audio: ${project.spec.audio.length} track(s)`);
  if (project.spec.subtitles?.length) console.log(`  subtitles: ${project.spec.subtitles.length} cue(s)`);
  console.log(`  spec: ${project.specPath}`);
  if (warnings.length) console.log(`  ${yellow('warnings')}: ${warnings.length} (run validate to see them)`);
  if (errors.length) {
    console.log(`  ${red('errors')}: ${errors.length} (run validate for details)`);
    process.exitCode = 1;
  } else if (totalSeconds !== undefined) {
    console.log(`  ${green('ready')} to render`);
  }
}

// ---------------------------------------------------------------------------
// entry point
// ---------------------------------------------------------------------------

const HELP = `
${bold('video')} — promptable video studio (Remotion + JSON spec)

${bold('create')}
  new <dir> [--template reel|landscape|square] [--title "..."]
  import <file> --to <dir> [--segment 4] [--fps 30]     build a spec from an existing video

${bold('inspect')}
  info <project>                    timeline, duration, resolution
  validate <project>                schema + media checks
  probe <file>                      ffprobe summary as JSON
  doctor                            environment check

${bold('render')}
  render <project> [--out file.mp4] [--scale 0.5] [--crf 18] [--frames 0-90]
  still <project> [--frame 60 | --at 2.5] [--out frame.png]
  thumbs <project> [--count 6]      contact sheet for quick review
  preview <project> [--port 3210]   Remotion Studio in the browser

${bold('edit')}
  scene list|add|rm|move|duplicate|set|caption ...
  set <project> <path> <json>       e.g. set . theme.accent '"#ff5c8a"'
  audio list|add|rm ...
  srt <project> [--out captions.srt]

${bold('examples')}
  node video.mjs new projects/launch --template landscape --title "Launch"
  node video.mjs render projects/launch
  node video.mjs scene add projects/launch --file scene.json
`;

async function main() {
  const {flags, positional} = parseArgs(process.argv.slice(2));
  const command = positional.shift();

  switch (command) {
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      console.log(HELP);
      return;
    case 'new':
      commandNew(flags, positional);
      return;
    case 'info':
      commandInfo(positional);
      return;
    case 'validate':
      commandValidate(flags, positional);
      return;
    case 'render':
      await commandRender(flags, positional);
      return;
    case 'still':
      await commandStill(flags, positional);
      return;
    case 'thumbs':
      await commandThumbs(flags, positional);
      return;
    case 'preview':
      await commandPreview(flags, positional);
      return;
    case 'scene':
      commandScene(flags, positional);
      return;
    case 'set':
      commandSet(flags, positional);
      return;
    case 'audio':
      commandAudio(flags, positional);
      return;
    case 'srt':
      commandSrt(flags, positional);
      return;
    case 'probe':
      commandProbe(positional);
      return;
    case 'import':
      commandImport(flags, positional);
      return;
    case 'doctor':
      commandDoctor();
      return;
    default:
      fail(`unknown command "${command}". Run "video help".`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
