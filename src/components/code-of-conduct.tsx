export const CONDUCT = [
  "Arrive on time — doors close when taping begins.",
  "Phones on silent and put away while cameras roll.",
  "Be respectful of guests, crew and fellow audience members, even when you disagree.",
  "Follow crew directions for seating, applause and safety.",
  "No outside recording, flash photos or livestreaming.",
  "Minors stay with the adult on their ticket at all times.",
];

export function CodeOfConduct() {
  return (
    <details className="rounded-xl border p-3 text-sm">
      <summary className="cursor-pointer font-semibold">Audience code of conduct</summary>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">{CONDUCT.map((c) => <li key={c}>{c}</li>)}</ul>
    </details>
  );
}
