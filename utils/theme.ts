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

const Button = {
  defaultProps: {
    variant: 'outline',
  },
  variants: {
    outline: {
      color: 'black',
      borderBottom: '5px solid black',
      borderLeft: '3px solid black',
      borderRadius: '0',
      borderRight: '5px solid black',
      borderTop: '3px solid black',
      borderColor: 'white',
      h: '50px',
      w: '180px',
      _hover: {
        bgColor: 'gray.100',
      },
    },
  },
};

const Link = {
  defaultProps: {
    variant: 'paragraph',
  },
  baseStyle: {
    py: 1,
    px: 2,
    _hover: {
      boxShadow: '0 0 1px 1px rgba(0, 0, 0, 0.1)',
      textDecoration: 'none',
    },
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
    Button,
    Link,
    Text,
  },
});
