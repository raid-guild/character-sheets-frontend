import Document, { Head, Html, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render(): JSX.Element {
    return (
      <Html lang="en">
        <Head />
        <body id="body">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
