import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "StudentBlog",
  description: "A blogging platform built by and for students",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 font-sans">
        <Providers>
          <Nav />
          <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
