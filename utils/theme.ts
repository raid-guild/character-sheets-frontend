import { extendTheme } from '@chakra-ui/react';
import { css } from '@emotion/react';

export const globalStyles = css`
body {
  background: #171923;
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
