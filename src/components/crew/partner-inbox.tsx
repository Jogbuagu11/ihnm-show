import { Crud, Pill } from "@/components/finance/crud";
import { Button } from "@/components/ui/button";
import { PARTNER_INTERESTS } from "@/lib/waitlist";

/** Partner With Us submissions from the prelaunch page. */
export function PartnerInbox() {
  return (
    <div className="mt-4">
      <p className="text-sm text-muted-foreground">
        Sponsor inquiries from the Partner With Us form on the home page.
      </p>
      <Crud
        table="partner_inquiries"
        title="inquiry"
        fields={[
          { k: "name", label: "Name", required: true },
          { k: "business", label: "Business" },
          { k: "email", label: "Email", type: "email", required: true },
          { k: "phone", label: "Phone" },
          { k: "interest", label: "Interest", type: "select", options: [...PARTNER_INTERESTS] },
          { k: "status", label: "Status", type: "select", options: ["new", "replied", "closed"] },
          { k: "message", label: "Message", type: "textarea" },
          { k: "admin_note", label: "Internal note", type: "textarea" },
        ]}
        columns={(r) => (
          <>
            <span className="font-semibold">{r.name}</span>
            <Pill tone={r.status === "new" ? "warn" : "muted"}>{r.interest}</Pill>
            {r.status !== "new" && <Pill>{r.status}</Pill>}
            <span className="block text-xs text-muted-foreground">
              {r.business ? `${r.business} · ` : ""}
              {r.message ? String(r.message).slice(0, 160) : r.email}
            </span>
          </>
        )}
        actions={(r) => (
          <Button asChild size="sm" variant="outline">
            <a
              href={`mailto:${r.email}?subject=${encodeURIComponent("Re: partnering with IHNM Show")}`}
            >
              Reply
            </a>
          </Button>
        )}
      />
    </div>
  );
}
