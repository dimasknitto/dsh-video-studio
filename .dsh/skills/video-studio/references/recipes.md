# Prompt → plan recipes

These are starting points, not templates to copy verbatim. Match the user's
voice and length; keep the scene rhythm.

## 1. Product launch reel (9:16, 15–25 s)

```
title  (3s)  kicker "Introducing", text "Meet <product>", subtitle value prop
bullets (5s) heading "What changes", 3 items
split  (4s)  image: product shot, heading "Built for <audience>"
stat   (3s)  value "<metric>", label what it means
outro  (3s)  text "Try it today", cta "Get early access", handle "@brand"
```

If the user has no product shot yet, use `gradient: true` on the title and
`code`/`terminal` for a demo instead of `split`.

## 2. Explainer from an article (16:9, 30–60 s)

```
title   (4s)  the claim, not the topic
bullets (6s)  3 causes / steps
quote   (5s)  one sentence pulled from the source, author credited
bars    (5s)  numbers from the piece
chat    (5s)  a plausible user question + the answer
outro   (4s)  what to do next
```

Set `meta.width=1920, height=1080`, `transition.duration=0.4`, and allow longer
scene times. Landscape has room for body copy — use `split.body` and `note`.

## 3. Caption + trim existing footage (9:16)

```powershell
node bin/video.mjs import C:\path\to\raw.mp4 --to projects/clip --segment 5
node bin/video.mjs info projects/clip
```

Then per `video` scene:

- keep 2–3 segments, delete the rest (`scene rm`);
- set `muted: true` and add music with `audio add ... --volume 0.25`;
- add `caption` (≤ 60 chars) per scene, or a `subtitles[]` array for word-level
  cues with `from`/`to` in seconds;
- reorder by moving scenes; adjust `trimStart`/`trimEnd` and `seconds` together.

## 4. Data story (9:16 or 16:9)

```
title (3s)   the surprising number
stat  (3s)   value "3.4x", label "more retention", note source
bars  (6s)   three to five comparisons, unit "%"
quote (4s)   customer or researcher line
outro (3s)   implication + CTA
```

`bars.items` values are plain numbers; `unit` is appended in the label.

## 5. AI / developer demo

```
terminal (5s) lines: cmd, bundling, "✓ ready in 41s"
code     (5s) 6–10 lines, highlight the one that matters
chat     (4s) prompt + result
outro    (3s) CTA
```

Keep terminal lines under 48 characters or the type shrinks. Use `type: "ok"`
for success lines so they turn green.

## 6. Testimonial / quote card

```
quote (5s)  text, author, role
split (4s)  image: headshot or workspace, heading "Why it matters"
outro (3s)  handle
```

Quote text shrinks automatically past ~90 characters, but rewrite rather than
rely on that.

## Revision prompts

| User says | Do this |
|---|---|
| "too fast" | add 0.5–1 s to every `seconds`, or `scene set` individually |
| "ganti tema" | `set <project> theme.preset '"neon"'` (then check one still) |
| "hapus scene X" | `scene rm <project> <n>` |
| "tambah poin" | `scene set <project> <n> --json '{...}'` or edit `items` |
| "musiknya terlalu keras" | `set <project> audio.0.volume 0.15` |
| "buat versi 16:9" | copy the project, set `meta.width/height`, re-check stills |
| "render 720p dulu" | `render <project> --scale 0.66 --out out/draft.mp4` |
