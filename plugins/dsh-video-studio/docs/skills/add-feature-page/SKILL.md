# Skill: menambah halaman di panel Video Studio

Dipakai agent saat diminta menambah bagian UI baru di panel
(`plugins/dsh-video-studio`). Ikuti urutan ini; jangan menulis semua sekaligus.

## 1. Tentukan data dulu

Tanya: data apa yang dibutuhkan, dan sudah ada di `/video-studio/api/state`?

- **Sudah ada** → cukup baca dari `useStudioController`.
- **Belum ada** → tambahkan endpoint di `lib/index.js` (host half), lalu tipe di
  `src/types.ts`, lalu endpoint RTK Query di `src/redux/api/studio.ts`.

Jangan menambah `fetch` di komponen. Semua lewat RTK Query.

## 2. Buat folder halaman

```
src/pages/{nama}/
├── index.page.tsx
├── components/
└── hooks/
```

## 3. Tulis hook bila ada logic

Pola yang dipakai panel ini: hook mengembalikan data siap tampil, komponen hanya
merender. Contoh ada di `src/pages/studio/hooks/use-studio-controller.ts`.

## 4. Tulis komponen

- Class CSS baru → `src/styles.css`, bukan inline style.
- `<select>` → `SelectField`. `<table>` → jangan.
- Warna → variabel `--dsw-alias-*`.

## 5. Pasang di komposisi

Panggil dari `src/pages/studio/index.page.tsx`. Halaman baru tidak perlu router.

## 6. Verifikasi

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Cek `lib/client.js` masih dibungkus `window.__ModuleLoader__.load` dan masih
memuat `require("react")` (bukan React yang di-bundle).

## 7. Perbarui dokumentasi

Kalau menambah endpoint atau mengubah kontrak build, perbarui
`docs/rules/redux-api.md` dan `AGENTS.md`.
