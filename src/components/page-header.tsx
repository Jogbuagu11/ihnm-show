export function PageHeader({ image, eyebrow, title, children }: { image: string; eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden">
      <img src={image} alt="" width={1280} height={720} className="absolute inset-0 -z-10 size-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-hero-overlay" />
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-24 text-ivory">
        <p className="eyebrow text-gold">{eyebrow}</p>
        <h1 className="mt-2 text-5xl font-semibold">{title}</h1>
        {children && <div className="mt-3 max-w-2xl text-lg opacity-95">{children}</div>}
      </div>
    </section>
  );
}
