import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
export const metadata: Metadata = { title: "LedgerCrew AI", description: "diagnostic" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Script id="theme-init" strategy="beforeInteractive">{`try{var t=localStorage.getItem('lc-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}`}</Script>
        {children}
      </body>
    </html>
  );
}
