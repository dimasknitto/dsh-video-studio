import { FORMATS } from './constants';
import { slugify } from './format';

export interface PromptInput {
  topic: string;
  format: string;
  seconds: number;
  theme: string;
}

/**
 * Prompt yang diserahkan ke agent. Slug harus sama dengan yang nanti ditulis
 * agent, supaya project muncul di daftar setelah sesi selesai.
 */
export function buildPrompt({ topic, format, seconds, theme }: PromptInput): string {
  const info = FORMATS[format] ?? FORMATS.reel;
  const slug = slugify(topic);
  return [
    `Buat video ${info.label} berdurasi sekitar ${seconds} detik tentang: ${topic || '(topik belum diisi)'}.`,
    `Gaya visual: tema ${theme}, tipografi besar dan bersih, caption pendek, transisi halus.`,
    '',
    'Gunakan skill video-studio di workspace ini:',
    `1. Tulis spec JSON ke video-studio/projects/${slug}/video.json (jangan menulis komponen React baru).`,
    `2. Jalankan: node video-studio/bin/video.mjs validate video-studio/projects/${slug}`,
    '3. Cek 2 still dengan read_image, lalu perbaiki spec bila perlu.',
    '4. Render MP4 dan present hasilnya.',
    '',
    'Bahasa: Indonesia.',
  ].join('\n');
}
