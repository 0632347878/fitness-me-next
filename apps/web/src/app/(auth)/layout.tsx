import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication – FitMe",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#0d0d12",
        display: "flex",
        flexDirection: "column",
        padding: "36px 24px 28px",
        overflowY: "auto",
      }}
    >
      {children}
    </div>
  );
}
