# AGENTS.md

Panduan agent untuk `plugins/dsh-video-studio` — panel GUI Video Studio di DSH.

Panel ini **bukan** aplikasi React biasa: hasil build dimuat host lewat
`window.__ModuleLoader__.load({ id, factory })`, dan `react` disediakan host
(bukan di-bundle). Baca bagian **Kontrak build** sebelum mengubah konfigurasi.

## Perintah

```bash
pnpm install
pnpm build       # lib/client.js (entry panel)
pnpm dev         # build ulang saat file berubah
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint src
pnpm test        # vitest run
```

`lib/index.js` (host half) **tidak** dihasilkan build — file itu ditulis manual
dan jangan ditimpa.

## Peta kode

| Area | Lokasi |
| --- | --- |
| Entry panel (`apply`, `inject`, injeksi CSS) | `src/main.tsx` |
| Tema panel (CSS variable host) | `src/styles.css` |
| Halaman & komposisi | `src/pages/**` |
| Logic data (RTK Query + controller) | `src/redux/**`, `src/pages/studio/hooks/**` |
| Komponen dipakai lintas halaman | `src/components/**` |
| Helper murni (mudah diuji) | `src/lib/**` |
| Kontrak data dari host | `src/types.ts` |

## Aturan & panduan

| Kapan | Baca dulu |
| --- | --- |
| Mengubah/membuat file `.tsx` | [`docs/rules/react-ui.md`](docs/rules/react-ui.md) |
| Menyentuh `src/redux/**` | [`docs/rules/redux-api.md`](docs/rules/redux-api.md) |
| Menambah/mengubah halaman `src/pages/**` | [`docs/rules/feature-pages.md`](docs/rules/feature-pages.md) |
| Menulis test | [`docs/rules/testing.md`](docs/rules/testing.md) |
| Membuat halaman feature baru | [`docs/skills/add-feature-page/SKILL.md`](docs/skills/add-feature-page/SKILL.md) |

## Kontrak build (jangan dilanggar)

1. `build.lib.formats` harus `cjs`, output `lib/client.js`.
2. `react` dan `react/jsx-runtime` **external** — jangan pernah di-bundle, karena
   host sudah menyediakannya lewat `require`.
3. Plugin `moduleLoaderWrapper` di `vite.config.ts` membungkus output menjadi
   `__ModuleLoader__.load`. Menghapusnya membuat panel tidak muncul sama sekali.
4. CSS diimpor sebagai `?inline` lalu di-inject ke `<head>` dengan id
   `dsh-video-studio-css`, supaya tidak dobel saat panel dibuka ulang.

## Konvensi

- TypeScript strict; jangan pakai `any` baru (yang ada akan ditandai lint).
- Alias `@/` memetakan ke `src/`.
- Data hanya lewat RTK Query; jangan `fetch` langsung di komponen.
- Jangan pakai inline style — tambahkan kelas di `src/styles.css`.
- Hook khusus halaman di `src/pages/{page}/hooks/`, helper murni di `src/lib/`.
- Teks UI berbahasa Indonesia, mengikuti istilah yang sudah ada di panel.
