import { ChakraProvider } from '@raidguild/design-system';
import type { AppProps } from 'next/app';
import Head from 'next/head';

import { Layout } from '@/components/Layout';

export default function App({
  Component,
  pageProps,
}: {
  Component: AppProps['Component'];
  pageProps: AppProps['pageProps'];
}): JSX.Element {
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
      <ChakraProvider resetCSS>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ChakraProvider>
    </>
  );
}
