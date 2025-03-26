import "../styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import themes from "../public/themes.json";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Set default theme from themes.json
    const defaultTheme = themes.activeTheme || "NeonNight";
    const theme = themes.themes.find((t) => t.name === defaultTheme);

    if (theme) {
      Object.entries(theme.colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}`, value);
      });
    }
  }, []);

  return <Component {...pageProps} />;
}
