# Feature Pages

Berlaku untuk `src/pages/**` (semua agent).

## Struktur folder halaman

```
src/pages/{halaman}/
├── index.page.tsx        # komposisi halaman
├── components/           # bagian yang hanya dipakai halaman ini
├── hooks/                # logic data halaman
└── ...
```

Panel ini satu tampilan, jadi tidak ada router. Halaman disusun sebagai blok
yang dipanggil dari `src/pages/studio/index.page.tsx`:

| Halaman | Isi |
| --- | --- |
| `prompt/` | kartu prompt cepat (topik, format, detik, tema) |
| `projects/` | daftar project + baris project |
| `preview/` | player, timeline scene, meta, aksi render |
| `render/` | tombol render/draft/studio + log job |
| `studio/` | komposisi seluruh panel + controller |

## Aturan

- **Logic data di hook, bukan di komponen.** Contoh: `hooks/use-studio-controller.ts`.
- Komponen halaman menerima props yang sudah siap tampil; jangan memanggil
  endpoint langsung dari `components/**`.
- Kalau sebuah bagian dipakai dua halaman, pindahkan ke `src/components/**`.
- Jangan menambah `react-router-dom` untuk "kebiasaan": panel tidak punya URL
  sendiri, dan menambah router hanya menambah bobot bundle.

## Menambah halaman baru

Ikuti `docs/skills/add-feature-page/SKILL.md`.
