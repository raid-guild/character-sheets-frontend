import '@rainbow-me/rainbowkit/styles.css';

import { ChakraProvider } from '@chakra-ui/react';
import { Global } from '@emotion/react';
import { darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { Analytics } from '@vercel/analytics/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Provider } from 'urql';
import { WagmiConfig } from 'wagmi';

import { Layout } from '@/components/Layout';
import { ActionsProvider } from '@/contexts/ActionsContext';
import { GamesProvider } from '@/contexts/GamesContext';
import { client } from '@/graphql/client';
import { useGraphHealth } from '@/hooks/useGraphHealth';
import { chains, wagmiConfig } from '@/lib/web3';
import { globalStyles, theme } from '@/utils/theme';

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
        <title>CharacterSheets</title>
        <meta
          name="description"
          content="A gamified and on-chain representation of RaidGuild raiders."
        />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ChakraProvider resetCSS theme={theme}>
        <Global styles={globalStyles} />
        <Provider value={client}>
          <WagmiConfig config={wagmiConfig}>
            <RainbowKitProvider chains={chains} theme={darkTheme()}>
              <Analytics />
              <GamesProvider>
                <ActionsProvider>
                  <Layout>
                    <Component {...pageProps} />
                  </Layout>
                </ActionsProvider>
              </GamesProvider>
            </RainbowKitProvider>
          </WagmiConfig>
        </Provider>
      </ChakraProvider>
    </>
  );
}
