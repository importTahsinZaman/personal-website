import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Tahsin Zaman</title>
        <meta name="description" content="Tahsin Zaman" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tahsinzaman.com/" />
        <meta property="og:title" content="Tahsin Zaman" />
        <meta property="og:description" content="Tahsin Zaman" />
        <meta
          property="og:image"
          content="https://tahsinzaman.com/preview.png"
        />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://tahsinzaman.com/" />
        <meta property="twitter:title" content="Tahsin Zaman" />
        <meta property="twitter:description" content="Tahsin Zaman" />
        <meta
          property="twitter:image"
          content="https://tahsinzaman.com/preview.png"
        />
      </Head>
      <div className="container">
        <h1>Tahsin Zaman</h1>
        <p>
          Currently building agents for techops at{" "}
          <a href="https://a37.ai" target="_blank" rel="noopener noreferrer">
            a37
          </a>
          .
        </p>
        <p>
          My background lies in software engineering and robotics. I was
          studying AI and philosophy at MIT but have since dropped out to found
          a37.
        </p>
        <p>
          <a
            href="https://x.com/tahs1nz"
            target="_blank"
            rel="noopener noreferrer"
          >
            twitter
          </a>
          {", "}
          <a
            href="https://github.com/importTahsinZaman"
            target="_blank"
            rel="noopener noreferrer"
          >
            github
          </a>
          {", "}
          <a
            href="https://www.linkedin.com/in/tahsinzaman1/"
            target="_blank"
            rel="noopener noreferrer"
          >
            linkedin
          </a>
        </p>
      </div>
    </>
  );
}
