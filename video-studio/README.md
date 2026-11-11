# Video Studio — prompt jadi video

Studio video lokal berbasis [Remotion](https://www.remotion.dev) yang dikendalikan
satu file `video.json`. Cocok untuk reel 9:16, YouTube 16:9, dan teaser 1:1 —
tanpa membuka aplikasi editor.

```
prompt  →  video.json  →  preview / still  →  MP4
              ↑                  ↓
         edit di sini      cek visual dulu
```

Gagasan intinya: video adalah **data**, bukan codebase. Agent (atau kamu) menulis
scene, tema, caption, dan audio di JSON; satu komponen Remotion merender semuanya
ke layar dan ke MP4. Mengganti satu baris = render ulang beberapa detik kemudian.

## Quick start

```powershell
cd video-studio
node bin/video.mjs doctor
node bin/video.mjs new projects/launch --template landscape --title "Launch"
node bin/video.mjs validate projects/launch
node bin/video.mjs render projects/launch
# → projects/launch/out/launch.mp4
```

Render pertama mengunduh Chrome Headless Shell (~131 MB) sekali saja.

> **Di dalam DSH**, `render`, `still`, `thumbs`, dan `preview` harus dijalankan
> dengan akses penuh (`sandbox_permissions: "danger-full-access"`) karena Remotion
> men-spawn Chrome. Perintah lain aman di sandbox biasa. Skill `video-studio`
> sudah mengurus detail ini saat kamu prompting di chat.

## Contoh yang sudah dirender

| File | Isi |
|---|---|
| `projects/ai-agent/out/ai-agent.mp4` | Reel 1080×1920, 23,7 s, 6 scene (title, bullets, chat, terminal, stat, outro) |
| `projects/edit-demo/out/edit-demo.mp4` | Hasil edit footage: trim 2 potongan, caption, outro — 10,6 s |
| `out/landscape.mp4` | Versi 1920×1080 dari spec yang sama |
| `out/overview.jpg` | Contact sheet 8 frame dari reel |
| `out/cover.png` | Still judul untuk thumbnail/cover |

## Perintah

| Perintah | Fungsi |
|---|---|
| `new <dir> --template reel\|landscape\|square` | Scaffold project + `assets/` + `out/` |
| `info <project>` | Timeline: mulai/selesai per scene, durasi, resolusi |
| `validate <project>` | Cek schema, field wajib, dan file media yang hilang |
| `render <project> [--scale 0.5] [--frames 0-90]` | Render MP4 |
| `still <project> --at 2.5` | Satu frame PNG untuk QA |
| `thumbs <project> --count 6` | Contact sheet untuk review |
| `preview <project>` | Remotion Studio di browser (timeline + scrub) |
| `scene list\|add\|rm\|move\|duplicate\|set\|caption` | Edit urutan/isi scene |

> **Catatan PowerShell:** JSON inline (`--json '{"type":"stat"}'`) kehilangan tanda
> kutip saat diteruskan ke Node. Tulis scene ke file `.json` lalu pakai
> `--file scene.json` — atau jalankan dari Bash/WSL.
| `set <project> <path> <json>` | Edit nilai apa pun, mis. `theme.accent` |
| `audio add\|rm\|list` | Musik/narasi dengan fade |
| `srt <project>` | Ekspor subtitle ke `out/captions.srt` |
| `import <file> --to <dir> --segment 5` | Bikin project dari footage yang sudah ada |
| `probe <file>` | Durasi/fps/resolusi via ffprobe (JSON) |
| `doctor` | Cek Node, Remotion, browser, ffmpeg |

Semua perintah menerima path project (folder berisi `video.json`) atau path
langsung ke file JSON.

## Jenis scene

`title` · `bullets` · `stat` · `quote` · `image` · `video` · `code` ·
`terminal` · `chat` · `split` · `bars` · `outro` · `blank`

Field lengkap ada di [`video.schema.json`](video.schema.json) dan di skill
reference: `.dsh/skills/video-studio/references/spec.md`.

Contoh minimal:

```json
{
  "meta": {"title": "Demo", "width": 1080, "height": 1920, "fps": 30},
  "theme": {"preset": "midnight"},
  "scenes": [
    {"type": "title", "seconds": 3, "kicker": "Halo", "text": "Video dari prompt", "gradient": true},
    {"type": "bullets", "seconds": 4, "heading": "Caranya", "items": ["Tulis brief", "Susun scene", "Render"]},
    {"type": "outro", "seconds": 3, "text": "Selesai.", "cta": "Coba sekarang"}
  ]
}
```

## Struktur

```
video-studio/
  bin/video.mjs          CLI (tanpa dependency tambahan)
  src/
    spec.ts              tipe + tema + timeline
    Video.tsx            komposisi utama (semua dari spec)
    Root.tsx             registrasi komposisi + metadata dinamis
    scenes/*.tsx         13 renderer scene
    ui/                  background, caption, progress, motion
  public/fonts/          font kustom (opsional)
  projects/<slug>/       video.json + assets/ + out/
  video.schema.json      schema untuk editor & validasi manual
  .tmp/                  frame sementara Remotion (jangan dihapus saat render)
```

## Editing footage yang sudah ada

```powershell
node bin/video.mjs import assets/raw.mp4 --to projects/clip --segment 5
node bin/video.mjs info projects/clip
node bin/video.mjs scene rm projects/clip 3
node bin/video.mjs audio add projects/clip assets/music.mp3 --volume 0.25
node bin/video.mjs still projects/clip --at 4
node bin/video.mjs render projects/clip
```

`import` memecah footage jadi scene `video` per segmen; atur `trimStart` /
`trimEnd` (detik) dan `seconds` untuk memotong, lalu tambah caption, musik, atau
scene teks di antaranya.

## Kustomisasi visual

- **Tema**: `theme.preset` (`midnight`, `sunset`, `neon`, `paper`, `mono`) plus
  override `accent`, `accent2`, `bg`, `fg`, `radius`.
- **Font**: taruh `.woff2` di `public/fonts/`, tambahkan `@font-face` di
  `src/styles.css` (buat file), lalu set `theme.font`.
- **Ukuran**: semua tipografi memakai satuan yang menyesuaikan area frame, jadi
  spec yang sama tetap proporsional di 9:16 dan 16:9.
- **Scene baru**: tambah komponen di `src/scenes/`, daftarkan di
  `SceneView.tsx`, perluas `spec.ts` + `video.schema.json` + validasi CLI.

## Batasan saat ini

- Caption belum di-generate dari audio (belum ada speech-to-text); isi manual
  atau lewat `subtitles[]`.
- Belum ada transisi selain fade; cut keras bisa dipakai dengan
  `transition.type: "none"`.
- Audio hanya di level global, bukan per scene.
- Render berjalan lokal (CPU/GPU mesin ini), bukan cloud.
