import { Link, LinkProps } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

export const ActiveLink: React.FC<LinkProps> = ({ href, ...props }) => {
  const { pathname } = useRouter();
  const isActive = pathname === href;

  return (
    <Link
      as={NextLink}
      href={href ?? ''}
      fontWeight="medium"
      fontSize={'sm'}
      color={isActive ? 'accent' : 'inherit'}
      w="110px"
      textAlign="center"
      _hover={{ color: 'accent' }}
      {...props}
    >
      {isActive ? '• ' + props.children + ' •' : props.children}
    </Link>
  );
};
