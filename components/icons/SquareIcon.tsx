import { createIcon } from '@chakra-ui/react';

export const SquareIcon = createIcon({
  displayName: 'SquareIcon',
  viewBox: '0 0 12 12',
  path: (
    <rect
      x="1"
      y="1"
      width="10"
      height="10"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  ),
});
