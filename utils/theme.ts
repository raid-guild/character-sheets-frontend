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
  sizes: {
    sm: {
      fontSize: '12px',
      w: '100px',
    },
    md: {
      fontSize: '16px',
      h: '50px',
      w: '180px',
    },
  },
  variants: {
    ghost: {
      color: 'black',
      background: 'white',
      borderBottom: '5px solid',
      borderLeft: '3px solid',
      borderRadius: '0',
      borderRight: '5px solid',
      borderTop: '3px solid',
      borderColor: 'white',
      _hover: {
        background: 'gray.300',
        borderColor: 'gray.300',
      },
      _active: {
        background: 'gray.300',
        borderColor: 'gray.300',
        transform: 'scale(0.98)',
        _disabled: {
          transform: 'scale(1)',
        },
      },
    },
    outline: {
      color: 'black',
      borderBottom: '5px solid black',
      borderLeft: '3px solid black',
      borderRadius: '0',
      borderRight: '5px solid black',
      borderTop: '3px solid black',
      borderColor: 'white',
      _hover: {
        background: 'gray.100',
      },
      _active: {
        transform: 'scale(0.98)',
        _disabled: {
          transform: 'scale(1)',
        },
      },
    },
    solid: {
      color: 'white',
      background: 'black',
      borderBottom: '5px solid black',
      borderLeft: '3px solid black',
      borderRadius: '0',
      borderRight: '5px solid black',
      borderTop: '3px solid black',
      _hover: {
        background: 'gray.700',
      },
      _active: {
        background: 'gray.700',
        transform: 'scale(0.98)',
        _disabled: {
          transform: 'scale(1)',
        },
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

const Menu = {
  baseStyle: {
    list: {
      background: 'white',
      border: '3px solid black',
      borderRadius: 0,
    },
    item: {
      background: 'white',
      _hover: {
        background: 'black',
        color: 'white',
      },
      _active: {
        background: 'black',
        color: 'white',
      },
      _focus: {
        background: 'black',
        color: 'white',
      },
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
    closeButton: {
      mt: 1,
      size: 'xl',
      _hover: {
        borderRadius: 0,
        boxShadow: '0 0 1px 1px rgba(0, 0, 0, 0.1)',
      },
    },
    body: {
      px: 24,
      py: 10,
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

const Textarea = {
  variants: {
    outline: {
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
    Menu,
    Modal,
    Text,
    Textarea,
    Tooltip,
  },
});
