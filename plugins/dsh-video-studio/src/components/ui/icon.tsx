/** Ikon panel di sidebar DSH. */
export function Icon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x={3} y={4.5} width={18} height={15} rx={2.5} />
      <path d="M3 9h18M3 15h18" />
      <path d="M8 4.5v15M16 4.5v15" />
      <path d="M10.5 12.2l3.2 1.9-3.2 1.9z" fill="currentColor" stroke="none" />
    </svg>
  );
}
