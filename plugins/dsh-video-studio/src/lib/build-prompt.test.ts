import { describe, expect, it } from 'vitest';
import { buildPrompt } from './build-prompt';

describe('buildPrompt', () => {
  it('menyertakan topik, format, dan durasi', () => {
    const prompt = buildPrompt({
      topic: 'Cara kerja AI agent',
      format: 'landscape',
      seconds: 30,
      theme: 'neon',
    });

    expect(prompt).toContain('YouTube 16:9');
    expect(prompt).toContain('30 detik');
    expect(prompt).toContain('Cara kerja AI agent');
    expect(prompt).toContain('tema neon');
  });

  it('memakai slug yang sama dengan nama folder project', () => {
    const prompt = buildPrompt({
      topic: 'Cara Kerja AI Agent',
      format: 'reel',
      seconds: 20,
      theme: 'midnight',
    });

    expect(prompt).toContain('video-studio/projects/cara-kerja-ai-agent/video.json');
  });

  it('jatuh ke format reel bila format tidak dikenal', () => {
    const prompt = buildPrompt({ topic: 'x', format: 'tidak-ada', seconds: 20, theme: 'midnight' });
    expect(prompt).toContain('Reel 9:16');
  });

  it('menandai topik kosong tanpa membuat slug aneh', () => {
    const prompt = buildPrompt({ topic: '', format: 'reel', seconds: 20, theme: 'midnight' });
    expect(prompt).toContain('(topik belum diisi)');
    expect(prompt).toContain('video-studio/projects/video-baru/video.json');
  });
});
