import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/dm-sans/400.css";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Gitmancer — Your contributions. Your character.",
    template: "%s · Gitmancer",
  },
  description:
    "Summon an original fantasy trading card from your public GitHub contributions.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
        <footer className="site-footer">
          <span>
            GITMANCER <span className="muted">/ A little everyday magic.</span>
          </span>
          <span>Made of contributions, not comparisons.</span>
          <a href="https://github.com/GadDev/gitmancer">
            View the project on GitHub ›
          </a>
        </footer>
      </body>
    </html>
  );
}
