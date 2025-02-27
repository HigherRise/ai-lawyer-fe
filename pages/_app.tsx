import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <main className="scroll-smooth antialiased [font-feature-settings:'ss01']">
      <ChakraProvider>
        <Component {...pageProps} />
      </ChakraProvider>
    </main>
  );
}

export default MyApp;
