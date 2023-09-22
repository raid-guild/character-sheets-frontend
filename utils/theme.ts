import { extendTheme } from '@chakra-ui/react';
import { css } from '@emotion/react';

export const globalStyles = css`
body {
  background: radial-gradient(97.27% 170.54% at 98.7% 2.73%, rgb(36, 0, 58) 0%, rgba(26, 32, 44, 100) 100%);
}

::-webkit-scrollbar {
  display:none
}
`;

export const theme = extendTheme({
  config: { initialColorMode: 'light', useSystemColorMode: false },
  colors: {
    gold: {
      100: '#FFFAE2',
      400: '#DBB865',
    },
  },
  components: {
  },
});
