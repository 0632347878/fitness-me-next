import type { Metadata } from "next";
import { PresaleLanding } from "@/features/marketing/components/PresaleLanding";

export const metadata: Metadata = {
  title: "Repwise — reserve a founding spot",
  description:
    "Repwise is a workout app with science-backed programs and a bilingual exercise library, built solo and in the open. Reserve founding-member access.",
  openGraph: {
    title: "Repwise — reserve a founding spot",
    description:
      "Science-backed workout programs and a bilingual exercise library. Founding-member pricing, locked in.",
  },
};

export default function PresalePage() {
  return <PresaleLanding />;
}
