# Testing

Berlaku untuk file `*.test.ts` (semua agent).

## Yang diuji di project ini

Vitest berjalan di environment `node` dan hanya menguji **logic murni** di
`src/lib/**`: format angka, pembuatan slug, dan penyusunan prompt.

```bash
pnpm test
```

Komponen React belum punya test. Kalau nanti dibutuhkan, tambahkan
`@testing-library/react` + environment `jsdom` — jangan mengubah environment
global hanya untuk satu file.

## Yang perlu diuji lebih dulu

1. `src/lib/build-prompt.ts` — prompt menentukan nama folder project; salah slug
   berarti video hasil agent tidak muncul di panel.
2. `src/lib/format.ts` — angka dipakai di UI dan mudah salah pembulatan.
3. `src/pages/studio/hooks/use-studio-controller.ts` — begitu ada jsdom, uji
   pemilihan project otomatis dan status job.

## Aturan

- Satu `describe` per fungsi; nama test menjelaskan perilaku, bukan implementasi.
- Uji kasus batas yang benar-benar merusak UI: `NaN`, nilai negatif, string kosong.
- Jangan mengejek RTK Query di test logic murni — kalau butuh, itu tanda logic
  seharusnya dipindah ke `src/lib/`.
