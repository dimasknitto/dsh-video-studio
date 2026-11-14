# CLAUDE.md

Panduan operasional agent untuk panel ini ada di [`AGENTS.md`](AGENTS.md).
Baca file itu lebih dulu.

Aturan per area dan skill kerja ada di lokasi netral (bukan folder milik satu tool):

- `docs/rules/` — aturan per area (`react-ui`, `redux-api`, `feature-pages`, `testing`).
- `docs/skills/` — workflow langkah demi langkah.

Catatan khusus repo ini: hasil build dimuat host lewat `window.__ModuleLoader__`
dan `react` disediakan host. Detailnya di bagian **Kontrak build** pada `AGENTS.md`.
