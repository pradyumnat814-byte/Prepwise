import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Technical Interviewer",
  description: "Autonomous, voice-first technical interview platform powered by local AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const theme = localStorage.getItem("theme");
                  if (theme === "light") {
                    document.documentElement.classList.remove("dark");
                  }
                } catch {}
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}