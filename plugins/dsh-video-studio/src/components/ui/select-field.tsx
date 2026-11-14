export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  value: string;
  options: SelectOption[];
  label: string;
  onChange: (value: string) => void;
}

/**
 * Satu-satunya tempat `<select>` native dipakai. Halaman tidak boleh memakainya
 * langsung (dijaga `react/forbid-elements` di `src/pages/**`).
 */
export function SelectField({ value, options, label, onChange }: SelectFieldProps) {
  return (
    <select
      className="dvs-select"
      value={value}
      aria-label={label}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
