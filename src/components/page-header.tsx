export function PageHeader({
  image,
  eyebrow,
  title,
  children,
}: {
  image: string;
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  const words = title.split(" ");
  const last = words.pop();
  return (
    <section className="relative isolate overflow-hidden bg-stage text-stage-foreground">
      <img
        src={image}
        alt=""
        width={1280}
        height={720}
        className="absolute inset-y-0 right-0 -z-10 h-full w-full object-cover opacity-40 md:w-2/3 md:opacity-70 md:[mask-image:linear-gradient(90deg,transparent,black_45%)]"
      />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 pt-20 md:pt-28">
        <p className="eyebrow text-gold">— {eyebrow}</p>
        <h1 className="display-lg max-w-3xl">
          {words.join(" ")} <span className="italic-gold">{last}</span>
        </h1>
        {children && <div className="max-w-xl text-lg text-stage-foreground/80">{children}</div>}
      </div>
      <div className="rule-gold" />
    </section>
  );
}
