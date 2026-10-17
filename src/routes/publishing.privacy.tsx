import { createFileRoute } from "@tanstack/react-router";
import { IMPRINT, OPERATOR } from "@/lib/publishing";

export const Route = createFileRoute("/publishing/privacy")({
  head: () => ({
    meta: [
      { title: `Privacy Policy — ${IMPRINT}` },
      { name: "description", content: `How ${IMPRINT} handles your information.` },
    ],
  }),
  component: () => (
    <section className="mx-auto max-w-3xl space-y-5 px-4 py-14 leading-relaxed [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl">
      <p className="eyebrow">— Legal</p>
      <h1 className="display-lg">Privacy Policy</h1>
      <p className="eyebrow">Last updated: 17 October 2026</p>
      <p>
        {IMPRINT} is an imprint operated by {OPERATOR}. This covers this site and the forms on it.
        We do not sell your information.
      </p>

      <h2>When you submit a manuscript</h2>
      <p>
        We keep your name, email, phone number if you give one, what you tell us about your book and
        yourself, and the file you upload. Your manuscript is stored privately and is readable only
        by the people reading submissions for us. It is never public.
      </p>
      <p>
        If we decline your work, we delete the manuscript and its file six months after we reply. If
        we publish it, we keep what the contract requires.
      </p>

      <h2>When you contact us</h2>
      <p>
        Your name, email, organisation if given, and your message — kept so we can reply and for our
        records.
      </p>

      <h2>Automatically</h2>
      <p>
        Which pages are viewed and roughly where visitors came from, against a random session
        identifier rather than your name.
      </p>

      <h2>Who else handles it</h2>
      <p>
        Supabase stores the database and files, Vercel hosts the site, and Resend delivers our
        email. They process it on our behalf and for nothing else.
      </p>

      <h2>Your choices</h2>
      <p>
        Ask us for a copy of what we hold, ask us to correct it, or ask us to delete it, and we
        will. If you are a California resident you have these rights under the CCPA, and we will not
        treat you differently for using them.
      </p>
    </section>
  ),
});
