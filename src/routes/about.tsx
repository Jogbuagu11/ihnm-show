import { createFileRoute, Link } from "@tanstack/react-router";
import panel from "@/assets/panel.jpg";
import sitdown from "@/assets/sitdown.jpg";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — IHNM Show" },
      {
        name: "description",
        content:
          "The mission and story of IHNM Show, a live-audience talk show on Scripture, history and current events, and the team behind it.",
      },
      { property: "og:title", content: "About IHNM Show" },
      {
        property: "og:description",
        content: "Our mission, our story, and the people behind the show.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

const team = [
  {
    n: "Host Name",
    r: "Host & Creator",
    b: "Placeholder bio — a few lines about the host, their background and why they started the show.",
  },
  {
    n: "Producer Name",
    r: "Executive Producer",
    b: "Placeholder bio for the producer who keeps every taping on time.",
  },
  { n: "Director Name", r: "Director", b: "Placeholder bio for the director behind the cameras." },
  {
    n: "Worship Lead",
    r: "Music & Worship",
    b: "Placeholder bio for the worship leader who opens each taping.",
  },
];

// Doctrinal text, reproduced exactly as supplied. Kept as data rather than
// inline JSX so the apostrophes and en-dashes are not mangled by escaping.
const beliefs = [
  {
    t: "The Bible",
    b: "The Bible is the inspired, trustworthy Word of God, and our final authority for faith and life.",
    r: "2 Timothy 3:16\u201317",
  },
  {
    t: "God",
    b: "There is one God, eternally existing as Father, Son and Holy Spirit.",
    r: "Matthew 28:19",
  },
  {
    t: "Jesus Christ",
    b: "Jesus is the Son of God, fully God and fully man. He was born of a virgin, lived without sin, died on the cross for our sins, rose bodily from the dead, and ascended to the Father.",
    r: "John 1:1\u201314; 1 Corinthians 15:3\u20134",
  },
  {
    t: "Salvation",
    b: "Salvation is a gift of God\u2019s grace, received through faith in Jesus Christ alone, not earned by our works.",
    r: "Ephesians 2:8\u20139",
  },
  {
    t: "The Holy Spirit",
    b: "The Holy Spirit lives in every believer, giving power to live for God, gifts to serve others, and guidance into truth.",
    r: "Acts 1:8; John 16:13",
  },
  {
    t: "The Church",
    b: "The Church is the body of Christ, made up of all believers, called to worship, grow together, and share the gospel.",
    r: "Ephesians 4:11\u201316",
  },
  {
    t: "Prayer and worship",
    b: "We pray and worship in the name of Jesus, the only name by which we are saved.",
    r: "John 14:13\u201314; Acts 4:12",
  },
  {
    t: "Christ\u2019s return",
    b: "Jesus will return, and God will make all things new.",
    r: "Revelation 21:1\u20135",
  },
];

const BELIEFS_INTRO =
  "In His Name Ministries exists to do everything in the name of Jesus Christ (Colossians 3:17). These are the beliefs that guide our ministry, the IHNM Show and everything we do.";

const HISTORY_NOTE =
  "We look at history and today\u2019s headlines through the lens of Scripture. Guests may hold a range of views on secondary matters. When they speak on our show, the conversation always comes back to the Word of God.";

function About() {
  return (
    <>
      <PageHeader image={panel} eyebrow="About" title="Why we gather">
        Scripture, history and today's headlines — talked through honestly, in front of a live
        audience.
      </PageHeader>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
        <div>
          <p className="eyebrow">— Mission</p>
          <h2 className="display-lg">
            Truth, told <span className="italic-gold">together</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Placeholder mission statement: IHNM Show exists to bring Scripture and history to bear
            on the questions people are asking today — with warmth, rigor and a room full of
            neighbors.
          </p>
          <p className="eyebrow mt-10">— Our story</p>
          <p className="mt-3 text-muted-foreground">
            Placeholder story: how the show began, the first taping, and how Studio A in San Jose
            became home.
          </p>
        </div>
        <img
          src={sitdown}
          alt="Host in conversation with a guest on the IHNM set"
          width={1280}
          height={720}
          loading="lazy"
          className="frame-gold h-full w-full rounded-3xl object-cover"
        />
      </section>
      <section className="bg-stage text-stage-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="eyebrow text-gold">— The team</p>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((p) => (
              <li key={p.n} className="border-t border-gold/40 pt-4">
                <p className="font-display text-2xl">{p.n}</p>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">{p.r}</p>
                <p className="mt-2 text-sm text-stage-foreground/80">{p.b}</p>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex gap-3">
            <Button asChild variant="gold">
              <a href="/#waitlist">Join the waitlist</a>
            </Button>
            <Button asChild variant="hero">
              <Link to="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 md:py-20">
        <p className="eyebrow">— What we believe</p>
        <h2 className="display-lg mt-4">
          What we <span className="italic-gold">believe</span>
        </h2>
        <p className="mt-5 max-w-3xl text-lg text-muted-foreground">{BELIEFS_INTRO}</p>

        <dl className="mt-10 space-y-7">
          {beliefs.map((item) => (
            <div key={item.t} className="border-t border-gold/40 pt-5">
              <dt className="font-display text-2xl">{item.t}</dt>
              <dd className="mt-2 text-muted-foreground">
                {item.b}{" "}
                <span className="whitespace-nowrap font-mono text-xs uppercase tracking-[0.15em] text-gold">
                  {item.r}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-12 rounded-3xl border border-gold/40 bg-secondary/60 p-6 sm:p-8">
          <h3 className="font-display text-2xl">How we talk about history and current events</h3>
          <p className="mt-3 text-muted-foreground">{HISTORY_NOTE}</p>
        </div>
      </section>
    </>
  );
}
