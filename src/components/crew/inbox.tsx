import { Crud, Pill } from "@/components/finance/crud";
import { Button } from "@/components/ui/button";

export const CONTACT_TOPICS = ["tickets", "rentals", "sponsors", "press", "general"] as const;

export function Inbox() {
  return (
    <div className="mt-4">
      <p className="text-sm text-muted-foreground">
        Contact form messages and sponsor inquiries, sorted by topic.
      </p>
      <Crud
        table="contact_messages"
        title="message"
        fields={[
          { k: "topic", label: "Topic", type: "select", options: CONTACT_TOPICS },
          { k: "name", label: "Name", required: true },
          { k: "email", label: "Email", type: "email", required: true },
          { k: "phone", label: "Phone" },
          { k: "organization", label: "Organization" },
          { k: "status", label: "Status", type: "select", options: ["new", "replied", "closed"] },
          { k: "message", label: "Message", type: "textarea", required: true },
        ]}
        columns={(r) => (
          <>
            <span className="font-semibold">{r.name}</span>
            <Pill tone={r.status === "new" ? "warn" : "muted"}>{r.topic}</Pill>
            {r.status !== "new" && <Pill>{r.status}</Pill>}
            <span className="block text-xs text-muted-foreground">
              {r.organization ? `${r.organization} · ` : ""}
              {String(r.message).slice(0, 160)}
            </span>
          </>
        )}
        actions={(r) => (
          <Button asChild size="sm" variant="outline">
            <a
              href={`mailto:${r.email}?subject=${encodeURIComponent("Re: your message to IHNM Show")}`}
            >
              Reply
            </a>
          </Button>
        )}
      />
    </div>
  );
}
