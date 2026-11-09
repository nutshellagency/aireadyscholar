import "./globals.css";

export const metadata = {
  title: "AI-Ready Scholar · Research Connector",
  description:
    "Ethical, evidence-linked AI assistance for English literature and linguistics scholars in Pakistan: a free research connector, skills and the AI-Ready Scholar course.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,600&family=Manrope:wght@400;600&family=JetBrains+Mono:wght@400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
