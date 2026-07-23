import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MacTor Invoices",
  description: "Sistema de facturación y estimados — MACTOR Construction Toronto",
};

export default function InvoicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
