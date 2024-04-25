import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CSPostHogProvider } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mock YC Interview with AI Partner | Practice YC Interview",
  description:
    "Get the best practice for your YC interview with our mock YC interview featuring an AI partner. Improve your interview skills and get ready for Y Combinator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const canonicalUrl = `${process.env.NEXT_PUBLIC_BASE_URL}`;

  return (
    <html lang='en'>
      <CSPostHogProvider>
        <head>
          <title>{metadata.title as React.ReactNode}</title>
          <meta name='description' content={metadata.description} />
          <link rel='canonical' href={canonicalUrl} />
          <meta property='og:title' content={metadata.title.toString()} />
          <meta property='og:description' content={metadata.description} />
          <meta property='og:url' content={canonicalUrl} />
          <meta property='og:site_name' content='Mock YC Interview' />
          <meta property='og:image' content={`${canonicalUrl}/icon.jpeg`} />
          <link
            rel='icon'
            type='image/x-icon'
            href={`${canonicalUrl}/favicon.ico`}
          />
        </head>
        <body className={inter.className}>{children}</body>
      </CSPostHogProvider>
    </html>
  );
}
