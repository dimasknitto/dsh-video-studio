# Redux & RTK Query

Berlaku untuk `src/redux/**` (semua agent).

## Struktur

```
src/redux/
├── api/
│   ├── _baseQuery.ts    # baseService() — base URL + header x-video-studio
│   └── studio.ts        # createApi: state, render, studio
├── store.ts
└── hooks.ts             # useAppDispatch / useAppSelector
```

## Endpoint host

Semua route relatif ke prefix plugin (`/video-studio`) dan dilayani
`lib/index.js`:

| Method | Path | Dipakai untuk |
| --- | --- | --- |
| GET | `/api/state` | daftar project + job + status Studio |
| GET | `/api/jobs` | daftar job saja |
| GET | `/api/spec/:slug` | isi `video.json` mentah |
| GET | `/media/:slug/:path` | file media (mendukung range) |
| POST | `/api/render` | mulai render `{slug, draft?}` |
| POST | `/api/studio` | buka Remotion Studio `{slug}` |

POST **wajib** membawa header `x-video-studio: 1`. Header itu sudah dipasang
`baseService()` untuk semua request — jangan mengirim `fetch` sendiri.

## Menambah endpoint

```ts
export const studioApi = createApi({
  reducerPath: 'studioApi',
  baseQuery: baseService(),
  tagTypes: ['State'],
  endpoints: (build) => ({
    getJobs: build.query<{jobs: StudioJob[]}, void>({
      query: () => ({url: '/api/jobs'}),
      providesTags: ['State'],
    }),
  }),
});
```

- Tambahkan tipe respons di `src/types.ts`, bukan di file api.
- Mutasi yang mengubah daftar project wajib `invalidatesTags: ['State']`.
- Polling diatur di hook (`pollingInterval: POLL_INTERVAL_MS`), bukan di endpoint,
  supaya halaman yang tidak butuh polling tidak ikut menembak server.

## Store

Store dibuat sekali di `src/redux/store.ts` dan dibungkus `Provider` di
`src/pages/studio/index.page.tsx`. Jangan membuat store baru per komponen —
itu akan memutus cache dan membuat polling berlipat.
