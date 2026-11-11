---
name: video-studio
description: Turn a prompt into a rendered video (MP4) or edit existing footage using the local Remotion studio in ./video-studio. Use when the user asks to make, revise, caption, trim, or render a video — "buat video", "bikin reel", "video penjelasan", "short/reel/tiktok", "edit video ini", "tambah caption", "ganti tema video", "render ulang". Covers 1080x1920 reels, 1920x1080 YouTube, and 1080x1080 square from one JSON spec.
whenToUse: Any video creation, editing, or rendering request, including iterating on a previously rendered project. Also use when the user wants a storyboard or scene breakdown before committing to a render.
---

# Video studio (prompt → MP4)

A self-contained Remotion studio lives at `video-studio/`. One JSON file
(`video.json`) fully describes a video: format, theme, scenes, audio, subtitles.
An agent edits that JSON — not React — and renders with one command.

A GUI panel (**Video Studio** in the sidebar, plugin at
`plugins/dsh-video-studio/`) shows the same projects, previews, renders, and
opens a prefilled agent session. The panel and the CLI share
`video-studio/bin/video.mjs`, so a render started from the panel produces the
same file. Prefer the CLI for agent work; the panel is for the human.

Read `references/spec.md` for every scene type and field, and
`references/recipes.md` for prompt → scene-plan patterns.

## Rules that keep renders working

1. **Always run commands from the studio directory**:
   `cd video-studio` (workspace root is the session cwd by default).
2. **Rendering needs full access.** Remotion spawns Chrome Headless Shell.
   Inside the DSH sandbox, a workspace-write call fails with `spawn EPERM`.
   Run `render`, `still`, `thumbs`, and `preview` with
   `sandbox_permissions: "danger-full-access"` (one-shot) and say why in the
   justification. `validate`, `info`, `scene`, `set`, `audio`, `srt`, and
   `import` run fine in the normal sandbox.
3. **Never pipe render output.** `node bin/video.mjs render ... | Select-Object`
   kills ffmpeg with `write EOF`. Redirect instead:
   `node bin/video.mjs render projects/<slug> *> out\render.log`, then read the
   tail of `out\render.log`.
4. **Validate before rendering.** `node bin/video.mjs validate projects/<slug>`
   catches missing media, bad scene fields, and timeline mistakes.
5. **Look at the frames.** Render 1–2 stills or `thumbs` and inspect them with
   the image reader before the final render. Fix the spec, not the screenshot.
6. **The first render on a machine downloads ~131 MB** of Chrome Headless
   Shell. Warn the user once; later renders are cached.

## Workflow

1. **Clarify only what changes the output**: topic, audience, duration,
   format (reel/landscape/square), language, brand handle, and whether media
   (images/clips/music) already exists. If the user is vague, choose sensible
   defaults and say them in one line.
2. **Scaffold or open a project**:
   - New: `node bin/video.mjs new projects/<slug> --template reel|landscape|square --title "…"`
   - Existing: `node bin/video.mjs info projects/<slug>`
3. **Write the spec** (edit `projects/<slug>/video.json` with the write tool, or
   use `scene add` / `set`). Structure: one idea per scene, 2–5 s each, hook in
   the first 2 s, CTA at the end. Put short lower-third captions on scenes with
   key claims.
4. **QA**: `validate` → `thumbs` (or 2 stills) → inspect → adjust theme/type/
   copy. Repeat until the frames look deliberate.
5. **Render**: `render projects/<slug> [--scale 0.5 for drafts]`, read the log
   tail, confirm the MP4 exists.
6. **Deliver**: `present` the MP4 (and optionally a still/thumbnail). Report
   duration, resolution, and the spec path so the next edit is cheap.

## Command cheat sheet

```powershell
cd video-studio
node bin/video.mjs new projects/<slug> --template reel --title "Launch"
node bin/video.mjs info projects/<slug>
node bin/video.mjs validate projects/<slug>
node bin/video.mjs still projects/<slug> --at 2.5 --out out\check.png
node bin/video.mjs thumbs projects/<slug> --count 6
node bin/video.mjs render projects/<slug>                # -> projects/<slug>/out/<slug>.mp4
node bin/video.mjs render projects/<slug> --scale 0.5 --out out\draft.mp4
node bin/video.mjs preview projects/<slug> --port 3210   # Remotion Studio
# scene JSON: write it to a file first, then --file (PowerShell strips inline quotes)
node bin/video.mjs scene add projects/<slug> --file scene.json
node bin/video.mjs scene rm projects/<slug> 2
node bin/video.mjs set projects/<slug> theme.accent '"#ff5c8a"'
node bin/video.mjs audio add projects/<slug> assets/music.mp3 --volume 0.3
node bin/video.mjs srt projects/<slug>
node bin/video.mjs import assets/raw.mp4 --to projects/edit --segment 4
node bin/video.mjs probe assets/raw.mp4
```

`import` builds a spec from existing footage, one `video` scene per segment, so
you can trim, reorder, caption, and re-render. `probe` returns duration, fps,
and dimensions as JSON.

## Editing an existing video

- Trim/reorder: edit the `video` scenes' `trimStart`/`trimEnd` (seconds) and
  their order; scene `seconds` should equal `trimEnd - trimStart`.
- Add captions: set `caption` per scene for a lower third, or add a
  `subtitles[]` array (`{text, from, to}` in timeline seconds) for precise cues.
- Replace audio: `audio add` copies the file into `assets/`; `fadeIn`/`fadeOut`
  are seconds, `volume` is 0–1.
- Keep the source file in `projects/<slug>/assets/` so the project stays
  portable.

## Quality bar

- 9:16 reels: 5–8 scenes for 15–25 s. Headline ≤ 8 words, bullets ≤ 6 words.
- 16:9: fewer, longer scenes (4–6 s) and more body copy.
- One accent idea per video; do not mix five themes. Use `theme.preset` and
  override one or two colors at most.
- Captions are short (≤ 60 characters) and never repeat the headline verbatim.
- Text must survive a phone screen: no font below ~24 px at 1080 width.
- Avoid emoji-heavy copy; the typography carries the design.

## Common failures

| Symptom | Cause / fix |
|---|---|
| `spawn EPERM` | Render called without full access. Retry with `sandbox_permissions: "danger-full-access"`. |
| `write EOF` mid-render | Output was piped. Redirect to a log file. |
| `Permission denied` on `pre-encode.mp4` | System temp blocked; the CLI already points TMP/TEMP at `video-studio/.tmp`. Do not override. |
| Missing image/audio error | Paths are relative to the **project** dir, not the workspace. |
| Still shows old content | Remotion caches bundles per entry; re-run, and delete `node_modules/.cache` only if a code change is not picked up. |
| `scene add --json` says "scene must be an object" | PowerShell strips the JSON's double quotes. Write the scene to a `.json` file and use `--file`. |
| Studio opens the default project | `preview` passes the project with `--props`; check the path argument. |
