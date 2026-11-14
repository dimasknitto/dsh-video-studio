interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

export function NumberField({ label, value, min, max, onChange }: NumberFieldProps) {
  return (
    <label className="dvs-dim dvs-fieldLabel">
      {label}
      <input
        className="dvs-input"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          const clamped = Number.isFinite(next) ? Math.max(min, Math.min(max, next)) : value;
          onChange(clamped);
        }}
      />
    </label>
  );
}
