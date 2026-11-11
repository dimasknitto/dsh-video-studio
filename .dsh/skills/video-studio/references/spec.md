# Spec reference

`video.json` is the whole video. Top level:

| Key | Type | Notes |
|---|---|---|
| `meta.title` | string | Shown in `info`, used in filenames |
| `meta.width` / `meta.height` | int | 1080×1920 reel, 1920×1080 landscape, 1080×1080 square |
| `meta.fps` | int | 30 is the default; 60 for very smooth motion |
| `theme` | object | `preset` + optional overrides (below) |
| `transition` | `{type: "fade"|"none", duration: seconds}` | Applies to every scene edge |
| `progressBar` | bool | Thin accent line at the bottom (default true) |
| `grid` | bool | Blueprint grid in the background (default true) |
| `brand` | `{handle, show}` | Small handle mark top-right |
| `audio[]` | `{src, volume, startAt, trimStart, fadeIn, fadeOut}` | Seconds for timing; paths relative to the project |
| `subtitles[]` | `{text, from, to}` | Timeline seconds; overrides scene captions while active |
| `scenes[]` | array | Non-empty |

Every scene accepts `id`, `seconds` (preferred), `duration` (frames, wins),
`caption` (lower third), and `bg` (CSS background override).

## Theme presets

`midnight` (violet/cyan on near-black), `sunset` (orange/amber on plum), `neon`
(green/magenta on black), `paper` (ink on warm off-white), `mono` (white on
black). Override `bg`, `fg`, `muted`, `accent`, `accent2`, `font`, `mono`,
`radius` sparingly.

Fonts default to the system UI stack (Segoe UI on Windows, SF on macOS) and
Cascadia/Consolas for code. For a branded face, drop a `.woff2` into
`public/fonts/`, add `@font-face` in `src/styles.css`, and point `theme.font` at
it.

## Scene types

### title
`text` (required), `kicker`, `subtitle`, `align: "left"|"center"`, `gradient`.
Use for the hook. 2.5–4 s.

### bullets
`items` (required): `["string"]` or `[{text, detail}]`; `heading`, `kicker`,
`numbered` (default true). 4–6 s. Three items is the sweet spot; six is the max.

### stat
`value` (required, string — `"92%"`, `"$1.2M"`, `"3x"`, `"1,204"`), `label`
(required), `note`, `kicker`. Numbers ≥ 10 count up automatically. 2.5–3.5 s.

### quote
`text` (required), `author`, `role`. 3–5 s. Long quotes shrink; keep under 220
characters.

### image
`src` (required), `kenBurns: zoom-in|zoom-out|pan-left|pan-right|none`,
`fit: cover|contain`, `overlay` (0–1), `inset` (bool), `heading`, `body`.
Full-bleed by default; `inset` frames it with a margin. Put files in
`projects/<slug>/assets/`.

### video
`src` (required), `trimStart`/`trimEnd` (source seconds), `muted` (default true),
`volume`, `playbackRate`, `fit`, `inset`, `rounded`. The scene duration should
match the trimmed length. This is the building block for editing existing
footage.

### code
`code` (required, string with `\n`), `filename`, `language`, `highlight`
(1-based line numbers). Lines reveal in order with a naive syntax highlighter.
Keep lines under ~60 characters.

### terminal
`lines` (required): `[{text, type: cmd|out|ok|warn|error}]`, optional `title`.
Typed character by character. 4–6 lines; 3–5 s.

### chat
`messages` (required): `[{role: "user"|"ai", text, name?}]`, optional `title`.
Bubbles arrive in sequence with a typing indicator for AI. 3–5 messages.

### split
`heading` (required), `image`, `body`, `kicker`, `side: left|right|top`, `fit`.
Stacks automatically in portrait. Use for feature/benefit with a visual.

### bars
`items` (required): `[{label, value, note?}]`, `heading`, `unit`, `max`.
Horizontal bars animate from zero. 3–5 rows.

### outro
`text` (required), `subtitle`, `cta`, `handle`. 3–4 s. One CTA, one handle.

### blank
`color` optional. Use as a breathing beat or a manual background for a later
overlay edit.

## Timing guidance

| Format | Length | Scenes | Scene length |
|---|---|---|---|
| Reel / Short | 15–25 s | 5–8 | 2–5 s |
| Explainer (16:9) | 30–90 s | 8–15 | 4–8 s |
| Square teaser | 8–15 s | 3–5 | 2–4 s |

`info` prints start/end per scene; `seconds` is the only knob you normally need.

## Copy rules

- Hook names the payoff in ≤ 8 words.
- One idea per scene; if a scene needs two headlines, it is two scenes.
- Captions add information, they do not repeat the headline.
- Numbers beat adjectives: "41s render" not "super fast".
