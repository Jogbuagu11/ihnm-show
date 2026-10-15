/** Marks lucide doesn't ship. Sized by the caller's className. */
type P = { className?: string };

export function NextdoorIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 2 2 8.2v2.5l2.6-1.6v10.2c0 .4.3.7.7.7h4c.4 0 .7-.3.7-.7v-5.1c0-1.1.9-2 2-2s2 .9 2 2v5.1c0 .4.3.7.7.7h4c.4 0 .7-.3.7-.7V9.1L22 10.7V8.2L12 2Z" />
    </svg>
  );
}

export function SubstackIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M4 3h16v2.6H4V3Zm0 4.3h16V10H4V7.3ZM4 11.7 12 16l8-4.3V21l-8-4.3L4 21v-9.3Z" />
    </svg>
  );
}
