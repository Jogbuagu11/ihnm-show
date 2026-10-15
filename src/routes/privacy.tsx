import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () =>
    legalHead("Privacy Policy", "What IHNM Show collects, why, and how to get it removed."),
  component: Privacy,
});

// Written to match what the site actually stores. If the waitlist form or the
// inquiry forms change, this needs changing with them.
function Privacy() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="What we collect, why we collect it, and how to get it removed."
      updated="15 October 2026"
    >
      <p>
        IHNM Show is produced in San Jose, California. This policy covers ihnmshow.com and the
        waitlist, inquiry and account forms on it. We do not sell your information, and we do not
        share it for advertising.
      </p>

      <h2>What we collect</h2>
      <p>
        <strong>When you join the waitlist:</strong> your first and last name, email address, and —
        only if you choose to give them — your mobile number and ZIP code. We also record how you
        heard about us, whether you're bringing a church group and that group's name if you tell us,
        and the referral code of whoever invited you, so we can credit them.
      </p>
      <p>
        <strong>When you contact us or ask about sponsorship or studio hire:</strong> your name,
        email, phone number, business or organisation where given, and whatever you write in the
        message.
      </p>
      <p>
        <strong>If you create an account:</strong> your email address and a password, which is
        stored hashed and is never visible to us.
      </p>
      <p>
        <strong>Automatically:</strong> which pages are viewed and roughly where visitors arrived
        from, kept against a random session identifier rather than your name. If you reach us from a
        campaign link we keep the campaign tags in that link, so we know which post worked.
      </p>

      <h2>Text messages</h2>
      <p>
        We only text you if you tick the box asking us to. Messages are about tapings and ticket
        drops and go out occasionally, not on a schedule. Message and data rates may apply. Reply{" "}
        <strong>STOP</strong> to any message to stop them, or <strong>HELP</strong> for help.
        Stopping texts does not remove you from the waitlist, and we do not share your number with
        anyone for their own marketing.
      </p>

      <h2>Your referral link</h2>
      <p>
        Everyone on the waitlist gets a personal link. If you share it and someone joins through it,
        we record that they came from you so we can move you up the list. People who join through
        your link are not told who you are, and you are not told who they are — you only see how
        many have joined.
      </p>

      <h2>Who else handles it</h2>
      <p>
        We use a small number of providers to run the site, and they only process your information
        on our behalf: <strong>Supabase</strong> stores the database and accounts,{" "}
        <strong>Vercel</strong> hosts the website, and <strong>Resend</strong> delivers our emails.
        If you subscribe to the newsletter, that runs on <strong>Substack</strong> under their own
        policy. If site analytics are switched on, aggregate traffic statistics are processed by{" "}
        <strong>Google Analytics</strong>.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Waitlist entries are kept until you ask us to remove them or the show stops running a
        waitlist. Inquiries are kept while we deal with them and for our records afterwards.
        Anonymous page statistics are kept in aggregate.
      </p>

      <h2>Your choices</h2>
      <p>
        Every email we send has an unsubscribe link, and any text can be stopped by replying STOP.
        You can ask us for a copy of what we hold about you, ask us to correct it, or ask us to
        delete it entirely — email us and we will action it. If you are a California resident, you
        have these rights under the CCPA, and we will not treat you differently for using them.
      </p>

      <h2>Children</h2>
      <p>
        The waitlist is intended for adults. We do not knowingly collect information from children
        under 13. If you believe a child has given us their details, contact us and we will remove
        them.
      </p>

      <h2>Contact</h2>
      <p>
        Questions, or want your information removed? Use the{" "}
        <a href="/contact" className="underline hover:text-gold">
          contact form
        </a>{" "}
        and we will reply by email.
      </p>
    </LegalPage>
  );
}
