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

    _active: {
      background: '#2D3748',
      transform: 'scale(0.98)',
      _disabled: {
        transform: 'scale(1)',
      },
    },

  },
  defaultProps: {
    variant: 'outline',
    // _hover: {
    //   transform: 'scale(1.1)',

    // },
  },
  sizes: {
    xs: {
      fontSize: '12px',
      h: 'auto',
      pt:'2',
      pb: '2',
      px: '6',
    },
    sm: {
      fontSize: '14px',
      h: 'auto',
      pt:'2',
      pb: '2',
      px: '6'
    },
    md: {
      fontSize: '16px',
      lineHeight: '20px',
      h: 'auto',
      pt:'2',
      pb: '3',
      px: '6'
    },
    lg: {
      fontSize: '18px',
      lineHeight: '22px',
      h: 'auto',
      py:'14px',
      px: '45px'
    },
  },
  variants: {
    outline: {
      color: 'white',
      borderBottom: '3px solid white',
      borderLeft: '1px solid white',
      borderRadius: '0',
      borderRight: '3px solid white',
      borderTop: '1px solid white',
      borderColor: 'white',
      _hover: {
        borderColor: 'accent',
        color: 'accent',
        bg: 'dark'
      },
      // _active: {
      //   transform: 'scale(0.98)',
      //   _disabled: {
      //     transform: 'scale(1)',
      //   },
      // },
    },
    solid: {
      color: 'dark',
      background: 'white',
      borderRadius: '0',
      borderColor: 'white',
      _hover: {
        bg: 'accent',
      },

    },
  },
};
const FormLabel = {
  baseStyle: {
    fontWeight: 300,
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
    }
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

const Switch = {
  baseStyle: {
    track: {
      background: 'gray.400',
      borderRadius: '10%',
      height: '14px',

      _checked: {
        background: 'black',
      },
    },
    thumb: {
      height: '100%',
      w: '40%',

      _checked: {
        transform: 'translateX(18px)',
      },
    },
  },
};

const Text = {
  baseStyle: {
    fontWeight: 300
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
  colors: {
    dark: '#171922',
    accent: '#a9c8eb',
    softgreen: "#79BA87",
    softpurple: "#9087B5"
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
