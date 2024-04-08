import {
  Box,
  // Link,
  LinkProps,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

export const ActiveLink: React.FC<LinkProps> = ({ href, ...props }) => {
  const { pathname } = useRouter();
  const isActive = pathname === href;

  return (
    <NextLink href={href ?? ''} prefetch={false}>
      <Box as="span" color={isActive ? 'unset' : 'transparent'}>
        {'• '}
      </Box>
      {props.children}
      <Box as="span" color={isActive ? 'unset' : 'transparent'}>
        {' •'}
      </Box>
    </NextLink>
    //   <Link
    //   as={NextLink}
    //   color={isActive ? 'accent' : 'inherit'}
    //   fontSize="sm"
    //   fontWeight="medium"
    //   href={href ?? ''}
    //   textAlign="center"
    //   _hover={{ color: 'accent' }}
    //   {...props}
    // >
    //   <Box as="span" color={isActive ? 'unset' : 'transparent'}>
    //     {'• '}
    //   </Box>
    //   {props.children}
    //   <Box as="span" color={isActive ? 'unset' : 'transparent'}>
    //     {' •'}
    //   </Box>
    // </Link>
  );
};
