import { createFileRoute, redirect } from "@tanstack/react-router";
import { pubHowHead, HowItWorks } from "./publishing.how-it-works";
import { isBooksSite } from "@/lib/site";

export const Route = createFileRoute("/how-it-works")({
  beforeLoad: () => {
    if (!isBooksSite()) throw redirect({ href: "/publishing/how-it-works" });
  },
  head: pubHowHead,
  component: HowItWorks,
});
