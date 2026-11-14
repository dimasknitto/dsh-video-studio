import { useMemo, useState } from 'react';
import { NumberField } from '@/components/ui/number-field';
import { SelectField } from '@/components/ui/select-field';
import { Sparkle } from '@/components/ui/sparkle';
import { buildPrompt } from '@/lib/build-prompt';
import {
  DEFAULT_FORMAT,
  DEFAULT_SECONDS,
  DEFAULT_THEME,
  FORMAT_OPTIONS,
  MAX_SECONDS,
  MIN_SECONDS,
  THEME_OPTIONS,
} from '@/lib/constants';

interface PromptCardProps {
  onSend: (prompt: string) => void;
  onCopy: (prompt: string) => void;
}

export function PromptCard({ onSend, onCopy }: PromptCardProps) {
  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState(DEFAULT_FORMAT);
  const [seconds, setSeconds] = useState(DEFAULT_SECONDS);
  const [theme, setTheme] = useState(DEFAULT_THEME);

  const prompt = useMemo(
    () => buildPrompt({ topic: topic.trim(), format, seconds, theme }),
    [topic, format, seconds, theme],
  );

  return (
    <section className="dvs-card">
      <div className="dvs-promptHead">
        <Sparkle size={16} />
        Prompt cepat
        <span className="dvs-dim">— isi topik, lalu serahkan ke agent</span>
      </div>
      <textarea
        className="dvs-field"
        value={topic}
        placeholder="Contoh: cara kerja AI agent di DeepSeek Harness, untuk audiens developer"
        onChange={(event) => setTopic(event.target.value)}
        spellCheck={false}
      />
      <div className="dvs-controls">
        <SelectField label="Format" value={format} options={FORMAT_OPTIONS} onChange={setFormat} />
        <NumberField
          label="detik "
          value={seconds}
          min={MIN_SECONDS}
          max={MAX_SECONDS}
          onChange={setSeconds}
        />
        <SelectField label="Tema" value={theme} options={THEME_OPTIONS} onChange={setTheme} />
        <div className="dvs-spacer" />
        <button
          type="button"
          className="dvs-btn dvs-btn-ghost"
          onClick={() => onCopy(prompt)}
          title="Salin prompt ke clipboard"
        >
          Salin
        </button>
        <button
          type="button"
          className="dvs-btn dvs-btn-primary"
          onClick={() => onSend(prompt)}
          disabled={topic.trim().length === 0}
        >
          <Sparkle size={15} />
          Buat dengan agent
        </button>
      </div>
    </section>
  );
}
