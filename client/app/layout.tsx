import type { ReactNode } from "react";

export const metadata = { title: "Auth App" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", maxWidth: 400, margin: "60px auto", padding: "0 16px" }}>
        {children}
      </body>
    </html>
  );
}
