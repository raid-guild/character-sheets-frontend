import '@rainbow-me/rainbowkit/styles.css';
import '@fontsource/unbounded/200.css';
import '@fontsource/unbounded/300.css';
import '@fontsource/unbounded/400.css';
import '@fontsource/unbounded/500.css';
import '@fontsource/unbounded/600.css';
import '@fontsource/unbounded/700.css';
import '@fontsource/unbounded/800.css';
import '@fontsource/unbounded/900.css';
import '@fontsource/tektur/400.css';
import '@fontsource/tektur/500.css';
import '@fontsource/tektur/600.css';
import '@fontsource/tektur/700.css';
import '@fontsource/tektur/800.css';
import '@fontsource/tektur/900.css';
import '@/styles.css';

import { ChakraProvider } from '@chakra-ui/react';
import { Global } from '@emotion/react';
import { darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { Analytics } from '@vercel/analytics/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Provider } from 'urql';
import { WagmiConfig } from 'wagmi';

import { Layout } from '@/components/Layout';
import { GamesProvider } from '@/contexts/GamesContext';
import { client } from '@/graphql/client';
import { useGraphHealth } from '@/hooks/useGraphHealth';
import { DEFAULT_CHAIN, wagmiConfig } from '@/lib/web3';
import { globalStyles, theme } from '@/utils/theme';

const TITLE = 'CharacterSheets';
const DESCRIPTION =
  'Build a character through your work as a web3 mercenary. Slay moloch, earn XP.';
const BASE_URL = 'https://character-sheets.vercel.app';

export default function App({
  Component,
  pageProps,
}: {
  Component: AppProps['Component'];
  pageProps: AppProps['pageProps'];
}): JSX.Element {
  useGraphHealth();

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta
          name="keywords"
          content="character, sheets, charactersheets, raidguild, raids, guild, dnd, dungeons, dragons, dungeons and dragons, rpg, roleplaying"
        />
        <link rel="canonical" href={BASE_URL} />
        <meta property="og:site_name" content={TITLE} />
        <meta property="og:url" content={BASE_URL} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:image" content={`${BASE_URL}/logo_square.png`} />
        <meta property="og:type" content="app" />
        <meta name="twitter:url" content={BASE_URL} />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:image" content={`${BASE_URL}/logo_square.png`} />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ChakraProvider resetCSS theme={theme}>
        <Global styles={globalStyles} />
        <Provider value={client}>
          <WagmiConfig config={wagmiConfig}>
            <RainbowKitProvider chains={[DEFAULT_CHAIN]} theme={darkTheme()}>
              <Analytics />
              <GamesProvider>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </GamesProvider>
            </RainbowKitProvider>
          </WagmiConfig>
        </Provider>
      </ChakraProvider>
    </>
  );
}
