import { describe, expect, it } from 'vitest';
import { cx, formatBytes, formatDuration, slugify } from './format';

describe('formatDuration', () => {
  it('membulatkan detik dan menampilkan menit bila perlu', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(9.4)).toBe('9s');
    expect(formatDuration(75)).toBe('1m 15s');
  });

  it('aman untuk nilai tidak valid', () => {
    expect(formatDuration(Number.NaN)).toBe('0s');
    expect(formatDuration(-3)).toBe('0s');
  });
});

describe('formatBytes', () => {
  it('memilih satuan yang masuk akal', () => {
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('kosong untuk nilai tidak valid', () => {
    expect(formatBytes(0)).toBe('');
    expect(formatBytes(Number.NaN)).toBe('');
  });
});

describe('slugify', () => {
  it('membuat slug aman untuk nama folder', () => {
    expect(slugify('Cara Kerja AI Agent!')).toBe('cara-kerja-ai-agent');
    expect(slugify('  Test  ')).toBe('test');
  });

  it('memberi fallback saat topik kosong', () => {
    expect(slugify('')).toBe('video-baru');
    expect(slugify('!!!')).toBe('video-baru');
  });

  it('memotong slug panjang', () => {
    expect(slugify('a'.repeat(80)).length).toBe(48);
  });
});

describe('cx', () => {
  it('menggabungkan className yang truthy saja', () => {
    expect(cx('a', false, null, undefined, 'b')).toBe('a b');
  });
});
