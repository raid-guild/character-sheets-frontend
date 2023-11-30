import {
  Image,
  ImageProps,
  Stack,
  StackProps,
  Text,
  TextProps,
} from '@chakra-ui/react';

import {
  getChainImageFromId,
  getChainLabelFromId,
  isSupportedChain,
} from '@/lib/web3';

export const NetworkDisplay: React.FC<
  {
    chainId: number;
    imageProps?: ImageProps;
    textProps?: TextProps;
  } & StackProps
> = ({ chainId, imageProps, textProps, ...props }) => {
  if (!isSupportedChain(chainId)) return null;

  const image = getChainImageFromId(chainId);
  const label = getChainLabelFromId(chainId);

  return (
    <Stack direction="row" align="center" color="white" {...props}>
      <Image src={image} alt={label} boxSize="1.5rem" {...imageProps} />
      <Text
        as="span"
        textTransform="uppercase"
        fontSize="2xs"
        letterSpacing="1px"
        fontWeight="400"
        {...textProps}
      >
        {label}
      </Text>
    </Stack>
  );
};
