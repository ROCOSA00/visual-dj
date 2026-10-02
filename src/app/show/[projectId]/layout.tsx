import type { Metadata } from "next";

export const metadata: Metadata = { title: "Show Mode" };

export default function ShowLayout({ children }: { children: React.ReactNode }) {
  return children;
}
