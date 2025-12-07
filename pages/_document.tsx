import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Application Name */}
        <meta name="application-name" content="Vibe" />

        {/* Theme Color */}
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />

        {/* iOS Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Vibe" />


        {/* iOS Icons */}
        <link
          rel="apple-touch-icon"
          sizes="192x192"
          href="/icons/icon-192.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="512x512"
          href="/icons/icon-512.png"
        />

        {/* Favicon */}
        <link rel="icon" href="/icons/icon-192.png" />

        {/* Service Worker Registration */}
        <script src="/register-sw.js" defer></script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

