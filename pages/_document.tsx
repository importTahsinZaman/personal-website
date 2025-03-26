import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#0D1117" />
        <meta
          name="description"
          content="Tahsin Zaman's terminal-themed personal website"
        />
        <meta property="og:title" content="Tahsin Zaman | Terminal" />
        <meta
          property="og:description"
          content="An interactive terminal-themed personal website"
        />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/logo.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
