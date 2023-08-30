import { extendTheme } from '@chakra-ui/react';
import { css } from '@emotion/react';

export const globalStyles = css`
  body {
    font-family: 'Orbitron', sans-serif;
    font-size: 1rem;
    background: #fff;
    color: #000;
  }
`;

const Text = {
  defaultProps: {
    variant: 'paragraph',
  },
  variants: {
    paragraph: {
      fontFamily: `'Orbitron', sans-serif`,
    },
    heading: {
      fontFamily: `'Press Start 2P', cursive`,
    },
  },
};

const Link = {
  defaultProps: {
    variant: 'paragraph',
  },
  variants: {
    paragraph: {
      fontFamily: `'Orbitron', sans-serif`,
    },
    heading: {
      fontFamily: `'Press Start 2P', cursive`,
    },
  },
};

export const theme = extendTheme({
  config: { initialColorMode: 'light', useSystemColorMode: false },
  components: {
    Link,
    Text,
  },
});
