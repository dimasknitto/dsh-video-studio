# React UI

Berlaku saat membuat atau mengubah file `.tsx` (semua agent).

## Tema mengikuti host, bukan identitas sendiri

Panel hidup di dalam DSH. Warna, border, dan latar **wajib** memakai variabel
host, bukan nilai tetap:

```css
color: var(--dsw-alias-label-primary, inherit);
border: 1px solid var(--dsw-alias-border-l3, rgba(127, 127, 127, 0.25));
```

Kalau butuh nilai turunan, pakai `color-mix(in srgb, currentColor 3%, transparent)`
seperti kartu yang sudah ada. Jangan menambah Tailwind: kelas utilitas akan
mengunci warna dan panel berhenti mengikuti tema terang/gelap DSH.

## Kontrol HTML native

| Jangan di `src/pages/**` | Pakai |
| --- | --- |
| `<select>` | `SelectField` dari `@/components/ui/select-field` |
| `<table>` | list atau grid CSS |
| inline `style={{...}}` | kelas baru di `src/styles.css` |

Aturan `<select>` dan `<table>` ditegakkan ESLint `react/forbid-elements` di
`src/pages/**`. Kalau butuh elemen native, bungkus di `src/components/ui/` —
di situlah satu-satunya tempat elemen itu boleh hidup.

## Struktur komponen

- Satu file satu komponen; nama file `kebab-case.tsx`.
- Komponen halaman tidak menyimpan logic data — ambil dari hook.
- Props selalu bertipe eksplisit; jangan `React.FC`.
- Jangan menambah dependensi UI baru tanpa alasan jelas: panel harus tetap kecil
  karena dimuat di dalam host.

## Aksesibilitas

- Tombol ikon wajib punya `title` atau `aria-label`.
- `aria-hidden="true"` untuk SVG dekoratif.
- Jangan menghapus `aria-label` pada `SelectField` saat memanggilnya.
