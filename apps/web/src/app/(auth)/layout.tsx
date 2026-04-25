import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication – Fitness App",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

