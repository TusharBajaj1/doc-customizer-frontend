import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request a tool or feature",
  description: "Tell us which document tool or feature you want next. Requests are public and shape the roadmap.",
  alternates: { canonical: "/request" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
