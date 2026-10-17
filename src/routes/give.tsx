import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Landmark, Mail, Smartphone } from "lucide-react";
import worship from "@/assets/worship.jpg";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { siteSettingsQuery } from "@/lib/settings";

export const Route = createFileRoute("/give")({
  head: () => ({
    meta: [
      { title: "Give — IHNM Show" },
      {
        name: "description",
        content:
          "Support In His Name Ministries. Gifts keep the show, the studio and the live audience running.",
      },
      { property: "og:title", content: "Give — IHNM Show" },
      {
        property: "og:description",
        content: "Help bring Scripture, history and today's headlines to more people.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Give,
});

const DEFAULT_BLURB =
  "Every gift keeps the lights on at Studio A: the room, the cameras, the worship team, and the free seats that let neighbours be part of a taping. Nothing is asked in return.";

function Give() {
  const { data: settings, isLoading } = useQuery(siteSettingsQuery);

  const zelle = settings?.giving_zelle?.trim();
  const payableTo = settings?.giving_check_payable_to?.trim();
  const address = settings?.giving_mailing_address?.trim();
  const online = settings?.giving_online_enabled ?? false;
  const hasAnyMethod = Boolean(zelle || payableTo || online);

  return (
    <>
      <PageHeader image={worship} eyebrow="Support the ministry" title="Give">
        A gift, with nothing asked in return.
      </PageHeader>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <p className="text-lg text-muted-foreground">
          {settings?.giving_blurb?.trim() || DEFAULT_BLURB}
        </p>

        {isLoading ? null : hasAnyMethod ? (
          <>
            <p className="eyebrow mt-12">— Ways to give</p>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {online && (
                <li className="rounded-3xl border bg-white p-6">
                  <span className="flex size-11 items-center justify-center rounded-full bg-gold/15 text-gold">
                    <CreditCard className="size-5" aria-hidden />
                  </span>
                  <h2 className="mt-5 font-display text-2xl">Card or Apple Pay</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Give securely online in a few seconds.
                  </p>
                  <Button asChild variant="gold" className="mt-4">
                    <a href="/give/online">Give online</a>
                  </Button>
                </li>
              )}

              {zelle && (
                <li className="rounded-3xl border bg-white p-6">
                  <span className="flex size-11 items-center justify-center rounded-full bg-gold/15 text-gold">
                    <Smartphone className="size-5" aria-hidden />
                  </span>
                  <h2 className="mt-5 font-display text-2xl">Zelle</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Send straight from your bank, with no processing fee taken out of your gift.
                  </p>
                  <p className="mt-3 font-mono text-sm break-all text-walnut">{zelle}</p>
                </li>
              )}

              {payableTo && (
                <li className="rounded-3xl border bg-white p-6 sm:col-span-2">
                  <span className="flex size-11 items-center justify-center rounded-full bg-gold/15 text-gold">
                    <Mail className="size-5" aria-hidden />
                  </span>
                  <h2 className="mt-5 font-display text-2xl">Cheque</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Make it payable to <strong className="text-foreground">{payableTo}</strong>.
                  </p>
                  {address && (
                    <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                      {address}
                    </p>
                  )}
                </li>
              )}
            </ul>
          </>
        ) : (
          <div className="mt-10 rounded-3xl border border-gold/50 bg-secondary/60 p-6">
            <h2 className="font-display text-2xl">Giving opens soon</h2>
            <p className="mt-2 text-muted-foreground">
              We're setting up giving now. Join the waitlist and we'll tell you the moment it opens.
            </p>
            <Button asChild variant="gold" className="mt-5">
              <Link to="/">Join the waitlist</Link>
            </Button>
          </div>
        )}

        {/* The determination letter has not arrived, so this must not promise a
            deduction. People giving to a ministry usually assume one. */}
        <div className="mt-12 flex gap-4 rounded-3xl border bg-card p-6">
          <Landmark className="mt-1 size-5 shrink-0 text-gold" aria-hidden />
          <div>
            <h2 className="font-display text-xl">About tax deductibility</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              In His Name Ministries is a nonprofit ministry with{" "}
              <strong className="text-foreground [font-variant-ligatures:none]">
                501(c)(3) status pending
              </strong>
              . We will send a receipt for every gift. Whether a gift is tax-deductible depends on
              the IRS granting exemption, so please don't rely on a deduction until that comes
              through — we'll let our givers know when it does.
            </p>
          </div>
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Giving as a business?{" "}
          <Link to="/partner" className="underline hover:text-gold">
            Sponsorship and in-kind partnership
          </Link>{" "}
          may suit you better.
        </p>
      </section>
    </>
  );
}
