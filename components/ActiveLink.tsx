import { Box, Link, LinkProps } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

export const ActiveLink: React.FC<LinkProps> = ({ href, ...props }) => {
  const { pathname } = useRouter();
  const isActive = pathname === href;

  return (
    <Link
      as={NextLink}
      color={isActive ? 'accent' : 'inherit'}
      fontSize="sm"
      fontWeight="medium"
      href={href ?? ''}
      textAlign="center"
      _hover={{ color: 'accent' }}
      {...props}
    >
      {isActive ? (
        <Box as="span">• </Box>
      ) : (
        <Box as="span" color="transparent">
          •{' '}
        </Box>
      )}
      {props.children}
      {isActive ? (
        <Box as="span"> •</Box>
      ) : (
        <Box as="span" color="transparent">
          {' '}
          •
        </Box>
      )}
    </Link>
  );
};
