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
        background: 'gray.100',
      },
      _active: {
        transform: 'scale(0.98)',
      },
    },
  },
};

const FormLabel = {
  baseStyle: {
    fontWeight: 300,
  },
};

const Input = {
  variants: {
    outline: {
      field: {
        border: '2px solid',
        borderColor: 'black',
        borderRadius: 0,
        background: 'white',
        fontSize: '12px',

        _hover: {
          background: 'gray.100',
          borderColor: 'black',
        },
      },
    },
    file: {
      field: {
        cursor: 'pointer',
        p: 0,
      },
      addon: {
        cursor: 'pointer',
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

const Modal = {
  defaultProps: {
    scrollBehavior: 'inside',
  },
  baseStyle: {
    dialogContainer: {
      overflow: 'hidden',
    },
    dialog: {
      background: 'white',
      border: '3px solid black',
      borderRadius: 0,
      maxH: { base: '100%', md: 'calc(100% - 7.5rem)' },
      minW: { base: '100%', md: '800px' },
      maxW: { base: '100%', md: '800px' },
    },
    header: {
      borderBottom: '3px solid black',
      textAlign: 'center',
    },
    body: {
      px: 20,
      py: 6,
      overflow: 'auto',
    },
  },
};

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

const Tooltip = {
  baseStyle: {
    background: 'black',
    borderRadius: 0,
    color: 'white',
    fontWeight: 300,
    p: 4,
  },
};

export const theme = extendTheme({
  config: { initialColorMode: 'light', useSystemColorMode: false },
  components: {
    Button,
    FormLabel,
    Input,
    Link,
    Modal,
    Text,
    Tooltip,
  },
});
