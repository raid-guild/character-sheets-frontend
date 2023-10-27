import { extendTheme } from '@chakra-ui/react';
import { css } from '@emotion/react';

export const globalStyles = css`
  body {
    font-family: 'Unbounded', sans-serif;
    font-size: 1rem;
    background: #171922;
    color: #fff;
  }
`;

const Button = {
  baseStyle: {
    borderRadius: 0,
    _active: {
      transform: 'scale(0.98)',
      _disabled: {
        transform: 'scale(1)',
      },
    },
  },
  defaultProps: {
    variant: 'outline',
  },
  sizes: {
    xs: {
      fontSize: '12px',
      h: 'auto',
      pb: '2',
      pt: '2',
      px: '6',
    },
    sm: {
      fontSize: '14px',
      h: 'auto',
      pb: '2',
      pt: '2',
      px: '6',
    },
    md: {
      fontSize: '16px',
      h: 'auto',
      lineHeight: '20px',
      pt: '2',
      pb: '3',
      px: '6',
    },
    lg: {
      fontSize: '18px',
      lineHeight: '22px',
      h: 'auto',
      py: '14px',
      px: '45px',
    },
  },
  variants: {
    outline: {
      color: 'white',
      borderColor: 'white',
      borderBottom: '3px solid white',
      borderLeft: '1px solid white',
      borderRadius: '0',
      borderRight: '3px solid white',
      borderTop: '1px solid white',
      _hover: {
        borderColor: 'accent',
        color: 'accent',
        bg: 'dark',
      },
      _active: {
        borderColor: 'accent',
        bg: 'accent',
        color: 'dark',
      },
    },
    solid: {
      background: 'white',
      borderColor: 'white',
      borderRadius: '0',
      color: 'dark',
      _hover: {
        bg: 'accent',
      },
      _active: {
        bg: 'accent',
      },
    },
    ghost: {
      background: 'transparent',
      borderRadius: '0',
      color: 'white',
      _hover: {
        bg: 'accent',
        color: 'dark',
      },
    },
  },
};
const FormLabel = {
  baseStyle: {
    fontWeight: 500,
    fontSize: 'sm',
  },
};

const Heading = {
  baseStyle: {
    fontWeight: 400,
  },
  defaultProps: {
    variant: 'primary',
  },
  variants: {
    primary: {
      fontFamily: `'Unbounded', sans-serif`,
    },
  },
};

const Input = {
  variants: {
    outline: {
      field: {
        background: 'cardBG',
        border: '1px solid',
        borderRadius: '6px',
        borderColor: 'white',
        height: '50px',

        _hover: {
          borderColor: 'accent',
        },

        _active: {
          borderColor: 'accent',
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
    _hover: {
      color: 'accent',
    },
  },
  variants: {
    paragraph: {
      fontFamily: `'Unbounded', sans-serif`,
    },
    heading: {
      fontFamily: `'Unbounded', sans-serif`,
    },
  },
};

const Menu = {
  baseStyle: {
    list: {
      background: 'white',
      border: '3px solid black',
      borderRadius: 0,
      color: 'black',
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
      background: 'dark',
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

const Switch = {
  baseStyle: {
    track: {
      alignItems: 'center',
      background: 'cardBG',
      border: '1px solid white',
      borderRadius: '50px',
      h: '14px',
      w: '40px',

      _checked: {
        background: 'cardBG',
      },
    },
    thumb: {
      background: 'accent',
      h: '11px',
      ml: '3px',
      w: '11px',

      _checked: {
        transform: 'translateX(23px)',
      },
    },
  },
};

const Text = {
  baseStyle: {
    fontWeight: 300,
  },
  defaultProps: {
    variant: 'primary',
  },
  variants: {
    primary: {
      fontFamily: `'Unbounded', sans-serif`,
    },
    secondary: {
      fontFamily: `'Unbounded', sans-serif`,
    },
  },
};

const Textarea = {
  variants: {
    outline: {
      background: 'cardBG',
      border: '1px solid',
      borderRadius: '6px',
      borderColor: 'white',
      height: '150px',

      _hover: {
        borderColor: 'accent',
      },

      _active: {
        borderColor: 'accent',
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
  fonts: {
    body: `'Unbounded', sans-serif`,
    heading: `'Unbounded', sans-serif`,
    mono: `'Tektur', monospace`,
  },
  colors: {
    dark: '#171922',
    cardBG: '#11131A',
    accent: '#a9c8eb',
    softgreen: '#79BA87',
    softpurple: '#9087B5',
    softyellow: '#FFEBA4',
    softblue: '#7B91DD',
    softorange: '#BA9179',
    // gold: {
    //   100: '#FFFAE2',
    //   400: '#DBB865',
    // },
  },
  components: {
    Button,
    FormLabel,
    Heading,
    Input,
    Link,
    Menu,
    Modal,
    Switch,
    Text,
    Textarea,
    Tooltip,
  },
});
